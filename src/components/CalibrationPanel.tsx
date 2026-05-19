import type { CalibrationState } from "../types/appTypes";

type CalibrationPanelProps = {
  calibrationState: CalibrationState;
  countdown: number | null;
  onCalibrate: () => void;
};

export function CalibrationPanel({
  calibrationState,
  countdown,
  onCalibrate
}: CalibrationPanelProps) {
  const isCalibrating = calibrationState === "calibrating";

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Calibration</h2>
        <span className={`status-chip ${calibrationState}`}>{calibrationState}</span>
      </div>

      <button
        className="button secondary full-width"
        type="button"
        onClick={onCalibrate}
        disabled={isCalibrating}
      >
        Calibrate Posture
      </button>

      <div className="calibration-status">
        {isCalibrating && <p>Hold normal posture. Countdown: {countdown}</p>}
        {calibrationState === "calibrated" && <p>Calibrated</p>}
        {calibrationState === "not_calibrated" && <p>Not calibrated yet.</p>}
        {calibrationState === "calibration_error" && <p>Calibration failed.</p>}
      </div>
    </section>
  );
}