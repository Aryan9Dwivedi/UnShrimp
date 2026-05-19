import { LANDMARK_INDEX } from "../constants/landmarks";
import type { PoseLandmark } from "../types/dataset";

const MIN_SHOULDER_SCALE = 0.0001;

export function getShoulderScale(landmarks: PoseLandmark[]): number {
  const left = landmarks[LANDMARK_INDEX.left_shoulder];
  const right = landmarks[LANDMARK_INDEX.right_shoulder];

  if (!left || !right) {
    return Number.NaN;
  }

  return distance(left, right);
}

export function hasValidScale(scale: number): boolean {
  return Number.isFinite(scale) && scale > MIN_SHOULDER_SCALE;
}

export function normalizeLandmarks(landmarks: PoseLandmark[]): PoseLandmark[] {
  const left = landmarks[LANDMARK_INDEX.left_shoulder];
  const right = landmarks[LANDMARK_INDEX.right_shoulder];
  const scale = getShoulderScale(landmarks);

  if (!left || !right || !hasValidScale(scale)) {
    return [];
  }

  const center = {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
  };

  return landmarks.map((landmark) => ({
    ...landmark,
    x: (landmark.x - center.x) / scale,
    y: (landmark.y - center.y) / scale,
    z: landmark.z / scale,
  }));
}

export function hasInvalidLandmarkValues(landmarks: PoseLandmark[]): boolean {
  return landmarks.some(
    (landmark) =>
      !Number.isFinite(landmark.x) ||
      !Number.isFinite(landmark.y) ||
      !Number.isFinite(landmark.z) ||
      (landmark.visibility !== undefined && !Number.isFinite(landmark.visibility)),
  );
}

export function distance(
  a: Pick<PoseLandmark, "x" | "y">,
  b: Pick<PoseLandmark, "x" | "y">,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
