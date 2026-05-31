import type { CalibrationState } from "./appTypes";

export type PostureLabel =
  | "good_posture"
  | "shrimp_slouch"
  | "forward_lean"
  | "looking_down"
  | "uncertain";

export type ModelStatus = "loading" | "ready" | "error";

export type PoseStatus = "loading" | "ready" | "no_pose" | "low_confidence" | "error";

export type NormalizedPoint = {
  index: number;
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export type PostureFeatures = {
  shoulder_slope: number;
  head_center_x: number;
  head_center_y: number;
  head_center_z: number;
  shoulder_midpoint_x: number;
  shoulder_midpoint_y: number;
  shoulder_midpoint_z: number;
  head_to_shoulder_x_offset: number;
  head_to_shoulder_y_offset: number;
  head_to_shoulder_z_offset: number;
  nose_to_shoulder_y_offset: number;
  nose_to_shoulder_z_offset: number;
  face_tilt_proxy: number;
  head_drop_proxy: number;
  side_lean_proxy: number;
  upper_body_confidence: number;
};

export type CalibrationBaseline = {
  createdAt: string;
  features: PostureFeatures;
};

export type PredictionResult = {
  label: PostureLabel;
  nnLabel: PostureLabel;
  ruleLabel: PostureLabel;
  confidence: number;
  score: number;
  message: string;
  alertReady: boolean;
};

export type PostureMonitorState = {
  modelStatus: ModelStatus;
  poseStatus: PoseStatus;
  poseConfidence: number;
  fps: number;
  result: PredictionResult;
  calibrationState: CalibrationState;
  calibrationCountdown: number | null;
  isCalibrated: boolean;
  errorMessage: string | null;
};
