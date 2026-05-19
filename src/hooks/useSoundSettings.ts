import { useCallback, useEffect, useState } from "react";
import type { AlertSound, SoundSettingsState } from "../types/appTypes";

const STORAGE_KEY = "unshrimp.soundSettings";

type AudioContextConstructor = typeof AudioContext;

function readStoredSettings(): SoundSettingsState {
  const fallback: SoundSettingsState = {
    soundEnabled: true,
    selectedSound: "soft_beep"
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
    value === "soft_beep" ||
    value === "double_beep" ||
    value === "chime" ||
    value === "none"
  );
}

function playTone(
  audioContext: AudioContext,
  frequency: number,
  startTime: number,
  duration: number
) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.08, startTime + 0.01);
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

  const playTestSound = useCallback(() => {
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

    if (selectedSound === "soft_beep") {
      playTone(audioContext, 620, now, 0.16);
      window.setTimeout(() => void audioContext.close(), 260);
      return;
    }

    if (selectedSound === "double_beep") {
      playTone(audioContext, 620, now, 0.14);
      playTone(audioContext, 620, now + 0.24, 0.14);
      window.setTimeout(() => void audioContext.close(), 520);
      return;
    }

    playTone(audioContext, 520, now, 0.12);
    playTone(audioContext, 780, now + 0.16, 0.18);
    window.setTimeout(() => void audioContext.close(), 520);
  }, [selectedSound, soundEnabled]);

  return {
    soundEnabled,
    selectedSound,
    setSoundEnabled,
    setSelectedSound,
    playTestSound
  };
}