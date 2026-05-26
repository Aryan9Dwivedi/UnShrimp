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
  const sizeWarning =
    serialized.length > STORAGE_WARNING_BYTES
      ? "Dataset is getting large. Export your data before collecting more."
      : null;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
  } catch (error) {
    return {
      storageWarning: isStorageQuotaError(error)
        ? "Browser storage is full. Export your data now. New recordings are still kept in memory until this page is refreshed."
        : "Browser storage could not save this dataset. Export your data before refreshing the page.",
    };
  }

  return {
    storageWarning: sizeWarning,
  };
}

function isStorageQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014)
  );
}
