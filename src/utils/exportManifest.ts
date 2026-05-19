import { CAMERA_ANGLES, POSTURE_LABELS } from "../constants/labels";
import { TRAINING_LANDMARK_NAMES } from "../constants/landmarks";
import { CSV_COLUMNS, DATASET_VERSION, FEATURE_NAMES, SCHEMA_VERSION } from "../constants/schema";
import type { CameraAngle, PostureLabel, Recording } from "../types/dataset";

export type DatasetManifest = {
  dataset_version: string;
  schema_version: string;
  created_at: string;
  recording_count: number;
  valid_sample_count: number;
  dropped_sample_count: number;
  person_count: number;
  session_count: number;
  label_counts: Record<PostureLabel, number>;
  camera_angle_counts: Record<CameraAngle, number>;
  training_landmarks: string[];
  feature_names: string[];
  csv_columns: string[];
  forbidden_columns_excluded: boolean;
};

export function buildManifest(recordings: Recording[]): DatasetManifest {
  const label_counts = Object.fromEntries(POSTURE_LABELS.map((label) => [label, 0])) as Record<
    PostureLabel,
    number
  >;
  const camera_angle_counts = Object.fromEntries(CAMERA_ANGLES.map((angle) => [angle, 0])) as Record<
    CameraAngle,
    number
  >;

  for (const sample of recordings.flatMap((recording) => recording.samples)) {
    if (sample.quality_status === "valid") {
      label_counts[sample.label] += 1;
      camera_angle_counts[sample.camera_angle] += 1;
    }
  }

  return {
    dataset_version: DATASET_VERSION,
    schema_version: SCHEMA_VERSION,
    created_at: new Date().toISOString(),
    recording_count: recordings.length,
    valid_sample_count: recordings.reduce((sum, recording) => sum + recording.valid_sample_count, 0),
    dropped_sample_count: recordings.reduce((sum, recording) => sum + recording.dropped_sample_count, 0),
    person_count: new Set(recordings.map((recording) => recording.person_id)).size,
    session_count: new Set(recordings.map((recording) => recording.session_id)).size,
    label_counts,
    camera_angle_counts,
    training_landmarks: [...TRAINING_LANDMARK_NAMES],
    feature_names: [...FEATURE_NAMES],
    csv_columns: [...CSV_COLUMNS],
    forbidden_columns_excluded: true,
  };
}

export function buildManifestText(recordings: Recording[]): string {
  return JSON.stringify(buildManifest(recordings), null, 2);
}
