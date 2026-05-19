import type { CameraAngle, PostureLabel } from "../types/dataset";

export const POSTURE_LABELS: PostureLabel[] = [
  "good_posture",
  "shrimp_slouch",
  "forward_lean",
  "looking_down",
];

export const CAMERA_ANGLES: CameraAngle[] = [
  "front",
  "left_angle",
  "right_angle",
  "side",
];

export const LABEL_DEFINITIONS: Record<PostureLabel, string> = {
  good_posture: "The user is sitting upright in their normal working posture.",
  shrimp_slouch:
    "The user is hunched, rounded forward, or collapsed into a shrimp-like sitting posture.",
  forward_lean: "The user is leaning toward the screen.",
  looking_down:
    "The user is looking down toward keyboard, desk, phone, or notes.",
};
