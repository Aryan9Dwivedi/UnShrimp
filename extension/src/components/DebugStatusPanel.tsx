import type {
  AlertSound,
  AppError,
  AppState,
  CalibrationState,
  CameraState,
  MonitoringState
} from "../types/appTypes";
import type { ModelStatus, PoseStatus } from "../types/postureTypes";

type DebugStatusPanelProps = {
  appState: AppState;
  cameraState: CameraState;
  calibrationState: CalibrationState;
  monitoringState: MonitoringState;
  soundEnabled: boolean;
  selectedSound: AlertSound;
  modelStatus: ModelStatus;
  poseStatus: PoseStatus;
  poseConfidence: number;
  fps: number;
  error: AppError | null;
  pipelineError: string | null;
};

export function DebugStatusPanel({
  appState,
  cameraState,
  calibrationState,
  monitoringState,
  soundEnabled,
  selectedSound,
  modelStatus,
  poseStatus,
  poseConfidence,
  fps,
  error,
  pipelineError
}: DebugStatusPanelProps) {
  return (
    <section className="panel debug-panel compact-panel">
      <div className="panel-heading">
        <h2>State</h2>
      </div>
      <dl className="debug-list">
        <div>
          <dt>App State:</dt>
          <dd>{appState}</dd>
        </div>
        <div>
          <dt>Camera State:</dt>
          <dd>{cameraState}</dd>
        </div>
        <div>
          <dt>Calibration State:</dt>
          <dd>{calibrationState}</dd>
        </div>
        <div>
          <dt>Monitoring State:</dt>
          <dd>{monitoringState}</dd>
        </div>
        <div>
          <dt>Sound Enabled:</dt>
          <dd>{String(soundEnabled)}</dd>
        </div>
        <div>
          <dt>Selected Sound:</dt>
          <dd>{selectedSound}</dd>
        </div>
        <div>
          <dt>Model:</dt>
          <dd>{modelStatus}</dd>
        </div>
        <div>
          <dt>Pose:</dt>
          <dd>{poseStatus}</dd>
        </div>
        <div>
          <dt>Confidence:</dt>
          <dd>{poseConfidence.toFixed(2)}</dd>
        </div>
        <div>
          <dt>FPS:</dt>
          <dd>{fps || "--"}</dd>
        </div>
        <div>
          <dt>Error:</dt>
          <dd>{error ? `${error.code}: ${error.message}` : pipelineError ?? "None"}</dd>
        </div>
      </dl>
    </section>
  );
}
