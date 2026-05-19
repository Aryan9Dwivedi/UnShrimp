import { CSV_COLUMNS, FEATURE_NAMES } from "../constants/schema";
import type { PoseSample, Recording } from "../types/dataset";

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
  if (column in sample) {
    return sample[column as keyof PoseSample] as string | number;
  }

  const landmarkMatch = column.match(/^([xyzv])_(\d+)$/);
  if (landmarkMatch) {
    const [, axis, indexText] = landmarkMatch;
    const landmark = sample.normalized_landmarks[Number(indexText)];
    if (!landmark) {
      return "";
    }
    if (axis === "v") {
      return landmark.visibility ?? "";
    }
    return landmark[axis as "x" | "y" | "z"];
  }

  if ((FEATURE_NAMES as readonly string[]).includes(column)) {
    const value = sample.features[column as keyof typeof sample.features];
    return value ?? "";
  }

  return "";
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
