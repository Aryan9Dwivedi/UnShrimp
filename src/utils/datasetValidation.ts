import { CAMERA_ANGLES, POSTURE_LABELS } from "../constants/labels";
import { FORBIDDEN_TRAINING_LANDMARK_NAMES, LANDMARK_INDEX, TRAINING_LANDMARK_NAMES } from "../constants/landmarks";
import { CSV_COLUMNS, FEATURE_NAMES, SCHEMA_VERSION } from "../constants/schema";
import type {
  CameraAngle,
  PostureLabel,
  PostureFeatures,
  Recording,
  ValidationCheck,
} from "../types/dataset";
import { buildManifest } from "./exportManifest";

export type DatasetSummary = {
  total_recordings: number;
  total_valid_samples: number;
  total_dropped_samples: number;
  people_count: number;
  session_count: number;
  label_counts: Record<PostureLabel, number>;
  camera_angle_counts: Record<CameraAngle, number>;
  grouped_rows: Array<{
    key: string;
    person_id: string;
    session_id: string;
    camera_angle: CameraAngle;
    label: PostureLabel;
    recording_count: number;
    valid_samples: number;
    dropped_samples: number;
  }>;
  warnings: string[];
};

export function summarizeDataset(recordings: Recording[]): DatasetSummary {
  const label_counts = Object.fromEntries(POSTURE_LABELS.map((label) => [label, 0])) as Record<
    PostureLabel,
    number
  >;
  const camera_angle_counts = Object.fromEntries(CAMERA_ANGLES.map((angle) => [angle, 0])) as Record<
    CameraAngle,
    number
  >;
  const grouped = new Map<DatasetSummary["grouped_rows"][number]["key"], DatasetSummary["grouped_rows"][number]>();

  let totalValid = 0;
  let totalDropped = 0;

  for (const recording of recordings) {
    totalValid += recording.valid_sample_count;
    totalDropped += recording.dropped_sample_count;

    const key = [
      recording.person_id,
      recording.session_id,
      recording.camera_angle,
      recording.label,
    ].join("|");
    const existing =
      grouped.get(key) ??
      {
        key,
        person_id: recording.person_id,
        session_id: recording.session_id,
        camera_angle: recording.camera_angle,
        label: recording.label,
        recording_count: 0,
        valid_samples: 0,
        dropped_samples: 0,
      };

    existing.recording_count += 1;
    existing.valid_samples += recording.valid_sample_count;
    existing.dropped_samples += recording.dropped_sample_count;
    grouped.set(key, existing);

    for (const sample of recording.samples) {
      if (sample.quality_status === "valid") {
        label_counts[sample.label] += 1;
        camera_angle_counts[sample.camera_angle] += 1;
      }
    }
  }

  const people = new Set(recordings.map((recording) => recording.person_id).filter(Boolean));
  const sessions = new Set(recordings.map((recording) => recording.session_id).filter(Boolean));
  const anglesWithSamples = CAMERA_ANGLES.filter((angle) => camera_angle_counts[angle] > 0);
  const nonZeroLabelCounts = Object.values(label_counts).filter((count) => count > 0);
  const warnings: string[] = [];

  if (people.size === 1) warnings.push("Only one person collected.");
  if (sessions.size === 1) warnings.push("Only one session collected.");
  if (anglesWithSamples.length === 1) warnings.push("Only one camera angle collected.");
  if (POSTURE_LABELS.some((label) => label_counts[label] === 0)) {
    warnings.push("Some labels have zero samples.");
  }
  if (isImbalanced(nonZeroLabelCounts)) warnings.push("Dataset is heavily imbalanced.");
  for (const label of POSTURE_LABELS) {
    if (label_counts[label] > 0 && label_counts[label] < 100) {
      warnings.push(`${label} has fewer than 100 valid samples.`);
    }
  }
  if (totalValid + totalDropped > 0 && totalDropped / (totalValid + totalDropped) > 0.25) {
    warnings.push("Dropped sample rate is above 25%.");
  }
  if (hasForbiddenTrainingColumns()) {
    warnings.push("Training CSV contains forbidden lower-body columns.");
  }

  return {
    total_recordings: recordings.length,
    total_valid_samples: totalValid,
    total_dropped_samples: totalDropped,
    people_count: people.size,
    session_count: sessions.size,
    label_counts,
    camera_angle_counts,
    grouped_rows: [...grouped.values()],
    warnings,
  };
}

export function validateDataset(recordings: Recording[]): ValidationCheck[] {
  const samples = recordings.flatMap((recording) => recording.samples);
  const validSamples = samples.filter((sample) => sample.quality_status === "valid");
  const labelCounts = summarizeDataset(recordings).label_counts;
  const invalidLabels = validSamples.filter((sample) => !POSTURE_LABELS.includes(sample.label));
  const manifest = buildManifest(recordings);
  const requiredFeatureNames = FEATURE_NAMES as readonly string[];

  return [
    check(
      "All four labels represented",
      POSTURE_LABELS.every((label) => labelCounts[label] > 0),
      "Every posture label has at least one valid sample.",
      "Collect valid samples for every posture label.",
    ),
    check(
      "At least 2 labels have samples",
      POSTURE_LABELS.filter((label) => labelCounts[label] > 0).length >= 2,
      "At least two posture labels are represented.",
      "Collect at least two labels before trying model preparation.",
    ),
    check(
      "No invalid labels",
      invalidLabels.length === 0,
      "All valid samples use fixed labels.",
      `${invalidLabels.length} valid samples contain labels outside the fixed list.`,
    ),
    sampleCheck(
      "Valid samples keep all 33 raw landmarks",
      validSamples.length,
      validSamples.every((sample) => sample.raw_landmarks.length === 33),
      "All valid samples include 33 raw landmarks.",
      "Some valid samples do not include the full MediaPipe landmark set.",
    ),
    sampleCheck(
      "Valid samples keep all 33 normalized landmarks",
      validSamples.length,
      validSamples.every((sample) => sample.normalized_landmarks.length === 33),
      "All valid samples include 33 normalized landmarks.",
      "Some valid samples do not include the full normalized landmark set.",
    ),
    sampleCheck(
      "Training landmarks are upper-body only",
      validSamples.length,
      validSamples.every(hasValidTrainingLandmarks),
      "Every valid sample includes the selected upper-body training landmarks.",
      "Some valid samples are missing selected upper-body training landmarks.",
    ),
    sampleCheck(
      "Required feature columns exist",
      validSamples.length,
      validSamples.every((sample) => requiredFeatureNames.every((name) => name in sample.features)),
      "Every valid sample includes all required v1 posture features.",
      "Some valid samples are missing v1 posture features.",
    ),
    sampleCheck(
      "Feature values are finite numbers",
      validSamples.length,
      validSamples.every((sample) => featuresAreValid(sample.features)),
      "All v1 feature values are finite numbers.",
      "Feature data contains invalid values.",
    ),
    sampleCheck(
      "No NaN values",
      validSamples.length,
      validSamples.every((sample) => !JSON.stringify(sample).includes("NaN")),
      "No NaN text appears in valid samples.",
      "At least one valid sample contains NaN.",
    ),
    sampleCheck(
      "No Infinity values",
      validSamples.length,
      validSamples.every((sample) => !JSON.stringify(sample).includes("Infinity")),
      "No Infinity text appears in valid samples.",
      "At least one valid sample contains Infinity.",
    ),
    check(
      "CSV export has fixed columns",
      CSV_COLUMNS.length === 77 &&
        CSV_COLUMNS[0] === "sample_id" &&
        CSV_COLUMNS[CSV_COLUMNS.length - 1] === "upper_body_confidence",
      "CSV columns are deterministic and fixed.",
      "CSV column configuration is not the expected fixed schema.",
    ),
    check(
      "Training CSV excludes lower-body columns",
      !hasForbiddenTrainingColumns(),
      "No hip, knee, ankle, heel, or foot columns are in the v1 training CSV.",
      "Forbidden lower-body columns are present in the v1 training CSV.",
    ),
    {
      name: "Hips and legs are not required",
      status: "PASS",
      message: "Valid sample checks use head, face, shoulders, and upper-body landmarks only.",
    },
    {
      name: "JSON export has schema_version",
      status: SCHEMA_VERSION ? "PASS" : "FAIL",
      message: SCHEMA_VERSION ? `schema_version is ${SCHEMA_VERSION}.` : "schema_version is missing.",
    },
    check(
      "Manifest export has label counts",
      POSTURE_LABELS.every((label) => Object.prototype.hasOwnProperty.call(manifest.label_counts, label)) &&
        manifest.training_landmarks.length === TRAINING_LANDMARK_NAMES.length &&
        manifest.forbidden_columns_excluded,
      "Manifest includes label counts, training landmarks, and forbidden_columns_excluded.",
      "Manifest is missing label counts or v1 schema metadata.",
    ),
    {
      name: "Train CSV can be generated by prepare script",
      status: validSamples.length > 0 ? "PASS" : "WARNING",
      message:
        validSamples.length > 0
          ? "Valid samples exist for CSV and Python preparation."
          : "No valid samples yet. The prepare script needs exported valid samples.",
    },
  ];
}

function check(name: string, passed: boolean, passMessage: string, failMessage: string): ValidationCheck {
  return {
    name,
    status: passed ? "PASS" : "FAIL",
    message: passed ? passMessage : failMessage,
  };
}

function sampleCheck(
  name: string,
  validSampleCount: number,
  passed: boolean,
  passMessage: string,
  failMessage: string,
): ValidationCheck {
  if (validSampleCount === 0) {
    return {
      name,
      status: "WARNING",
      message: "No valid samples yet. Record a pilot sample to run this check.",
    };
  }

  return check(name, passed, passMessage, failMessage);
}

function featuresAreValid(features: PostureFeatures): boolean {
  return (Object.values(features) as number[]).every((value) => typeof value === "number" && Number.isFinite(value));
}

function isImbalanced(nonZeroCounts: number[]): boolean {
  if (nonZeroCounts.length < 2) {
    return false;
  }
  const min = Math.min(...nonZeroCounts);
  const max = Math.max(...nonZeroCounts);
  return min > 0 && max / min > 2.5;
}

function hasForbiddenTrainingColumns(): boolean {
  return CSV_COLUMNS.some((column) =>
    (FORBIDDEN_TRAINING_LANDMARK_NAMES as readonly string[]).some((name) => column.startsWith(`${name}_`)),
  );
}

function hasValidTrainingLandmarks(sample: Recording["samples"][number]): boolean {
  const trainingLandmarks = sample.training_landmarks ?? [];
  const names = trainingLandmarks.map((landmark) => landmark.name);
  return (
    trainingLandmarks.length === TRAINING_LANDMARK_NAMES.length &&
    TRAINING_LANDMARK_NAMES.every((name) => names.includes(name)) &&
    trainingLandmarks.every(
      (landmark) =>
        Number.isFinite(landmark.x) &&
        Number.isFinite(landmark.y) &&
        Number.isFinite(landmark.z) &&
        (landmark.visibility === undefined || Number.isFinite(landmark.visibility)),
    ) &&
    Boolean(sample.raw_landmarks[LANDMARK_INDEX.left_shoulder]) &&
    Boolean(sample.raw_landmarks[LANDMARK_INDEX.right_shoulder]) &&
    hasHeadSignal(sample.raw_landmarks)
  );
}

function hasHeadSignal(landmarks: Recording["samples"][number]["raw_landmarks"]): boolean {
  const nose = landmarks[LANDMARK_INDEX.nose];
  const leftEar = landmarks[LANDMARK_INDEX.left_ear];
  const rightEar = landmarks[LANDMARK_INDEX.right_ear];
  const faceIndexes = [
    LANDMARK_INDEX.left_eye_inner,
    LANDMARK_INDEX.left_eye,
    LANDMARK_INDEX.left_eye_outer,
    LANDMARK_INDEX.right_eye_inner,
    LANDMARK_INDEX.right_eye,
    LANDMARK_INDEX.right_eye_outer,
    LANDMARK_INDEX.mouth_left,
    LANDMARK_INDEX.mouth_right,
  ];
  const faceCount = faceIndexes.filter((index) => landmarks[index]).length;

  return Boolean(nose || (leftEar && rightEar) || faceCount >= 2);
}
