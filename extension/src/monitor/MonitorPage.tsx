import { useRef, useState } from "react";
import { CalibrationPanel } from "../components/CalibrationPanel";
import { DebugStatusPanel } from "../components/DebugStatusPanel";
import { PostureStatusPanel } from "../components/PostureStatusPanel";
import { SetupGuide } from "../components/SetupGuide";
import { SoundSettings } from "../components/SoundSettings";
import { WebcamPanel } from "../components/WebcamPanel";
import { ShrimpArt, ShrimpLogo } from "../components/ShrimpArt";
import { useCamera } from "../hooks/useCamera";
import { usePostureMonitor } from "../hooks/usePostureMonitor";
import { useSoundSettings } from "../hooks/useSoundSettings";
import type { AppState } from "../types/appTypes";
import { BRAND_IMAGES } from "../utils/brandAssets";

export function MonitorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [showDebug, setShowDebug] = useState(true);

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
  const isMonitoring = monitoringState === "monitoring";
  const isCalibrated = postureMonitor.isCalibrated;

  const setupStep: 1 | 2 | 3 = !isCameraActive ? 1 : !isCalibrated ? 2 : 3;

  return (
    <main className="monitor-shell shrimp-theme">
      <header className="monitor-header">
        <div className="monitor-brand">
          <ShrimpLogo />
          <div>
            <p className="monitor-eyebrow">UnShrimp</p>
            <h1>
              Posture <span className="title-accent">Pal</span>
            </h1>
            <p className="monitor-tagline">Sit up. Shrimp proud.</p>
          </div>
        </div>
        <div className="monitor-header-meta">
          <span className={`live-indicator ${isMonitoring ? "live" : "paused"}`}>
            {isMonitoring ? "● Monitoring" : "⏸ Paused"}
          </span>
          {!isMonitoring && (
            <div className="header-speech-bubble">
              <ShrimpArt src={BRAND_IMAGES.paused} className="header-speech-shrimp" />
              <p>Taking a break? Your spine is too.</p>
            </div>
          )}
        </div>
      </header>

      {(error || postureMonitor.errorMessage) && (
        <section className="alert-banner" role="alert">
          {error?.message ?? postureMonitor.errorMessage}
        </section>
      )}

      <div className="monitor-layout">
        <section className="monitor-primary">
          <WebcamPanel
            videoRef={videoRef}
            canvasRef={canvasRef}
            cameraState={cameraState}
            errorMessage={cameraError?.message ?? null}
          />

          <div className="monitor-actions">
            <div className="action-block">
              <button
                className="button button-primary button-play"
                type="button"
                onClick={startCamera}
                disabled={isCameraStarting || isCameraActive}
              >
                <span className="button-icon" aria-hidden="true">
                  ▶
                </span>
                {isCameraStarting ? "Starting camera…" : "Begin Unshrimping"}
              </button>
              <p className="helper-caption">Let's get that posture perfect!</p>
            </div>
            <div className="action-block action-block-stop">
              <button
                className="button button-stop"
                type="button"
                onClick={stopCamera}
                disabled={!isCameraActive}
              >
                <span className="button-icon" aria-hidden="true">
                  ■
                </span>
                Stop
              </button>
              <p className="helper-caption">I need a break.</p>
            </div>
          </div>

          {!isMonitoring && (
            <section className="surface-card setup-card">
              <div className="card-title-row setup-title-row">
                <div className="card-title-group">
                  <span className="card-icon" aria-hidden="true">
                    🚀
                  </span>
                  <h2>Quick setup</h2>
                </div>
                <span className="setup-kicker">Easy as 1-2-3… shrimp!</span>
              </div>
              <SetupGuide step={setupStep} />
              <div className="fun-fact">
                <img src={BRAND_IMAGES.funFact} alt="" aria-hidden="true" />
                <p>Fun fact: Shrimp have incredible posture. You can too. Maybe. ♥</p>
              </div>
            </section>
          )}

          <section className="tip-banner">
            <span className="tip-icon" aria-hidden="true">
              💡
            </span>
            <p>
              <strong>Shrimp tip of the day:</strong> A straight back today means fewer creaks
              tomorrow. (Also: you look 48% cooler.)
            </p>
          </section>
        </section>

        <aside className="monitor-sidebar">
          <PostureStatusPanel
            result={postureMonitor.result}
            activeRoast={postureMonitor.activeRoast}
            isMonitoring={isMonitoring}
            isCalibrated={isCalibrated}
          />

          <CalibrationPanel
            calibrationState={postureMonitor.calibrationState}
            countdown={postureMonitor.calibrationCountdown}
            onCalibrate={postureMonitor.startCalibration}
            disabled={!isCameraActive}
          />

          <section className="surface-card settings-card settings-card-open">
            <button
              type="button"
              className="settings-toggle"
              aria-expanded={showSettings}
              onClick={() => setShowSettings((open) => !open)}
            >
              <span className="settings-toggle-label">
                🚨 Anti-Shrimp Protocols
              </span>
              <span className="settings-chevron">{showSettings ? "▾" : "▸"}</span>
            </button>
            {showSettings && (
              <div className="settings-body">
                <SoundSettings
                  soundEnabled={soundSettings.soundEnabled}
                  selectedSound={soundSettings.selectedSound}
                  onSoundEnabledChange={soundSettings.setSoundEnabled}
                  onSelectedSoundChange={soundSettings.setSelectedSound}
                  onTestSound={soundSettings.playTestSound}
                  embedded
                />
              </div>
            )}
          </section>

          <section className="surface-card settings-card settings-card-open">
            <button
              type="button"
              className="settings-toggle"
              aria-expanded={showDebug}
              onClick={() => setShowDebug((open) => !open)}
            >
              <span className="settings-toggle-label">
                <span className="card-icon code-icon" aria-hidden="true">
                  {"</>"}
                </span>
                Shrimp Lab
              </span>
              <span className="settings-chevron">{showDebug ? "▾" : "▸"}</span>
            </button>
            {showDebug && (
              <div className="settings-body">
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
                  result={postureMonitor.result}
                  error={error}
                  pipelineError={postureMonitor.errorMessage}
                  embedded
                />
                <p className="debug-quote">We shrimp, therefore we debug.</p>
              </div>
            )}
          </section>
        </aside>
      </div>

      <footer className="monitor-footer">
        <p>
          Processed locally in your browser. UnShrimp never stores photos or video from your webcam.
        </p>
        <span className="footer-shield" aria-hidden="true">
          🛡
        </span>
      </footer>
    </main>
  );
}
