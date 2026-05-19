import { useState } from "react";
import type { Recording } from "../types/dataset";
import { buildTrainingCsv } from "../utils/exportCsv";
import { buildDatasetJsonText } from "../utils/exportJson";
import { buildManifestText } from "../utils/exportManifest";

export function ExportPanel({ recordings }: { recordings: Recording[] }) {
  const [exportError, setExportError] = useState<string | null>(null);
  const validSamples = recordings.reduce((sum, recording) => sum + recording.valid_sample_count, 0);
  const droppedSamples = recordings.reduce((sum, recording) => sum + recording.dropped_sample_count, 0);
  const hasRecordings = recordings.length > 0;
  const hasValidSamples = validSamples > 0;
  const exportRaw = () => safeDownload("unshrimp_dataset_raw.json", () => buildDatasetJsonText(recordings), setExportError);
  const exportCsv = () => safeDownload("unshrimp_dataset_train.csv", () => buildTrainingCsv(recordings), setExportError);
  const exportManifest = () =>
    safeDownload("unshrimp_dataset_manifest.json", () => buildManifestText(recordings), setExportError);
  const exportAll = () => {
    try {
      const csvText = hasValidSamples ? buildTrainingCsv(recordings) : null;
      const rawText = buildDatasetJsonText(recordings);
      const manifestText = buildManifestText(recordings);
      setExportError(null);
      downloadText("unshrimp_dataset_raw.json", rawText);
      if (csvText) {
        downloadText("unshrimp_dataset_train.csv", csvText);
      }
      downloadText("unshrimp_dataset_manifest.json", manifestText);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Export</p>
          <h2>Dataset files</h2>
        </div>
      </div>

      <div className="status-grid">
        <StatusItem label="Recordings" value={String(recordings.length)} />
        <StatusItem label="Valid Samples" value={String(validSamples)} />
        <StatusItem label="Dropped Samples" value={String(droppedSamples)} />
      </div>

      <div className="button-column">
        <button type="button" onClick={exportAll} disabled={!hasRecordings}>
          Export All Files
        </button>
        <button type="button" className="secondary" onClick={exportRaw} disabled={!hasRecordings}>
          Export Full JSON
        </button>
        <button type="button" className="secondary" onClick={exportCsv} disabled={!hasValidSamples}>
          Export Training CSV
        </button>
        <button type="button" className="secondary" onClick={exportManifest} disabled={!hasRecordings}>
          Export Manifest JSON
        </button>
      </div>

      <p className="muted">
        Export All downloads raw JSON, upper-body v1 training CSV, and manifest. Put the raw JSON in ml/data/raw before
        running the Python validation script.
      </p>
      {!hasValidSamples && <p className="warning-text">Training CSV is disabled until at least one valid sample exists.</p>}
      {exportError && <p className="error-text">Export blocked: {exportError}</p>}
    </section>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeDownload(filename: string, buildText: () => string, setExportError: (message: string | null) => void) {
  try {
    const text = buildText();
    setExportError(null);
    downloadText(filename, text);
  } catch (error) {
    setExportError(error instanceof Error ? error.message : "Export failed.");
  }
}
