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
        {calibrationState === "calibrated" ? "Recalibrate" : "Calibrate"}
      </button>

      <div className="calibration-status">
        {isCalibrating && <p>Sit normally and hold still: {countdown}</p>}
        {calibrationState === "calibrated" && <p>Personal baseline saved.</p>}
        {calibrationState === "not_calibrated" && <p>Calibrate once after starting the camera.</p>}
        {calibrationState === "calibration_error" && <p>Calibration needs a clear seated pose.</p>}
      </div>
    </section>
  );
}
