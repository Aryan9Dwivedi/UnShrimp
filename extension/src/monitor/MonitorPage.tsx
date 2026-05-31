import { useRef } from "react";
import { CalibrationPanel } from "../components/CalibrationPanel";
import { DebugStatusPanel } from "../components/DebugStatusPanel";
import { PostureStatusPanel } from "../components/PostureStatusPanel";
import { SoundSettings } from "../components/SoundSettings";
import { WebcamPanel } from "../components/WebcamPanel";
import { useCamera } from "../hooks/useCamera";
import { usePostureMonitor } from "../hooks/usePostureMonitor";
import { useSoundSettings } from "../hooks/useSoundSettings";
import type { AppState } from "../types/appTypes";

export function MonitorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    videoRef,
    cameraState,
    monitoringState,
    error: cameraError,
    startCamera,
    stopCamera
  } = useCamera();
  const soundSettings = useSoundSettings();
  const postureMonitor = usePostureMonitor({
    videoRef,
    canvasRef,
    cameraState,
    soundEnabled: soundSettings.soundEnabled,
    playAlertSound: soundSettings.playAlertSound
  });

  const error = cameraError;
  const hasActivity =
    cameraState !== "camera_off" ||
    postureMonitor.calibrationState !== "not_calibrated" ||
    monitoringState !== "not_monitoring";
  const appState: AppState =
    error || postureMonitor.modelStatus === "error" || postureMonitor.poseStatus === "error"
      ? "error"
      : hasActivity
        ? "ready"
        : "idle";

  const isCameraStarting = cameraState === "camera_requesting_permission";
  const isCameraActive = cameraState === "camera_active";

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">UnShrimp</p>
          <h1>Posture monitor</h1>
        </div>
        <span className={`state-pill ${appState}`}>{appState}</span>
      </header>

      {(error || postureMonitor.errorMessage) && (
        <section className="error-banner" role="alert">
          {error?.message ?? postureMonitor.errorMessage}
        </section>
      )}

      <div className="monitor-grid">
        <section className="main-column">
          <WebcamPanel
            videoRef={videoRef}
            canvasRef={canvasRef}
            cameraState={cameraState}
            errorMessage={cameraError?.message ?? null}
          />

          <section className="panel">
            <div className="panel-heading">
              <h2>Controls</h2>
            </div>
            <div className="button-row">
              <button
                className="button primary"
                type="button"
                onClick={startCamera}
                disabled={isCameraStarting || isCameraActive}
              >
                Start Monitoring
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={stopCamera}
                disabled={!isCameraActive}
              >
                Stop Monitoring
              </button>
            </div>
          </section>
        </section>

        <aside className="side-column">
          <PostureStatusPanel
            result={postureMonitor.result}
            isMonitoring={monitoringState === "monitoring"}
            isCalibrated={postureMonitor.isCalibrated}
          />
          <CalibrationPanel
            calibrationState={postureMonitor.calibrationState}
            countdown={postureMonitor.calibrationCountdown}
            onCalibrate={postureMonitor.startCalibration}
          />
          <SoundSettings
            soundEnabled={soundSettings.soundEnabled}
            selectedSound={soundSettings.selectedSound}
            onSoundEnabledChange={soundSettings.setSoundEnabled}
            onSelectedSoundChange={soundSettings.setSelectedSound}
            onTestSound={soundSettings.playTestSound}
          />
          <DebugStatusPanel
            appState={appState}
            cameraState={cameraState}
            calibrationState={postureMonitor.calibrationState}
            monitoringState={monitoringState}
            soundEnabled={soundSettings.soundEnabled}
            selectedSound={soundSettings.selectedSound}
            modelStatus={postureMonitor.modelStatus}
            poseStatus={postureMonitor.poseStatus}
            poseConfidence={postureMonitor.poseConfidence}
            fps={postureMonitor.fps}
            error={error}
            pipelineError={postureMonitor.errorMessage}
          />
        </aside>
      </div>
    </main>
  );
}
