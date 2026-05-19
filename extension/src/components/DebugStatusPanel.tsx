import type {
  AlertSound,
  AppError,
  AppState,
  CalibrationState,
  CameraState,
  MonitoringState
} from "../types/appTypes";

type DebugStatusPanelProps = {
  appState: AppState;
  cameraState: CameraState;
  calibrationState: CalibrationState;
  monitoringState: MonitoringState;
  soundEnabled: boolean;
  selectedSound: AlertSound;
  error: AppError | null;
};

export function DebugStatusPanel({
  appState,
  cameraState,
  calibrationState,
  monitoringState,
  soundEnabled,
  selectedSound,
  error
}: DebugStatusPanelProps) {
  return (
    <section className="panel debug-panel">
      <div className="panel-heading">
        <h2>Debug Status</h2>
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
          <dt>Error:</dt>
          <dd>{error ? `${error.code}: ${error.message}` : "None"}</dd>
        </div>
      </dl>
    </section>
  );
}