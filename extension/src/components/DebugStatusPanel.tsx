import type {
  AlertSound,
  AppError,
  AppState,
  CalibrationState,
  CameraState,
  MonitoringState
} from "../types/appTypes";
import { POSTURE_LABEL_TEXT } from "../constants/posture";
import type { ModelStatus, PoseStatus, PredictionResult } from "../types/postureTypes";

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
  result: PredictionResult;
  error: AppError | null;
  pipelineError: string | null;
  embedded?: boolean;
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
  result,
  error,
  pipelineError,
  embedded = false
}: DebugStatusPanelProps) {
  const content = (
    <dl className="debug-list">
      <div>
        <dt>App</dt>
        <dd>{appState}</dd>
      </div>
      <div>
        <dt>Camera</dt>
        <dd>{cameraState}</dd>
      </div>
      <div>
        <dt>Monitoring</dt>
        <dd>{monitoringState}</dd>
      </div>
      <div>
        <dt>Calibration</dt>
        <dd>{calibrationState}</dd>
      </div>
      <div>
        <dt>Model</dt>
        <dd>{modelStatus}</dd>
      </div>
      <div>
        <dt>Pose</dt>
        <dd>{poseStatus}</dd>
      </div>
      <div>
        <dt>NN label</dt>
        <dd>{POSTURE_LABEL_TEXT[result.nnLabel]}</dd>
      </div>
      <div>
        <dt>Rule label</dt>
        <dd>{POSTURE_LABEL_TEXT[result.ruleLabel]}</dd>
      </div>
      <div>
        <dt>Confidence</dt>
        <dd>{poseConfidence.toFixed(2)}</dd>
      </div>
      <div>
        <dt>FPS</dt>
        <dd>{fps || "—"}</dd>
      </div>
      <div>
        <dt>Sound</dt>
        <dd>{soundEnabled ? selectedSound : "off"}</dd>
      </div>
      <div>
        <dt>Error</dt>
        <dd>{error ? `${error.code}: ${error.message}` : pipelineError ?? "None"}</dd>
      </div>
    </dl>
  );

  if (embedded) {
    return <div className="embedded-settings">{content}</div>;
  }

  return (
    <section className="surface-card debug-panel">
      <div className="panel-heading">
        <h2>Shrimp Lab</h2>
      </div>
      {content}
    </section>
  );
}
