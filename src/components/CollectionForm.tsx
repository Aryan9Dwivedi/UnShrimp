import { CAMERA_ANGLES, LABEL_DEFINITIONS, POSTURE_LABELS } from "../constants/labels";
import type { CollectionSettings } from "../types/dataset";

type CollectionFormProps = {
  settings: CollectionSettings;
  onChange: (settings: CollectionSettings) => void;
  disabled: boolean;
};

export function CollectionForm({ settings, onChange, disabled }: CollectionFormProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Data Collection Form</p>
          <h2>Sample metadata</h2>
        </div>
      </div>

      <div className="form-grid">
        <label>
          Person ID
          <input
            value={settings.person_id}
            disabled={disabled}
            onChange={(event) => onChange({ ...settings, person_id: event.target.value })}
          />
        </label>
        <label>
          Session ID
          <input
            value={settings.session_id}
            disabled={disabled}
            onChange={(event) => onChange({ ...settings, session_id: event.target.value })}
          />
        </label>
        <label>
          Camera Angle
          <select
            value={settings.camera_angle}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...settings, camera_angle: event.target.value as CollectionSettings["camera_angle"] })
            }
          >
            {CAMERA_ANGLES.map((angle) => (
              <option key={angle} value={angle}>
                {angle}
              </option>
            ))}
          </select>
        </label>
        <label>
          Posture Label
          <select
            value={settings.label}
            disabled={disabled}
            onChange={(event) => onChange({ ...settings, label: event.target.value as CollectionSettings["label"] })}
          >
            {POSTURE_LABELS.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Recording Duration Seconds
          <input
            type="number"
            min={1}
            value={settings.duration_sec}
            disabled={disabled}
            onChange={(event) => onChange({ ...settings, duration_sec: Number(event.target.value) })}
          />
        </label>
        <label>
          Sampling FPS
          <input
            type="number"
            min={1}
            max={10}
            value={settings.sampling_fps}
            disabled={disabled}
            onChange={(event) => onChange({ ...settings, sampling_fps: Number(event.target.value) })}
          />
        </label>
      </div>

      <p className="definition">{LABEL_DEFINITIONS[settings.label]}</p>
    </section>
  );
}
