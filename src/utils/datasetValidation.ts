import { CAMERA_ANGLES, POSTURE_LABELS } from "../constants/labels";
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

  return [
    check(
      "All required labels exist",
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
      "Valid samples have 33 raw landmarks",
      validSamples.length,
      validSamples.every((sample) => sample.raw_landmarks.length === 33),
      "All valid samples include 33 raw landmarks.",
      "Some valid samples do not include the full MediaPipe landmark set.",
    ),
    sampleCheck(
      "Valid samples have 33 normalized landmarks",
      validSamples.length,
      validSamples.every((sample) => sample.normalized_landmarks.length === 33),
      "All valid samples include 33 normalized landmarks.",
      "Some valid samples do not include the full normalized landmark set.",
    ),
    sampleCheck(
      "Feature values are finite or allowed null",
      validSamples.length,
      validSamples.every((sample) => featuresAreValid(sample.features)),
      "All feature values are finite, except allowed hip/torso nulls.",
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
      CSV_COLUMNS.length === 155 &&
        CSV_COLUMNS[0] === "sample_id" &&
        CSV_COLUMNS[CSV_COLUMNS.length - 1] === "side_lean_proxy",
      "CSV columns are deterministic and fixed.",
      "CSV column configuration is not the expected fixed schema.",
    ),
    {
      name: "JSON export has schema_version",
      status: SCHEMA_VERSION ? "PASS" : "FAIL",
      message: SCHEMA_VERSION ? `schema_version is ${SCHEMA_VERSION}.` : "schema_version is missing.",
    },
    check(
      "Manifest export has label counts",
      POSTURE_LABELS.every((label) => Object.prototype.hasOwnProperty.call(manifest.label_counts, label)),
      "Manifest includes label counts for every fixed label.",
      "Manifest label counts are incomplete.",
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
  return (Object.entries(features) as Array<[keyof PostureFeatures, number | null]>).every(([key, value]) => {
    if (
      (key === "hip_midpoint_x" || key === "hip_midpoint_y" || key === "torso_lean_proxy") &&
      value === null
    ) {
      return true;
    }
    return typeof value === "number" && Number.isFinite(value);
  });
}

function isImbalanced(nonZeroCounts: number[]): boolean {
  if (nonZeroCounts.length < 2) {
    return false;
  }
  const min = Math.min(...nonZeroCounts);
  const max = Math.max(...nonZeroCounts);
  return min > 0 && max / min > 2.5;
}
