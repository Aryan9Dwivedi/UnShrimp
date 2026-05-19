import type { DatasetSummary } from "../utils/datasetValidation";

type DatasetReviewPanelProps = {
  summary: DatasetSummary;
};

export function DatasetReviewPanel({ summary }: DatasetReviewPanelProps) {
  return (
    <section className="panel panel-wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Dataset Review</p>
          <h2>Counts and warnings</h2>
        </div>
      </div>

      <div className="metric-grid">
        <Metric label="total_recordings" value={summary.total_recordings} />
        <Metric label="total_valid_samples" value={summary.total_valid_samples} />
        <Metric label="total_dropped_samples" value={summary.total_dropped_samples} />
        <Metric label="people_count" value={summary.people_count} />
        <Metric label="session_count" value={summary.session_count} />
      </div>

      <div className="split-grid">
        <CountList title="Label counts" counts={summary.label_counts} />
        <CountList title="Camera angle counts" counts={summary.camera_angle_counts} />
      </div>

      {summary.warnings.length > 0 && (
        <div className="warning-box">
          <h3>Warnings</h3>
          <ul>
            {summary.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>person_id</th>
              <th>session_id</th>
              <th>camera_angle</th>
              <th>label</th>
              <th>recording_count</th>
              <th>valid_samples</th>
              <th>dropped_samples</th>
            </tr>
          </thead>
          <tbody>
            {summary.grouped_rows.length === 0 ? (
              <tr>
                <td colSpan={7}>No recordings yet.</td>
              </tr>
            ) : (
              summary.grouped_rows.map((row) => (
                <tr key={row.key}>
                  <td>{row.person_id}</td>
                  <td>{row.session_id}</td>
                  <td>{row.camera_angle}</td>
                  <td>{row.label}</td>
                  <td>{row.recording_count}</td>
                  <td>{row.valid_samples}</td>
                  <td>{row.dropped_samples}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CountList({ title, counts }: { title: string; counts: Record<string, number> }) {
  return (
    <div className="count-list">
      <h3>{title}</h3>
      {Object.entries(counts).map(([key, value]) => (
        <div key={key}>
          <span>{key}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
