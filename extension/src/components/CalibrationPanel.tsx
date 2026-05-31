import type { CalibrationState } from "../types/appTypes";
import { BRAND_IMAGES } from "../utils/brandAssets";
import { ShrimpArt } from "./ShrimpArt";

type CalibrationPanelProps = {
  calibrationState: CalibrationState;
  countdown: number | null;
  onCalibrate: () => void;
  disabled?: boolean;
};

function getStatusCopy(calibrationState: CalibrationState, countdown: number | null) {
  if (calibrationState === "calibrating" && countdown !== null) {
    return `Hold your normal seated posture — ${countdown}s remaining`;
  }
  if (calibrationState === "calibrated") {
    return "Your baseline is saved! Recalibrate if you change chairs or camera angle.";
  }
  if (calibrationState === "calibration_error") {
    return "We couldn't read a clear pose. Face the camera with head and shoulders visible.";
  }
  return "Sit upright at your desk, then calibrate so we know your normal posture.";
}

function getStatusLabel(calibrationState: CalibrationState) {
  switch (calibrationState) {
    case "calibrating":
      return "Calibrating";
    case "calibrated":
      return "Ready";
    case "calibration_error":
      return "Try again";
    default:
      return "Needed";
  }
}

export function CalibrationPanel({
  calibrationState,
  countdown,
  onCalibrate,
  disabled = false
}: CalibrationPanelProps) {
  const isCalibrating = calibrationState === "calibrating";

  return (
    <section className="surface-card calibration-card">
      <div className="card-title-row">
        <div className="card-title-group">
          <span className="card-icon" aria-hidden="true">
            ⚙
          </span>
          <h2>Calibration</h2>
        </div>
        <span className={`calibration-badge ${calibrationState}`}>
          {getStatusLabel(calibrationState)}
        </span>
      </div>

      <div className="calibration-card-body">
        <p className="calibration-card-copy">{getStatusCopy(calibrationState, countdown)}</p>
        <ShrimpArt src={BRAND_IMAGES.calibration} className="card-art" />
      </div>

      <button
        className="button button-secondary full-width"
        type="button"
        onClick={onCalibrate}
        disabled={disabled || isCalibrating}
      >
        {calibrationState === "calibrated" ? "Re-measure My Shrimpness" : "Calibrate posture"}
      </button>
    </section>
  );
}
