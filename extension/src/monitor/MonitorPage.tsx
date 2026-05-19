import { CalibrationPanel } from "../components/CalibrationPanel";
import { DebugStatusPanel } from "../components/DebugStatusPanel";
import { PostureStatusPanel } from "../components/PostureStatusPanel";
import { SoundSettings } from "../components/SoundSettings";
import { WebcamPanel } from "../components/WebcamPanel";
import { useCalibration } from "../hooks/useCalibration";
import { useCamera } from "../hooks/useCamera";
import { useSoundSettings } from "../hooks/useSoundSettings";
import type { AppState } from "../types/appTypes";

export function MonitorPage() {
  const {
    videoRef,
    cameraState,
    monitoringState,
    error: cameraError,
    startCamera,
    stopCamera
  } = useCamera();
  const {
    calibrationState,
    countdown,
    error: calibrationError,
    startCalibration
  } = useCalibration();
  const soundSettings = useSoundSettings();

  const error = cameraError ?? calibrationError;
  const hasActivity =
    cameraState !== "camera_off" ||
    calibrationState !== "not_calibrated" ||
    monitoringState !== "not_monitoring";
  const appState: AppState = error ? "error" : hasActivity ? "ready" : "idle";

  const isCameraStarting = cameraState === "camera_requesting_permission";
  const isCameraActive = cameraState === "camera_active";

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">UnShrimp</p>
          <h1>Real-time posture monitoring</h1>
        </div>
        <span className={`state-pill ${appState}`}>{appState}</span>
      </header>

      {error && (
        <section className="error-banner" role="alert">
          {error.message}
        </section>
      )}

      <div className="monitor-grid">
        <section className="main-column">
          <WebcamPanel
            videoRef={videoRef}
            cameraState={cameraState}
            errorMessage={cameraError?.message ?? null}
          />

          <section className="panel">
            <div className="panel-heading">
              <h2>Monitoring Controls</h2>
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
          <CalibrationPanel
            calibrationState={calibrationState}
            countdown={countdown}
            onCalibrate={startCalibration}
          />
          <PostureStatusPanel monitoringState={monitoringState} />
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
            calibrationState={calibrationState}
            monitoringState={monitoringState}
            soundEnabled={soundSettings.soundEnabled}
            selectedSound={soundSettings.selectedSound}
            error={error}
          />
        </aside>
      </div>
    </main>
  );
}