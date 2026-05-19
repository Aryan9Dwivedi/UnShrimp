import { LANDMARK_INDEX, TRAINING_LANDMARK_INDICES } from "../constants/landmarks";
import type { PoseLandmark, PostureFeatures } from "../types/dataset";

const RELIABLE_VISIBILITY = 0.5;

export function extractPostureFeatures(
  normalizedLandmarks: PoseLandmark[],
  upperBodyConfidence: number,
): PostureFeatures {
  const nose = normalizedLandmarks[LANDMARK_INDEX.nose];
  const leftEye = normalizedLandmarks[LANDMARK_INDEX.left_eye];
  const rightEye = normalizedLandmarks[LANDMARK_INDEX.right_eye];
  const leftEar = normalizedLandmarks[LANDMARK_INDEX.left_ear];
  const rightEar = normalizedLandmarks[LANDMARK_INDEX.right_ear];
  const leftShoulder = normalizedLandmarks[LANDMARK_INDEX.left_shoulder];
  const rightShoulder = normalizedLandmarks[LANDMARK_INDEX.right_shoulder];

  const shoulderMidpoint = midpoint(leftShoulder, rightShoulder);
  const headCenter =
    isReliable(leftEar) && isReliable(rightEar) ? midpoint(leftEar, rightEar) : nose;
  const shoulderSlope = rightShoulder.y - leftShoulder.y;
  const faceTiltProxy =
    isReliable(leftEye) && isReliable(rightEye)
      ? rightEye.y - leftEye.y
      : isReliable(leftEar) && isReliable(rightEar)
        ? rightEar.y - leftEar.y
        : 0;

  return {
    shoulder_slope: shoulderSlope,
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
    side_lean_proxy: Math.abs(shoulderSlope),
    upper_body_confidence: upperBodyConfidence,
  };
}

export function averageKeyLandmarkVisibility(landmarks: PoseLandmark[]): number {
  const values = TRAINING_LANDMARK_INDICES
    .map((index) => landmarks[index]?.visibility)
    .filter((value): value is number => value !== undefined && Number.isFinite(value));

  if (values.length === 0) {
    return 1;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function midpoint(a: PoseLandmark, b: PoseLandmark): { x: number; y: number; z: number } {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

function isReliable(landmark: PoseLandmark | undefined): landmark is PoseLandmark {
  return Boolean(landmark && (landmark.visibility === undefined || landmark.visibility >= RELIABLE_VISIBILITY));
}
