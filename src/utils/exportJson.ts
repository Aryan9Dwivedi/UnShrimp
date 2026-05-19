import { DATASET_VERSION, SCHEMA_VERSION } from "../constants/schema";
import type { DatasetJson, Recording } from "../types/dataset";

export function buildDatasetJson(recordings: Recording[]): DatasetJson {
  return {
    schema_version: SCHEMA_VERSION,
    dataset_version: DATASET_VERSION,
    created_at: new Date().toISOString(),
    recordings,
  };
}

export function buildDatasetJsonText(recordings: Recording[]): string {
  return JSON.stringify(buildDatasetJson(recordings), null, 2);
}
