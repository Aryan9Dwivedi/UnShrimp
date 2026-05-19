import type { ValidationCheck } from "../types/dataset";

export function ValidationPanel({ checks }: { checks: ValidationCheck[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Dataset Validation</p>
          <h2>Readiness checks</h2>
        </div>
      </div>

      <div className="validation-list">
        {checks.map((check) => (
          <div className="validation-row" key={check.name}>
            <span className={`status-pill status-${check.status.toLowerCase()}`}>{check.status}</span>
            <div>
              <strong>{check.name}</strong>
              <p>{check.message}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
