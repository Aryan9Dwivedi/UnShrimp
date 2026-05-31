import { useCallback, useEffect, useState } from "react";
import type { AlertSound, SoundSettingsState } from "../types/appTypes";

const STORAGE_KEY = "unshrimp.soundSettings";

type AudioContextConstructor = typeof AudioContext;

function readStoredSettings(): SoundSettingsState {
  const fallback: SoundSettingsState = {
    soundEnabled: true,
    selectedSound: "faaah"
  };

  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return fallback;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<SoundSettingsState>;
    return {
      soundEnabled:
        typeof parsedValue.soundEnabled === "boolean"
          ? parsedValue.soundEnabled
          : fallback.soundEnabled,
      selectedSound: isAlertSound(parsedValue.selectedSound)
        ? parsedValue.selectedSound
        : fallback.selectedSound
    };
  } catch {
    return fallback;
  }
}

function isAlertSound(value: unknown): value is AlertSound {
  return (
    value === "faaah" ||
    value === "desk_honk" ||
    value === "arcade_panic" ||
    value === "none"
  );
}

function playTone(
  audioContext: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  gain = 0.22,
  type: OscillatorType = "sine"
) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(gain, startTime + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

export function useSoundSettings() {
  const [storedSettings] = useState(readStoredSettings);
  const [soundEnabled, setSoundEnabled] = useState(storedSettings.soundEnabled);
  const [selectedSound, setSelectedSound] = useState<AlertSound>(
    storedSettings.selectedSound
  );

  useEffect(() => {
    const nextSettings: SoundSettingsState = {
      soundEnabled,
      selectedSound
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
  }, [soundEnabled, selectedSound]);

  const playSelectedSound = useCallback(() => {
    if (!soundEnabled || selectedSound === "none") {
      return;
    }

    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: AudioContextConstructor })
        .webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    const audioContext = new AudioContextCtor();
    const now = audioContext.currentTime;

    if (selectedSound === "faaah") {
      playTone(audioContext, 740, now, 0.48, 0.32, "sawtooth");
      playTone(audioContext, 185, now + 0.03, 0.48, 0.18, "square");
      window.setTimeout(() => void audioContext.close(), 650);
      return;
    }

    if (selectedSound === "desk_honk") {
      playTone(audioContext, 220, now, 0.18, 0.3, "square");
      playTone(audioContext, 165, now + 0.18, 0.24, 0.28, "square");
      window.setTimeout(() => void audioContext.close(), 620);
      return;
    }

    playTone(audioContext, 660, now, 0.1, 0.28, "triangle");
    playTone(audioContext, 880, now + 0.14, 0.1, 0.28, "triangle");
    playTone(audioContext, 520, now + 0.28, 0.16, 0.28, "sawtooth");
    window.setTimeout(() => void audioContext.close(), 720);
  }, [selectedSound, soundEnabled]);

  return {
    soundEnabled,
    selectedSound,
    setSoundEnabled,
    setSelectedSound,
    playTestSound: playSelectedSound,
    playAlertSound: playSelectedSound
  };
}
