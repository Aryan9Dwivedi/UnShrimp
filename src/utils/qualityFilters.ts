import { LANDMARK_INDEX } from "../constants/landmarks";
import type { DropReason, PoseLandmark } from "../types/dataset";
import { getShoulderScale, hasInvalidLandmarkValues, hasValidScale } from "./landmarkNormalizer";

export const MIN_POSE_CONFIDENCE = 0.5;

export type QualityResult = {
  isValid: boolean;
  dropReason?: DropReason;
};

export function evaluateRawPoseQuality(
  landmarks: PoseLandmark[] | null | undefined,
  poseConfidence: number,
): QualityResult {
  if (!landmarks || landmarks.length === 0) {
    return dropped("NO_POSE");
  }

  const leftShoulder = landmarks[LANDMARK_INDEX.left_shoulder];
  const rightShoulder = landmarks[LANDMARK_INDEX.right_shoulder];
  if (!isVisible(leftShoulder) || !isVisible(rightShoulder)) {
    return dropped("MISSING_SHOULDERS");
  }

  if (!isVisible(landmarks[LANDMARK_INDEX.nose])) {
    return dropped("MISSING_HEAD");
  }

  if (!hasValidScale(getShoulderScale(landmarks))) {
    return dropped("INVALID_SCALE");
  }

  if (poseConfidence < MIN_POSE_CONFIDENCE) {
    return dropped("LOW_CONFIDENCE");
  }

  return { isValid: true };
}

export function evaluateNormalizedPoseQuality(landmarks: PoseLandmark[]): QualityResult {
  if (landmarks.length !== 33 || hasInvalidLandmarkValues(landmarks)) {
    return dropped("INVALID_NORMALIZATION");
  }

  return { isValid: true };
}

function dropped(dropReason: DropReason): QualityResult {
  return {
    isValid: false,
    dropReason,
  };
}

function isVisible(landmark: PoseLandmark | undefined): boolean {
  return Boolean(landmark && (landmark.visibility === undefined || landmark.visibility >= MIN_POSE_CONFIDENCE));
}
