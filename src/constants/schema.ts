import { LANDMARK_NAMES } from "./landmarks";

export const SCHEMA_VERSION = "1.0.0";
export const DATASET_VERSION = "0.1.0";
export const LOCAL_STORAGE_KEY = "unshrimp_datatool_recordings_v1";
export const STORAGE_WARNING_BYTES = 4_000_000;

export const FEATURE_NAMES = [
  "shoulder_slope",
  "shoulder_width",
  "head_center_x",
  "head_center_y",
  "shoulder_midpoint_x",
  "shoulder_midpoint_y",
  "hip_midpoint_x",
  "hip_midpoint_y",
  "head_to_shoulder_x_offset",
  "head_to_shoulder_y_offset",
  "nose_to_shoulder_y_offset",
  "torso_lean_proxy",
  "head_drop_proxy",
  "side_lean_proxy",
] as const;

export const CSV_COLUMNS = [
  "sample_id",
  "recording_id",
  "person_id",
  "session_id",
  "camera_angle",
  "label",
  "timestamp_ms",
  "pose_confidence",
  "quality_status",
  ...LANDMARK_NAMES.flatMap((_, index) => [
    `x_${index}`,
    `y_${index}`,
    `z_${index}`,
    `v_${index}`,
  ]),
  ...FEATURE_NAMES,
];
