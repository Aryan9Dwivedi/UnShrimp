import type { MonitoringState } from "../types/appTypes";

type PostureStatusPanelProps = {
  monitoringState: MonitoringState;
};

export function PostureStatusPanel({ monitoringState }: PostureStatusPanelProps) {
  const isMonitoring = monitoringState === "monitoring";

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Posture Feedback</h2>
      </div>
      <div className="metric-list">
        <div className="metric-row">
          <span>Status:</span>
          <strong>{isMonitoring ? "Monitoring placeholder" : "Not monitoring"}</strong>
        </div>
        <div className="metric-row">
          <span>Score:</span>
          <strong>--</strong>
        </div>
        <div className="metric-row stacked">
          <span>Message:</span>
          <strong>
            {isMonitoring
              ? "Pose detection will be added in the next foundation step."
              : "Start monitoring to begin posture feedback."}
          </strong>
        </div>
      </div>
    </section>
  );
}