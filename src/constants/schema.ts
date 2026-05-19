import { TRAINING_LANDMARK_NAMES } from "./landmarks";

export const SCHEMA_VERSION = "2.0.0";
export const DATASET_VERSION = "0.2.0";
export const LOCAL_STORAGE_KEY = "unshrimp_datatool_recordings_v2";
export const STORAGE_WARNING_BYTES = 4_000_000;

export const FEATURE_NAMES = [
  "shoulder_slope",
  "head_center_x",
  "head_center_y",
  "head_center_z",
  "shoulder_midpoint_x",
  "shoulder_midpoint_y",
  "shoulder_midpoint_z",
  "head_to_shoulder_x_offset",
  "head_to_shoulder_y_offset",
  "head_to_shoulder_z_offset",
  "nose_to_shoulder_y_offset",
  "nose_to_shoulder_z_offset",
  "face_tilt_proxy",
  "head_drop_proxy",
  "side_lean_proxy",
  "upper_body_confidence",
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
  ...TRAINING_LANDMARK_NAMES.flatMap((name) => [
    `${name}_x`,
    `${name}_y`,
    `${name}_z`,
    `${name}_v`,
  ]),
  ...FEATURE_NAMES,
];
