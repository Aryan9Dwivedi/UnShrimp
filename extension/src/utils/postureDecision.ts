import { POSTURE_MESSAGES } from "../constants/posture";
import type {
  CalibrationBaseline,
  PostureFeatures,
  PostureLabel,
  PredictionResult
} from "../types/postureTypes";
import type { ModelPrediction } from "./modelInference";

const BAD_LABELS = new Set<PostureLabel>(["shrimp_slouch", "forward_lean", "looking_down"]);

export function combinePostureDecision(
  prediction: ModelPrediction,
  features: PostureFeatures,
  baseline: CalibrationBaseline | null,
  smoothedLabel: PostureLabel
): PredictionResult {
  const ruleLabel = classifyWithRules(features, baseline);
  let label = smoothedLabel;
  let confidence = prediction.confidence;
  let message = POSTURE_MESSAGES[label];

  if (features.upper_body_confidence < 0.5) {
    label = "uncertain";
    confidence = features.upper_body_confidence;
    message = POSTURE_MESSAGES.uncertain;
  } else if (prediction.label === "good_posture" && ruleLabel !== "good_posture") {
    label = "good_posture";
    confidence = Math.min(prediction.confidence, 0.65);
    message = "Looks mostly okay, but your calibrated baseline shows a small posture drift.";
  } else if (prediction.label !== "good_posture" && ruleLabel === "good_posture") {
    label = prediction.label;
    confidence = Math.min(prediction.confidence, 0.74);
    message = `${POSTURE_MESSAGES[prediction.label]} Watching before alerting.`;
  } else if (label !== "good_posture" && label !== "uncertain") {
    message = POSTURE_MESSAGES[label];
  }

  return {
    label,
    nnLabel: prediction.label,
    ruleLabel,
    confidence,
    score: scorePosture(label, prediction, features, baseline),
    message,
    alertReady: BAD_LABELS.has(label) && confidence >= 0.55
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

  const base = baseline.features;
  const headDropDelta = features.head_drop_proxy - base.head_drop_proxy;
  const headYOffsetDelta =
    features.head_to_shoulder_y_offset - base.head_to_shoulder_y_offset;
  const headZDelta = features.head_to_shoulder_z_offset - base.head_to_shoulder_z_offset;
  const noseZDelta = features.nose_to_shoulder_z_offset - base.nose_to_shoulder_z_offset;
  const sideLeanDelta = features.side_lean_proxy - base.side_lean_proxy;

  if (headDropDelta > 0.28 || headYOffsetDelta > 0.25) {
    return "looking_down";
  }

  if (headZDelta < -0.28 || noseZDelta < -0.35) {
    return "forward_lean";
  }

  if (headYOffsetDelta > 0.18 || sideLeanDelta > 0.16) {
    return "shrimp_slouch";
  }

  return "good_posture";
}

export function getSmoothedLabel(
  predictions: Array<{ label: PostureLabel; timestamp: number }>,
  now: number
): PostureLabel {
  const recent = predictions.filter((prediction) => now - prediction.timestamp <= 5000);
  if (!recent.length) {
    return "uncertain";
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

  return Object.entries(counts).reduce(
    (best, [label, count]) => (count > counts[best] ? (label as PostureLabel) : best),
    "uncertain" as PostureLabel
  );
}

export function isSustainedBadPosture(
  predictions: Array<{ label: PostureLabel; timestamp: number }>,
  now: number
) {
  const recent = predictions.filter((prediction) => now - prediction.timestamp <= 6000);
  if (recent.length < 12) {
    return false;
  }

  const badCount = recent.filter((prediction) => BAD_LABELS.has(prediction.label)).length;
  return badCount / recent.length >= 0.75;
}

function scorePosture(
  label: PostureLabel,
  prediction: ModelPrediction,
  features: PostureFeatures,
  baseline: CalibrationBaseline | null
) {
  if (label === "uncertain") {
    return 0;
  }

  const badProbability =
    (prediction.probabilities.shrimp_slouch ?? 0) +
    (prediction.probabilities.forward_lean ?? 0) +
    (prediction.probabilities.looking_down ?? 0);
  const baselinePenalty = baseline ? Math.min(25, baselineDeviation(features, baseline) * 45) : 8;
  const modelPenalty = label === "good_posture" ? badProbability * 20 : 42 + badProbability * 22;
  return clamp(Math.round(100 - modelPenalty - baselinePenalty), 0, 100);
}

function baselineDeviation(features: PostureFeatures, baseline: CalibrationBaseline) {
  const base = baseline.features;
  return (
    Math.abs(features.head_to_shoulder_x_offset - base.head_to_shoulder_x_offset) +
    Math.abs(features.head_to_shoulder_y_offset - base.head_to_shoulder_y_offset) +
    Math.abs(features.head_to_shoulder_z_offset - base.head_to_shoulder_z_offset) +
    Math.abs(features.head_drop_proxy - base.head_drop_proxy) +
    Math.abs(features.side_lean_proxy - base.side_lean_proxy)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
