import { POSTURE_LABEL_TEXT } from "../constants/posture";
import type { PredictionResult } from "../types/postureTypes";

type PostureStatusPanelProps = {
  result: PredictionResult;
  isMonitoring: boolean;
  isCalibrated: boolean;
};

export function PostureStatusPanel({
  result,
  isMonitoring,
  isCalibrated
}: PostureStatusPanelProps) {
  return (
    <section className={`panel posture-panel posture-${result.label}`}>
      <div className="panel-heading">
        <h2>Posture</h2>
        <span className={`status-chip posture-chip ${result.label}`}>
          {POSTURE_LABEL_TEXT[result.label]}
        </span>
      </div>

      <div className="score-block">
        <div className="score-number">{isMonitoring ? result.score : "--"}</div>
        <div className="score-label">score</div>
      </div>

      <div className="score-bar" aria-hidden="true">
        <span style={{ width: `${isMonitoring ? result.score : 0}%` }} />
      </div>

      <p className="posture-message">
        {isMonitoring ? result.message : "Start monitoring to begin posture feedback."}
      </p>

      <div className="compact-facts">
        <div>
          <span>NN</span>
          <strong>{POSTURE_LABEL_TEXT[result.nnLabel]}</strong>
        </div>
        <div>
          <span>Rule</span>
          <strong>{POSTURE_LABEL_TEXT[result.ruleLabel]}</strong>
        </div>
        <div>
          <span>Calibration</span>
          <strong>{isCalibrated ? "ready" : "needed"}</strong>
        </div>
      </div>
    </section>
  );
}
