import { CSV_COLUMNS, FEATURE_NAMES } from "../constants/schema";
import { TRAINING_LANDMARK_NAMES } from "../constants/landmarks";
import type { PoseSample, Recording } from "../types/dataset";

const METADATA_COLUMNS = [
  "sample_id",
  "recording_id",
  "person_id",
  "session_id",
  "camera_angle",
  "label",
  "timestamp_ms",
  "pose_confidence",
  "quality_status",
] as const;

export function getTrainingCsvColumns(): string[] {
  return [...CSV_COLUMNS];
}

export function buildTrainingCsv(recordings: Recording[]): string {
  const validSamples = recordings.flatMap((recording) =>
    recording.samples.filter((sample) => sample.quality_status === "valid"),
  );

  const rows = validSamples.map((sample) => CSV_COLUMNS.map((column) => csvCell(valueForColumn(sample, column))));
  return [CSV_COLUMNS.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

export function buildTrainingRows(recordings: Recording[]): Record<string, string | number>[] {
  return recordings
    .flatMap((recording) => recording.samples)
    .filter((sample) => sample.quality_status === "valid")
    .map((sample) => {
      const row: Record<string, string | number> = {};
      CSV_COLUMNS.forEach((column) => {
        row[column] = valueForColumn(sample, column);
      });
      return row;
    });
}

function valueForColumn(sample: PoseSample, column: string): string | number {
  if ((METADATA_COLUMNS as readonly string[]).includes(column)) {
    return requireMetadataValue(sample, column);
  }

  if ((FEATURE_NAMES as readonly string[]).includes(column)) {
    const value = sample.features[column as keyof typeof sample.features];
    if (!isFiniteNumber(value)) {
      throw new Error(`Sample ${sample.sample_id} has invalid feature value for ${column}.`);
    }
    return value;
  }

  const landmarkMatch = column.match(/^(.+)_(x|y|z|v)$/);
  if (landmarkMatch) {
    const [, landmarkName, axis] = landmarkMatch;
    if (!(TRAINING_LANDMARK_NAMES as readonly string[]).includes(landmarkName)) {
      throw new Error(`Training CSV requested unsupported landmark column ${column}.`);
    }
    const landmark = sample.training_landmarks?.find((item) => item.name === landmarkName);
    if (!landmark) {
      throw new Error(`Sample ${sample.sample_id} is missing training landmark ${landmarkName}.`);
    }
    if (axis === "v") {
      if (!isFiniteNumber(landmark.visibility)) {
        throw new Error(`Sample ${sample.sample_id} has invalid visibility for ${landmarkName}.`);
      }
      return landmark.visibility;
    }
    const value = landmark[axis as "x" | "y" | "z"];
    if (!isFiniteNumber(value)) {
      throw new Error(`Sample ${sample.sample_id} has invalid ${column} value.`);
    }
    return value;
  }

  throw new Error(`Unknown training CSV column ${column}.`);
}

function requireMetadataValue(sample: PoseSample, column: string): string | number {
  const value = sample[column as keyof PoseSample];
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (isFiniteNumber(value)) {
    return value;
  }
  throw new Error(`Sample ${sample.sample_id || "unknown"} has invalid metadata value for ${column}.`);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
