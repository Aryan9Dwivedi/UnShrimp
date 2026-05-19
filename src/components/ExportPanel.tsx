import type { Recording } from "../types/dataset";
import { buildTrainingCsv } from "../utils/exportCsv";
import { buildDatasetJsonText } from "../utils/exportJson";
import { buildManifestText } from "../utils/exportManifest";

export function ExportPanel({ recordings }: { recordings: Recording[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Export</p>
          <h2>Dataset files</h2>
        </div>
      </div>

      <div className="button-column">
        <button type="button" onClick={() => downloadText("unshrimp_dataset_raw.json", buildDatasetJsonText(recordings))}>
          Export Full JSON
        </button>
        <button type="button" onClick={() => downloadText("unshrimp_dataset_train.csv", buildTrainingCsv(recordings))}>
          Export Training CSV
        </button>
        <button type="button" onClick={() => downloadText("unshrimp_dataset_manifest.json", buildManifestText(recordings))}>
          Export Manifest JSON
        </button>
      </div>

      <p className="muted">
        Full JSON includes valid and dropped numeric samples. Training CSV includes only valid samples.
      </p>
    </section>
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
