import type { AlertSound } from "../types/appTypes";
import { SOUND_OPTIONS } from "../types/appTypes";

type SoundSettingsProps = {
  soundEnabled: boolean;
  selectedSound: AlertSound;
  onSoundEnabledChange: (enabled: boolean) => void;
  onSelectedSoundChange: (sound: AlertSound) => void;
  onTestSound: () => void;
};

export function SoundSettings({
  soundEnabled,
  selectedSound,
  onSoundEnabledChange,
  onSelectedSoundChange,
  onTestSound
}: SoundSettingsProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Sound Alerts</h2>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(event) => onSoundEnabledChange(event.target.checked)}
        />
        <span>Enable sound alerts</span>
      </label>

      <label className="field-label" htmlFor="alert-sound">
        Alert Sound
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
        className="button secondary full-width"
        type="button"
        onClick={onTestSound}
        disabled={!soundEnabled || selectedSound === "none"}
      >
        Test Sound
      </button>
    </section>
  );
}