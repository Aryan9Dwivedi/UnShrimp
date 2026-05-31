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
    value === "ho_ho_ho" ||
    value === "ronny" ||
    value === "chime" ||
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

const SOUND_FILES: Partial<Record<AlertSound, string>> = {
  faaah: "sounds/faaah.mp3",
  ho_ho_ho: "sounds/ho-ho-ho.mp3",
  ronny: "sounds/ronny.mp3"
};

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

    const soundFile = SOUND_FILES[selectedSound];
    if (soundFile) {
      const audio = new Audio(resolveAssetUrl(soundFile));
      audio.volume = 1;
      void audio.play().catch(() => undefined);
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

    playTone(audioContext, 660, now, 0.1, 0.28, "triangle");
    playTone(audioContext, 880, now + 0.14, 0.1, 0.28, "triangle");
    playTone(audioContext, 520, now + 0.28, 0.16, 0.22, "triangle");
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

function resolveAssetUrl(path: string) {
  if ("chrome" in window && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(path);
  }

  return `/${path}`;
}
