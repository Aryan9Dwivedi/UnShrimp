import type { AlertSound } from "../types/appTypes";
import { SOUND_OPTIONS } from "../types/appTypes";

type SoundSettingsProps = {
  soundEnabled: boolean;
  selectedSound: AlertSound;
  onSoundEnabledChange: (enabled: boolean) => void;
  onSelectedSoundChange: (sound: AlertSound) => void;
  onTestSound: () => void;
  embedded?: boolean;
};

export function SoundSettings({
  soundEnabled,
  selectedSound,
  onSoundEnabledChange,
  onSelectedSoundChange,
  onTestSound,
  embedded = false
}: SoundSettingsProps) {
  const content = (
    <div className="sound-settings-content">
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(event) => onSoundEnabledChange(event.target.checked)}
        />
        <span>Play a sound after sustained bad posture</span>
      </label>

      <label className="field-label" htmlFor="alert-sound">
        Alert tone
      </label>
      <select
        id="alert-sound"
        className="select-input"
        value={selectedSound}
        onChange={(event) => onSelectedSoundChange(event.target.value as AlertSound)}
      >
        {SOUND_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        className="button button-secondary full-width"
        type="button"
        onClick={onTestSound}
        disabled={!soundEnabled || selectedSound === "none"}
      >
        Test alert sound 🎵
      </button>
      <p className="helper-caption">Preview the shame (it helps).</p>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="surface-card sound-card">
      <div className="card-title-row">
        <div className="card-title-group">
          <h2>🚨 Anti-Shrimp Protocols</h2>
        </div>
      </div>
      {content}
    </section>
  );
}
