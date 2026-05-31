import { POSTURE_LABEL_TEXT } from "../constants/posture";
import type { PredictionResult } from "../types/postureTypes";
import { isBadPostureLabel } from "../utils/postureDecision";
import { postureArt } from "../utils/brandAssets";
import { ShrimpArt } from "./ShrimpArt";

type PostureStatusPanelProps = {
  result: PredictionResult;
  activeRoast: string | null;
  isMonitoring: boolean;
  isCalibrated: boolean;
};

function getScoreTone(score: number): "good" | "warn" | "bad" {
  if (score >= 75) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

export function PostureStatusPanel({
  result,
  activeRoast,
  isMonitoring,
  isCalibrated
}: PostureStatusPanelProps) {
  const score = isMonitoring ? result.score : null;
  const scoreTone = score === null ? "neutral" : getScoreTone(score);
  const showRoast =
    isMonitoring && isCalibrated && activeRoast && isBadPostureLabel(result.label);

  return (
    <section className={`surface-card posture-card posture-card-${result.label}`}>
      <div className="card-title-row">
        <div className="card-title-group">
          <span className="card-icon" aria-hidden="true">
            🏆
          </span>
          <h2>Shrimp Index</h2>
        </div>
        <span className={`posture-badge ${result.label}`}>
          {POSTURE_LABEL_TEXT[result.label]}
        </span>
      </div>

      <div className="posture-card-body">
        <div className="posture-score-row">
          <div className={`posture-score ${scoreTone}`}>
            <span className="posture-score-value">{score ?? "?"}</span>
            <span className="posture-score-caption">Shrimp Index</span>
          </div>
          <div className="posture-score-bar" aria-hidden="true">
            <span style={{ width: `${score ?? 0}%` }} />
          </div>
        </div>

        <ShrimpArt src={postureArt(result.label, isMonitoring)} className="card-art" />
      </div>

      <p className={`posture-feedback${showRoast ? " posture-feedback-roast" : ""}`}>
        {!isMonitoring
          ? "We can't tell what you're doing yet! Begin Unshrimping to get live feedback and become a posture pro."
          : !isCalibrated
            ? "Calibrate once while sitting normally to personalize detection."
            : showRoast
              ? activeRoast
              : result.message}
      </p>
    </section>
  );
}
