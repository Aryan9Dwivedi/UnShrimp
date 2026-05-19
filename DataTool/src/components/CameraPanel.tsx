import type { CameraError, CameraState } from "../hooks/useCamera";
import type { PoseModelStatus } from "../hooks/usePoseLandmarker";

type CameraPanelProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraState: CameraState;
  cameraError: CameraError | null;
  modelStatus: PoseModelStatus;
  modelMessage: string;
  poseDetected: boolean;
  poseConfidence: number;
  fps: number;
  onStartCamera: () => void;
  onStopCamera: () => void;
};

export function CameraPanel({
  videoRef,
  canvasRef,
  cameraState,
  cameraError,
  modelStatus,
  modelMessage,
  poseDetected,
  poseConfidence,
  fps,
  onStartCamera,
  onStopCamera,
}: CameraPanelProps) {
  const cameraActive = cameraState === "camera_active";

  return (
    <section className="panel panel-large">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Camera and Pose Status</p>
          <h2>Live capture</h2>
        </div>
        <span className={`status-pill status-${cameraActive ? "good" : "neutral"}`}>{cameraState}</span>
      </div>

      <div className="camera-frame">
        {!cameraActive && <div className="camera-empty">Camera is off. Click Start Camera to begin.</div>}
        <video ref={videoRef} muted playsInline className={cameraActive ? "video visible" : "video"} />
        <canvas ref={canvasRef} className="pose-canvas" />
      </div>

      <div className="button-row">
        <button type="button" onClick={onStartCamera} disabled={cameraState === "camera_requesting_permission" || cameraActive}>
          Start Camera
        </button>
        <button type="button" className="secondary" onClick={onStopCamera} disabled={!cameraActive}>
          Stop Camera
        </button>
      </div>

      <div className="status-grid">
        <StatusItem label="Pose Model" value={modelStatus} />
        <StatusItem label="Model Message" value={modelMessage} wide />
        <StatusItem label="Pose Detected" value={poseDetected ? "yes" : "no"} />
        <StatusItem label="Pose Confidence" value={poseConfidence ? poseConfidence.toFixed(2) : "0.00"} />
        <StatusItem label="FPS Estimate" value={fps ? String(fps) : "--"} />
        <StatusItem label="Error" value={cameraError ? cameraError.message : "None"} wide />
      </div>
    </section>
  );
}

function StatusItem({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "status-item wide" : "status-item"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
