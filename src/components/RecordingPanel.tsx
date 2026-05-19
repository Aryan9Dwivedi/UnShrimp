import type { RecordingState } from "../hooks/useDataRecorder";
import type { CollectionSettings, RecordingSummary } from "../types/dataset";

type RecordingPanelProps = {
  settings: CollectionSettings;
  recordingState: RecordingState;
  countdown: number | null;
  elapsedSec: number;
  activeCounts: { valid: number; dropped: number };
  lastSummary: RecordingSummary | null;
  recordingError: string | null;
  storageWarning: string | null;
  canStartRecording: boolean;
  readinessMessage: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDiscardLast: () => void;
  onClearAll: () => void;
};

export function RecordingPanel({
  settings,
  recordingState,
  countdown,
  elapsedSec,
  activeCounts,
  lastSummary,
  recordingError,
  storageWarning,
  canStartRecording,
  readinessMessage,
  onStartRecording,
  onStopRecording,
  onDiscardLast,
  onClearAll,
}: RecordingPanelProps) {
  const isBusy = recordingState !== "idle";

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Recording Controls</p>
          <h2>Timed capture</h2>
        </div>
        <span className={`status-pill status-${isBusy ? "warn" : "neutral"}`}>{recordingState}</span>
      </div>

      {countdown && <div className="countdown">{countdown}</div>}

      <p className={canStartRecording ? "ready-text" : "warning-text"}>{readinessMessage}</p>

      <div className="button-row">
        <button type="button" onClick={onStartRecording} disabled={isBusy || !canStartRecording}>
          Start Recording
        </button>
        <button type="button" className="secondary" onClick={onStopRecording} disabled={!isBusy}>
          Stop Recording
        </button>
        <button type="button" className="secondary" onClick={onDiscardLast} disabled={isBusy}>
          Discard Last Recording
        </button>
        <button type="button" className="danger" onClick={onClearAll}>
          Clear All Data
        </button>
      </div>

      <div className="status-grid">
        <StatusItem label="Target Duration" value={`${settings.duration_sec}s`} />
        <StatusItem label="Elapsed" value={`${elapsedSec.toFixed(1)}s`} />
        <StatusItem label="Sampling FPS" value={String(settings.sampling_fps)} />
        <StatusItem label="Valid Samples" value={String(activeCounts.valid)} />
        <StatusItem label="Dropped Samples" value={String(activeCounts.dropped)} />
      </div>

      {recordingError && <p className="error-text">{recordingError}</p>}
      {storageWarning && <p className="warning-text">{storageWarning}</p>}

      {lastSummary && (
        <div className="summary-box">
          <h3>Last recording summary</h3>
          <dl>
            <dt>person_id</dt>
            <dd>{lastSummary.person_id}</dd>
            <dt>session_id</dt>
            <dd>{lastSummary.session_id}</dd>
            <dt>camera_angle</dt>
            <dd>{lastSummary.camera_angle}</dd>
            <dt>label</dt>
            <dd>{lastSummary.label}</dd>
            <dt>duration_sec</dt>
            <dd>{lastSummary.duration_sec}</dd>
            <dt>sampling_fps</dt>
            <dd>{lastSummary.sampling_fps}</dd>
            <dt>valid_sample_count</dt>
            <dd>{lastSummary.valid_sample_count}</dd>
            <dt>dropped_sample_count</dt>
            <dd>{lastSummary.dropped_sample_count}</dd>
          </dl>
        </div>
      )}
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
