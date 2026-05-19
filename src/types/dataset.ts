export type PostureLabel =
  | "good_posture"
  | "shrimp_slouch"
  | "forward_lean"
  | "looking_down";

export type CameraAngle = "front" | "left_angle" | "right_angle" | "side";

export type QualityStatus = "valid" | "dropped";

export type DropReason =
  | "NO_POSE"
  | "MISSING_SHOULDERS"
  | "MISSING_HEAD"
  | "INVALID_SCALE"
  | "LOW_CONFIDENCE"
  | "INVALID_NORMALIZATION";

export type PoseLandmark = {
  index: number;
  name: string;
  x: number;
  y: number;
  z: number;
  visibility?: number;
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

export type PoseSample = {
  sample_id: string;
  recording_id: string;
  person_id: string;
  session_id: string;
  camera_angle: CameraAngle;
  label: PostureLabel;
  timestamp_ms: number;
  pose_confidence: number;
  quality_status: QualityStatus;
  drop_reason?: DropReason;
  raw_landmarks: PoseLandmark[];
  normalized_landmarks: PoseLandmark[];
  training_landmarks: PoseLandmark[];
  features: PostureFeatures;
};

export type Recording = {
  recording_id: string;
  person_id: string;
  session_id: string;
  camera_angle: CameraAngle;
  label: PostureLabel;
  started_at: string;
  duration_sec: number;
  sampling_fps: number;
  valid_sample_count: number;
  dropped_sample_count: number;
  samples: PoseSample[];
};

export type CollectionSettings = {
  person_id: string;
  session_id: string;
  camera_angle: CameraAngle;
  label: PostureLabel;
  duration_sec: number;
  sampling_fps: number;
};

export type PosePoint = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type LatestPoseFrame = {
  landmarks: PosePoint[][];
  timestamp_ms: number;
};

export type RecordingSummary = {
  recording_id: string;
  person_id: string;
  session_id: string;
  camera_angle: CameraAngle;
  label: PostureLabel;
  duration_sec: number;
  sampling_fps: number;
  valid_sample_count: number;
  dropped_sample_count: number;
};

export type ValidationStatus = "PASS" | "FAIL" | "WARNING";

export type ValidationCheck = {
  name: string;
  status: ValidationStatus;
  message: string;
};

export type DatasetJson = {
  schema_version: string;
  dataset_version: string;
  created_at: string;
  recordings: Recording[];
};
