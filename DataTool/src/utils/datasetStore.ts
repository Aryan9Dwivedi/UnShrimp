import { LOCAL_STORAGE_KEY, STORAGE_WARNING_BYTES } from "../constants/schema";
import type { Recording } from "../types/dataset";

export function loadRecordings(): Recording[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecordings(recordings: Recording[]): { storageWarning: string | null } {
  const serialized = JSON.stringify(recordings);
  localStorage.setItem(LOCAL_STORAGE_KEY, serialized);

  return {
    storageWarning:
      serialized.length > STORAGE_WARNING_BYTES
        ? "Dataset is getting large. Export your data before collecting more."
        : null,
  };
}
