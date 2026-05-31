import { POSTURE_MESSAGES } from "../constants/posture";
import type {
  CalibrationBaseline,
  PostureFeatures,
  PostureLabel,
  PredictionResult
} from "../types/postureTypes";
import type { ModelPrediction } from "./modelInference";

const BAD_LABELS = new Set<PostureLabel>(["shrimp_slouch", "forward_lean", "looking_down"]);
const GOOD_BASELINE_TOLERANCE = 0.38;

export function combinePostureDecision(
  prediction: ModelPrediction,
  features: PostureFeatures,
  baseline: CalibrationBaseline | null,
  smoothedLabel: PostureLabel
): PredictionResult {
  const baselineDecision = baseline ? classifyAgainstBaseline(features, baseline) : null;
  const ruleLabel = baselineDecision?.label ?? classifyWithRules(features, null);
  let label = baselineDecision?.label ?? smoothedLabel;
  let confidence = prediction.confidence;
  let message = POSTURE_MESSAGES[label];

  if (features.upper_body_confidence < 0.5) {
    label = "uncertain";
    confidence = features.upper_body_confidence;
    message = POSTURE_MESSAGES.uncertain;
  } else if (baselineDecision && baselineDecision.severity <= GOOD_BASELINE_TOLERANCE) {
    label = "good_posture";
    confidence = Math.max(0.78, 1 - baselineDecision.severity);
    message = "You are close to your calibrated upright posture.";
  } else if (!baseline) {
    label = prediction.label === "good_posture" ? "good_posture" : smoothedLabel;
    confidence = Math.min(prediction.confidence, 0.72);
    message =
      label === "good_posture"
        ? POSTURE_MESSAGES.good_posture
        : "Calibrate first so UnShrimp can compare against your normal sitting posture.";
  } else if (prediction.label === "good_posture" && ruleLabel !== "good_posture") {
    label = "good_posture";
    confidence = Math.min(prediction.confidence, 0.65);
    message = "Looks mostly okay, but your calibrated baseline shows a small posture drift.";
  } else if (prediction.label !== "good_posture" && ruleLabel === "good_posture") {
    label = "good_posture";
    confidence = 0.78;
    message = "NN is unsure, but you are still close to your calibrated posture.";
  } else if (baselineDecision && baselineDecision.severity < 0.58) {
    label = "good_posture";
    confidence = 0.72;
    message = "Small movement detected. Holding before calling it bad posture.";
  } else if (label !== "good_posture" && label !== "uncertain") {
    message = POSTURE_MESSAGES[label];
  }

  return {
    label,
    nnLabel: prediction.label,
    ruleLabel,
    confidence,
    score: scorePosture(label, prediction, features, baseline, baselineDecision?.severity ?? null),
    message,
    alertReady: Boolean(baseline) && BAD_LABELS.has(label) && confidence >= 0.65
  };
}

export function classifyWithRules(
  features: PostureFeatures,
  baseline: CalibrationBaseline | null
): PostureLabel {
  if (features.upper_body_confidence < 0.5) {
    return "uncertain";
  }

  if (!baseline) {
    if (features.head_drop_proxy > -0.55 || features.head_to_shoulder_y_offset > -0.6) {
      return "looking_down";
    }

    if (features.nose_to_shoulder_z_offset < -2.25 || features.head_to_shoulder_z_offset < -0.9) {
      return "forward_lean";
    }

    if (features.side_lean_proxy > 0.18 || features.head_to_shoulder_y_offset > -0.85) {
      return "shrimp_slouch";
    }

    return "good_posture";
  }

  return classifyAgainstBaseline(features, baseline).label;
}

export function getSmoothedLabel(
  predictions: Array<{ label: PostureLabel; timestamp: number }>,
  now: number
): PostureLabel {
  const recent = predictions.filter((prediction) => now - prediction.timestamp <= 8000);
  if (!recent.length) {
    return "uncertain";
  }

  const lastThree = recent.slice(-3);
  if (lastThree.length === 3 && lastThree.every((prediction) => prediction.label === "good_posture")) {
    return "good_posture";
  }

  const counts = recent.reduce<Record<PostureLabel, number>>(
    (accumulator, prediction) => {
      accumulator[prediction.label] += 1;
      return accumulator;
    },
    {
      good_posture: 0,
      shrimp_slouch: 0,
      forward_lean: 0,
      looking_down: 0,
      uncertain: 0
    }
  );

  const bestLabel = Object.entries(counts).reduce(
    (best, [label, count]) => (count > counts[best] ? (label as PostureLabel) : best),
    "uncertain" as PostureLabel
  );

  if (BAD_LABELS.has(bestLabel) && counts[bestLabel] / recent.length < 0.65) {
    return counts.good_posture > 0 ? "good_posture" : "uncertain";
  }

  return bestLabel;
}

export function isSustainedBadPosture(
  predictions: Array<{ label: PostureLabel; timestamp: number }>,
  now: number
) {
  const recent = predictions.filter((prediction) => now - prediction.timestamp <= 10000);
  if (recent.length < 28) {
    return false;
  }

  const badCount = recent.filter((prediction) => BAD_LABELS.has(prediction.label)).length;
  return badCount / recent.length >= 0.85;
}

function scorePosture(
  label: PostureLabel,
  prediction: ModelPrediction,
  features: PostureFeatures,
  baseline: CalibrationBaseline | null,
  baselineSeverity: number | null
) {
  if (label === "uncertain") {
    return 0;
  }

  const badProbability =
    (prediction.probabilities.shrimp_slouch ?? 0) +
    (prediction.probabilities.forward_lean ?? 0) +
    (prediction.probabilities.looking_down ?? 0);
  if (baseline && baselineSeverity !== null) {
    if (label === "good_posture") {
      const smallDriftPenalty = Math.min(18, baselineSeverity * 28);
      const modelDisagreementPenalty = prediction.label === "good_posture" ? 0 : 4;
      return clamp(Math.round(98 - smallDriftPenalty - modelDisagreementPenalty), 72, 100);
    }

    const badness = Math.min(1.5, baselineSeverity);
    return clamp(Math.round(88 - badness * 48 - badProbability * 8), 20, 82);
  }

  const modelPenalty = label === "good_posture" ? badProbability * 10 : 26 + badProbability * 14;
  return clamp(Math.round(82 - modelPenalty), 35, 92);
}

function classifyAgainstBaseline(
  features: PostureFeatures,
  baseline: CalibrationBaseline
): { label: PostureLabel; severity: number } {
  const base = baseline.features;
  const headXDelta = features.head_to_shoulder_x_offset - base.head_to_shoulder_x_offset;
  const headYDelta = features.head_to_shoulder_y_offset - base.head_to_shoulder_y_offset;
  const headZDelta = features.head_to_shoulder_z_offset - base.head_to_shoulder_z_offset;
  const noseYDelta = features.nose_to_shoulder_y_offset - base.nose_to_shoulder_y_offset;
  const noseZDelta = features.nose_to_shoulder_z_offset - base.nose_to_shoulder_z_offset;
  const headDropDelta = features.head_drop_proxy - base.head_drop_proxy;
  const sideLeanDelta = features.side_lean_proxy - base.side_lean_proxy;

  const severity = Math.max(
    Math.abs(headXDelta) / 0.55,
    Math.max(0, headYDelta) / 0.45,
    Math.max(0, noseYDelta) / 0.45,
    Math.max(0, headDropDelta) / 0.45,
    Math.max(0, -headZDelta) / 0.75,
    Math.max(0, -noseZDelta) / 0.85,
    Math.max(0, sideLeanDelta) / 0.42
  );

  if (severity <= GOOD_BASELINE_TOLERANCE) {
    return { label: "good_posture", severity };
  }

  if (headDropDelta > 0.36 || noseYDelta > 0.38 || headYDelta > 0.34) {
    return { label: "looking_down", severity };
  }

  if (headZDelta < -0.55 || noseZDelta < -0.65) {
    return { label: "forward_lean", severity };
  }

  if (headYDelta > 0.28 || sideLeanDelta > 0.24 || (headYDelta > 0.18 && headZDelta < -0.32)) {
    return { label: "shrimp_slouch", severity };
  }

  return { label: "good_posture", severity };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
