import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { LANDMARK_INDEX, LANDMARK_NAMES, UPPER_BODY_TRAINING_LANDMARKS } from "../constants/landmarks";
import type { NormalizedPoint, PostureFeatures } from "../types/postureTypes";

const MIN_CONFIDENCE = 0.5;
const MIN_SHOULDER_SCALE = 0.02;

type PoseBuildResult =
  | {
      ok: true;
      normalizedLandmarks: NormalizedPoint[];
      features: PostureFeatures;
      featureValues: Record<string, number>;
      confidence: number;
    }
  | {
      ok: false;
      reason: "NO_POSE" | "MISSING_SHOULDERS" | "MISSING_HEAD" | "INVALID_SCALE" | "LOW_CONFIDENCE";
      confidence: number;
    };

export function buildPoseFeatures(landmarks?: NormalizedLandmark[]): PoseBuildResult {
  if (!landmarks?.length) {
    return { ok: false, reason: "NO_POSE", confidence: 0 };
  }

  const leftShoulder = landmarks[LANDMARK_INDEX.left_shoulder];
  const rightShoulder = landmarks[LANDMARK_INDEX.right_shoulder];
  if (!isReliable(leftShoulder) || !isReliable(rightShoulder)) {
    return { ok: false, reason: "MISSING_SHOULDERS", confidence: upperBodyConfidence(landmarks) };
  }

  if (!hasHeadSignal(landmarks)) {
    return { ok: false, reason: "MISSING_HEAD", confidence: upperBodyConfidence(landmarks) };
  }

  const shoulderCenter = midpoint(leftShoulder, rightShoulder);
  const shoulderScale = distance(leftShoulder, rightShoulder);
  if (!Number.isFinite(shoulderScale) || shoulderScale < MIN_SHOULDER_SCALE) {
    return { ok: false, reason: "INVALID_SCALE", confidence: upperBodyConfidence(landmarks) };
  }

  const normalizedLandmarks = landmarks.map((landmark, index) => ({
    index,
    name: LANDMARK_NAMES[index] ?? `landmark_${index}`,
    x: (landmark.x - shoulderCenter.x) / shoulderScale,
    y: (landmark.y - shoulderCenter.y) / shoulderScale,
    z: landmark.z / shoulderScale,
    visibility: visibilityOf(landmark)
  }));

  if (!normalizedLandmarks.every((landmark) => isFinitePoint(landmark))) {
    return { ok: false, reason: "INVALID_SCALE", confidence: upperBodyConfidence(landmarks) };
  }

  const confidence = upperBodyConfidence(landmarks);
  if (confidence < MIN_CONFIDENCE) {
    return { ok: false, reason: "LOW_CONFIDENCE", confidence };
  }

  const features = extractFeatures(normalizedLandmarks);
  const featureValues = buildFeatureValues(normalizedLandmarks, features);

  return {
    ok: true,
    normalizedLandmarks,
    features,
    featureValues,
    confidence
  };
}

function extractFeatures(normalizedLandmarks: NormalizedPoint[]): PostureFeatures {
  const nose = point(normalizedLandmarks, "nose");
  const leftShoulder = point(normalizedLandmarks, "left_shoulder");
  const rightShoulder = point(normalizedLandmarks, "right_shoulder");
  const leftEar = point(normalizedLandmarks, "left_ear");
  const rightEar = point(normalizedLandmarks, "right_ear");
  const leftEye = point(normalizedLandmarks, "left_eye");
  const rightEye = point(normalizedLandmarks, "right_eye");
  const shoulderMidpoint = midpoint(leftShoulder, rightShoulder);
  const headCenter =
    isReliablePoint(leftEar) && isReliablePoint(rightEar) ? midpoint(leftEar, rightEar) : nose;
  const faceTiltProxy =
    isReliablePoint(leftEye) && isReliablePoint(rightEye)
      ? rightEye.y - leftEye.y
      : isReliablePoint(leftEar) && isReliablePoint(rightEar)
        ? rightEar.y - leftEar.y
        : 0;

  return {
    shoulder_slope: rightShoulder.y - leftShoulder.y,
    head_center_x: headCenter.x,
    head_center_y: headCenter.y,
    head_center_z: headCenter.z,
    shoulder_midpoint_x: shoulderMidpoint.x,
    shoulder_midpoint_y: shoulderMidpoint.y,
    shoulder_midpoint_z: shoulderMidpoint.z,
    head_to_shoulder_x_offset: headCenter.x - shoulderMidpoint.x,
    head_to_shoulder_y_offset: headCenter.y - shoulderMidpoint.y,
    head_to_shoulder_z_offset: headCenter.z - shoulderMidpoint.z,
    nose_to_shoulder_y_offset: nose.y - shoulderMidpoint.y,
    nose_to_shoulder_z_offset: nose.z - shoulderMidpoint.z,
    face_tilt_proxy: faceTiltProxy,
    head_drop_proxy: nose.y - shoulderMidpoint.y,
    side_lean_proxy: Math.abs(rightShoulder.y - leftShoulder.y),
    upper_body_confidence: average(
      UPPER_BODY_TRAINING_LANDMARKS.map((name) => point(normalizedLandmarks, name).visibility)
    )
  };
}

function buildFeatureValues(
  normalizedLandmarks: NormalizedPoint[],
  features: PostureFeatures
): Record<string, number> {
  const values: Record<string, number> = {};

  UPPER_BODY_TRAINING_LANDMARKS.forEach((name) => {
    const landmark = point(normalizedLandmarks, name);
    values[`${name}_x`] = landmark.x;
    values[`${name}_y`] = landmark.y;
    values[`${name}_z`] = landmark.z;
    values[`${name}_v`] = landmark.visibility;
  });

  Object.entries(features).forEach(([key, value]) => {
    values[key] = Number.isFinite(value) ? value : 0;
  });

  return values;
}

function hasHeadSignal(landmarks: NormalizedLandmark[]) {
  const nose = landmarks[LANDMARK_INDEX.nose];
  const leftEar = landmarks[LANDMARK_INDEX.left_ear];
  const rightEar = landmarks[LANDMARK_INDEX.right_ear];
  const facePoints = [
    LANDMARK_INDEX.left_eye_inner,
    LANDMARK_INDEX.left_eye,
    LANDMARK_INDEX.left_eye_outer,
    LANDMARK_INDEX.right_eye_inner,
    LANDMARK_INDEX.right_eye,
    LANDMARK_INDEX.right_eye_outer,
    LANDMARK_INDEX.mouth_left,
    LANDMARK_INDEX.mouth_right
  ].filter((index) => isReliable(landmarks[index]));

  return isReliable(nose) || (isReliable(leftEar) && isReliable(rightEar)) || facePoints.length >= 3;
}

function upperBodyConfidence(landmarks: NormalizedLandmark[]) {
  return average(
    UPPER_BODY_TRAINING_LANDMARKS.map((name) => visibilityOf(landmarks[LANDMARK_INDEX[name]]))
  );
}

function point<T extends { x: number; y: number; z: number; visibility?: number }>(
  landmarks: T[],
  name: keyof typeof LANDMARK_INDEX
): T & { visibility: number } {
  const fallback = { x: 0, y: 0, z: 0, visibility: 0 } as T & { visibility: number };
  const landmark = landmarks[LANDMARK_INDEX[name]];
  if (!landmark) {
    return fallback;
  }

  return {
    ...landmark,
    visibility: visibilityOf(landmark)
  };
}

function isReliable(landmark: NormalizedLandmark | undefined) {
  return Boolean(landmark) && visibilityOf(landmark) >= MIN_CONFIDENCE;
}

function isReliablePoint(landmark: { visibility?: number }) {
  return visibilityOf(landmark) >= MIN_CONFIDENCE;
}

function visibilityOf(landmark: { visibility?: number } | undefined) {
  return landmark?.visibility ?? 1;
}

function midpoint<T extends { x: number; y: number; z: number }>(first: T, second: T) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    z: (first.z + second.z) / 2
  };
}

function distance<T extends { x: number; y: number }>(first: T, second: T) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isFinitePoint(landmark: NormalizedPoint) {
  return (
    Number.isFinite(landmark.x) &&
    Number.isFinite(landmark.y) &&
    Number.isFinite(landmark.z) &&
    Number.isFinite(landmark.visibility)
  );
}
