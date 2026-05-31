import type { PostureLabel } from "../types/postureTypes";

export const POSTURE_LABEL_TEXT: Record<PostureLabel, string> = {
  good_posture: "Good posture",
  shrimp_slouch: "Shrimp slouch",
  forward_lean: "Forward lean",
  looking_down: "Looking down",
  uncertain: "Pose unclear"
};

export const POSTURE_MESSAGES: Record<PostureLabel, string> = {
  good_posture: "You are sitting close to your calibrated posture.",
  shrimp_slouch: "Shrimp posture detected. Lift your chest and reset your shoulders.",
  forward_lean: "You are leaning toward the screen. Sit back slightly.",
  looking_down: "Your head is angled downward. Bring your screen or gaze up.",
  uncertain: "Move your head and shoulders into frame so UnShrimp can read your posture."
};
