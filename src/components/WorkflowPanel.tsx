import type { CollectionSettings } from "../types/dataset";
import type { DatasetSummary } from "../utils/datasetValidation";

type WorkflowPanelProps = {
  cameraActive: boolean;
  modelLoaded: boolean;
  poseDetected: boolean;
  poseConfidence: number;
  settings: CollectionSettings;
  summary: DatasetSummary;
};

export function WorkflowPanel({
  cameraActive,
  modelLoaded,
  poseDetected,
  poseConfidence,
  settings,
  summary,
}: WorkflowPanelProps) {
  const labelsWithSamples = Object.values(summary.label_counts).filter((count) => count > 0).length;
  const readyToRecord = cameraActive && modelLoaded && poseDetected && poseConfidence >= 0.5;

  const steps = [
    {
      label: "Start camera",
      done: cameraActive,
      detail: cameraActive ? "Camera is active." : "Click Start Camera and allow permission.",
    },
    {
      label: "Load pose model",
      done: modelLoaded,
      detail: modelLoaded ? "Pose model is loaded." : "Wait for the model to finish loading.",
    },
    {
      label: "Confirm pose quality",
      done: poseDetected && poseConfidence >= 0.5,
      detail:
        poseDetected && poseConfidence >= 0.5
          ? `Pose is usable at ${poseConfidence.toFixed(2)} confidence.`
          : "Sit farther back so head, shoulders, and upper torso are visible.",
    },
    {
      label: "Check metadata",
      done: Boolean(settings.person_id.trim() && settings.session_id.trim()),
      detail: `${settings.person_id || "No person"} / ${settings.session_id || "No session"} / ${settings.camera_angle} / ${settings.label}`,
    },
    {
      label: "Collect pilot labels",
      done: labelsWithSamples >= 2,
      detail:
        labelsWithSamples >= 2
          ? `${labelsWithSamples} labels have valid samples.`
          : "For pilot testing, collect good_posture and shrimp_slouch first.",
    },
    {
      label: "Export raw JSON",
      done: summary.total_valid_samples > 0,
      detail:
        summary.total_valid_samples > 0
          ? `${summary.total_valid_samples} valid samples ready for export.`
          : "Export after at least one valid recording.",
    },
  ];

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Collection Guide</p>
          <h2>{readyToRecord ? "Ready to record" : "Finish setup checks"}</h2>
        </div>
        <span className={`status-pill status-${readyToRecord ? "good" : "warn"}`}>
          {readyToRecord ? "ready" : "not_ready"}
        </span>
      </div>

      <div className="workflow-list">
        {steps.map((step, index) => (
          <div className="workflow-step" key={step.label}>
            <span className={`step-dot ${step.done ? "done" : ""}`}>{index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <p>{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
