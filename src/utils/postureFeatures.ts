import { LANDMARK_INDEX } from "../constants/landmarks";
import type { PoseLandmark, PostureFeatures } from "../types/dataset";
import { distance } from "./landmarkNormalizer";

export function extractPostureFeatures(
  normalizedLandmarks: PoseLandmark[],
  poseConfidence: number,
): PostureFeatures {
  const nose = normalizedLandmarks[LANDMARK_INDEX.nose];
  const leftEar = normalizedLandmarks[LANDMARK_INDEX.left_ear];
  const rightEar = normalizedLandmarks[LANDMARK_INDEX.right_ear];
  const leftShoulder = normalizedLandmarks[LANDMARK_INDEX.left_shoulder];
  const rightShoulder = normalizedLandmarks[LANDMARK_INDEX.right_shoulder];
  const leftHip = normalizedLandmarks[LANDMARK_INDEX.left_hip];
  const rightHip = normalizedLandmarks[LANDMARK_INDEX.right_hip];

  const shoulderMidpoint = midpoint(leftShoulder, rightShoulder);
  const headCenter =
    hasVisibility(leftEar) && hasVisibility(rightEar) ? midpoint(leftEar, rightEar) : nose;
  const hipMidpoint =
    hasVisibility(leftHip) && hasVisibility(rightHip) ? midpoint(leftHip, rightHip) : null;

  const shoulderSlope = rightShoulder.y - leftShoulder.y;

  return {
    shoulder_slope: shoulderSlope,
    shoulder_width: distance(leftShoulder, rightShoulder),
    head_center_x: headCenter.x,
    head_center_y: headCenter.y,
    shoulder_midpoint_x: shoulderMidpoint.x,
    shoulder_midpoint_y: shoulderMidpoint.y,
    hip_midpoint_x: hipMidpoint?.x ?? null,
    hip_midpoint_y: hipMidpoint?.y ?? null,
    head_to_shoulder_x_offset: headCenter.x - shoulderMidpoint.x,
    head_to_shoulder_y_offset: headCenter.y - shoulderMidpoint.y,
    nose_to_shoulder_y_offset: nose.y - shoulderMidpoint.y,
    torso_lean_proxy: hipMidpoint ? shoulderMidpoint.x - hipMidpoint.x : null,
    head_drop_proxy: nose.y - shoulderMidpoint.y,
    side_lean_proxy: Math.abs(shoulderSlope),
    pose_confidence: poseConfidence,
  };
}

export function averageKeyLandmarkVisibility(landmarks: PoseLandmark[]): number {
  const keyIndexes = [
    LANDMARK_INDEX.nose,
    LANDMARK_INDEX.left_ear,
    LANDMARK_INDEX.right_ear,
    LANDMARK_INDEX.left_shoulder,
    LANDMARK_INDEX.right_shoulder,
    LANDMARK_INDEX.left_hip,
    LANDMARK_INDEX.right_hip,
  ];
  const values = keyIndexes
    .map((index) => landmarks[index]?.visibility)
    .filter((value): value is number => value !== undefined && Number.isFinite(value));

  if (values.length === 0) {
    return 1;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function midpoint(a: PoseLandmark, b: PoseLandmark): { x: number; y: number } {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function hasVisibility(landmark: PoseLandmark | undefined): landmark is PoseLandmark {
  return Boolean(landmark && (landmark.visibility === undefined || landmark.visibility > 0));
}
