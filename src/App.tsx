import { useMemo, useRef, useState } from "react";
import { CameraPanel } from "./components/CameraPanel";
import { CollectionForm } from "./components/CollectionForm";
import { DatasetReviewPanel } from "./components/DatasetReviewPanel";
import { ExportPanel } from "./components/ExportPanel";
import { ProtocolPanel } from "./components/ProtocolPanel";
import { RecordingPanel } from "./components/RecordingPanel";
import { ValidationPanel } from "./components/ValidationPanel";
import { useCamera } from "./hooks/useCamera";
import { useDataRecorder } from "./hooks/useDataRecorder";
import { usePoseLandmarker } from "./hooks/usePoseLandmarker";
import type { CollectionSettings } from "./types/dataset";
import { summarizeDataset, validateDataset } from "./utils/datasetValidation";

const DEFAULT_SETTINGS: CollectionSettings = {
  person_id: "P001",
  session_id: "S001",
  camera_angle: "front",
  label: "good_posture",
  duration_sec: 15,
  sampling_fps: 5,
};

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<CollectionSettings>(DEFAULT_SETTINGS);
  const { cameraState, cameraError, isCameraActive, startCamera, stopCamera } = useCamera(videoRef);
  const { modelStatus, modelMessage, poseDetected, poseConfidence, fps, latestPoseRef } = usePoseLandmarker(
    videoRef,
    canvasRef,
    isCameraActive,
  );
  const recorder = useDataRecorder();

  const summary = useMemo(() => summarizeDataset(recorder.recordings), [recorder.recordings]);
  const validationChecks = useMemo(() => validateDataset(recorder.recordings), [recorder.recordings]);
  const recordingBusy = recorder.recordingState !== "idle";

  const handleStopCamera = () => {
    if (recordingBusy) {
      recorder.stopRecording();
    }
    stopCamera();
  };

  const handleStartRecording = () => {
    recorder.startRecording(settings, () => latestPoseRef.current, {
      cameraActive: isCameraActive,
      poseModelLoaded: modelStatus === "loaded",
    });
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">UnShrimp DataTool</p>
          <h1>Local landmark-only posture dataset collector for NN training</h1>
        </div>
        <div className="header-status">
          <span className={`status-pill status-${modelStatus === "loaded" ? "good" : "neutral"}`}>{modelStatus}</span>
          <span className={`status-pill status-${poseDetected ? "good" : "neutral"}`}>
            {poseDetected ? "pose_detected" : "no_pose"}
          </span>
        </div>
      </header>

      <div className="layout-grid">
        <CameraPanel
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraState={cameraState}
          cameraError={cameraError}
          modelStatus={modelStatus}
          modelMessage={modelMessage}
          poseDetected={poseDetected}
          poseConfidence={poseConfidence}
          fps={fps}
          onStartCamera={startCamera}
          onStopCamera={handleStopCamera}
        />

        <div className="stack">
          <CollectionForm settings={settings} onChange={setSettings} disabled={recordingBusy} />
          <RecordingPanel
            settings={settings}
            recordingState={recorder.recordingState}
            countdown={recorder.countdown}
            elapsedSec={recorder.elapsedSec}
            activeCounts={recorder.activeCounts}
            lastSummary={recorder.lastSummary}
            recordingError={recorder.recordingError}
            storageWarning={recorder.storageWarning}
            onStartRecording={handleStartRecording}
            onStopRecording={recorder.stopRecording}
            onDiscardLast={recorder.discardLastRecording}
            onClearAll={recorder.clearAllData}
          />
          <ValidationPanel checks={validationChecks} />
          <ExportPanel recordings={recorder.recordings} />
        </div>

        <DatasetReviewPanel summary={summary} />
        <ProtocolPanel />
      </div>
    </main>
  );
}
