import { useCallback, useEffect, useRef, useState } from "react";
import { LANDMARK_NAMES } from "../constants/landmarks";
import type {
  CollectionSettings,
  DropReason,
  LatestPoseFrame,
  PoseLandmark,
  PosePoint,
  PoseSample,
  PostureFeatures,
  Recording,
  RecordingSummary,
} from "../types/dataset";
import { normalizeLandmarks } from "../utils/landmarkNormalizer";
import { averageKeyLandmarkVisibility, extractPostureFeatures } from "../utils/postureFeatures";
import { evaluateNormalizedPoseQuality, evaluateRawPoseQuality } from "../utils/qualityFilters";
import { loadRecordings, saveRecordings } from "../utils/datasetStore";

export type RecordingState = "idle" | "countdown" | "recording";

export function useDataRecorder() {
  const [recordings, setRecordings] = useState<Recording[]>(() => loadRecordings());
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [activeCounts, setActiveCounts] = useState({ valid: 0, dropped: 0 });
  const [lastSummary, setLastSummary] = useState<RecordingSummary | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const activeSamplesRef = useRef<PoseSample[]>([]);
  const activeSettingsRef = useRef<CollectionSettings | null>(null);
  const activeRecordingIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const stopRequestedRef = useRef(false);

  const clearActiveTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const result = saveRecordings(recordings);
    setStorageWarning(result.storageWarning);
  }, [recordings]);

  const finalizeRecording = useCallback(() => {
    const settings = activeSettingsRef.current;
    const recordingId = activeRecordingIdRef.current;
    if (!settings || !recordingId || !startedAtRef.current) {
      return;
    }

    clearActiveTimers();
    const samples = [...activeSamplesRef.current];
    const validSampleCount = samples.filter((sample) => sample.quality_status === "valid").length;
    const droppedSampleCount = samples.length - validSampleCount;
    const recording: Recording = {
      recording_id: recordingId,
      person_id: settings.person_id.trim(),
      session_id: settings.session_id.trim(),
      camera_angle: settings.camera_angle,
      label: settings.label,
      started_at: startedAtRef.current,
      duration_sec: settings.duration_sec,
      sampling_fps: settings.sampling_fps,
      valid_sample_count: validSampleCount,
      dropped_sample_count: droppedSampleCount,
      samples,
    };

    setRecordings((current) => [...current, recording]);
    setLastSummary({
      recording_id: recording.recording_id,
      person_id: recording.person_id,
      session_id: recording.session_id,
      camera_angle: recording.camera_angle,
      label: recording.label,
      duration_sec: recording.duration_sec,
      sampling_fps: recording.sampling_fps,
      valid_sample_count: validSampleCount,
      dropped_sample_count: droppedSampleCount,
    });

    activeSamplesRef.current = [];
    activeSettingsRef.current = null;
    activeRecordingIdRef.current = null;
    startedAtRef.current = null;
    stopRequestedRef.current = false;
    setActiveCounts({ valid: 0, dropped: 0 });
    setElapsedSec(0);
    setRecordingState("idle");
  }, [clearActiveTimers]);

  const startRecording = useCallback(
    async (
      settings: CollectionSettings,
      latestPoseGetter: () => LatestPoseFrame | null,
      canRecord: { cameraActive: boolean; poseModelLoaded: boolean },
    ) => {
      if (recordingState !== "idle") {
        return;
      }

      const validationError = validateRecordingRequest(settings, canRecord);
      if (validationError) {
        setRecordingError(validationError);
        return;
      }

      setRecordingError(null);
      setLastSummary(null);
      setRecordingState("countdown");
      stopRequestedRef.current = false;

      for (let count = 3; count >= 1; count -= 1) {
        if (stopRequestedRef.current) {
          setRecordingState("idle");
          setCountdown(null);
          return;
        }
        setCountdown(count);
        await delay(1000);
      }

      if (stopRequestedRef.current) {
        setRecordingState("idle");
        setCountdown(null);
        return;
      }

      const recordingId = createId("rec");
      activeSamplesRef.current = [];
      activeSettingsRef.current = settings;
      activeRecordingIdRef.current = recordingId;
      startedAtRef.current = new Date().toISOString();
      setCountdown(null);
      setRecordingState("recording");

      const intervalMs = Math.max(200, Math.round(1000 / settings.sampling_fps));
      const startedAtMs = performance.now();

      const capture = () => {
        const pose = latestPoseGetter();
        const sample = createPoseSample({
          pose,
          settings,
          recordingId,
          sampleIndex: activeSamplesRef.current.length + 1,
        });
        activeSamplesRef.current.push(sample);
        const valid = activeSamplesRef.current.filter((item) => item.quality_status === "valid").length;
        const dropped = activeSamplesRef.current.length - valid;
        setActiveCounts({ valid, dropped });
        setElapsedSec(Math.min(settings.duration_sec, (performance.now() - startedAtMs) / 1000));
      };

      capture();
      intervalRef.current = window.setInterval(capture, intervalMs);
      timeoutRef.current = window.setTimeout(finalizeRecording, settings.duration_sec * 1000);
    },
    [finalizeRecording, recordingState],
  );

  const stopRecording = useCallback(() => {
    stopRequestedRef.current = true;
    setCountdown(null);
    if (recordingState === "recording") {
      finalizeRecording();
      return;
    }
    clearActiveTimers();
    setRecordingState("idle");
  }, [clearActiveTimers, finalizeRecording, recordingState]);

  const discardLastRecording = useCallback(() => {
    setRecordings((current) => current.slice(0, -1));
    setLastSummary(null);
  }, []);

  const clearAllData = useCallback(() => {
    stopRecording();
    setRecordings([]);
    setLastSummary(null);
    setRecordingError(null);
  }, [stopRecording]);

  useEffect(() => {
    return () => clearActiveTimers();
  }, [clearActiveTimers]);

  return {
    recordings,
    recordingState,
    countdown,
    elapsedSec,
    activeCounts,
    lastSummary,
    recordingError,
    storageWarning,
    startRecording,
    stopRecording,
    discardLastRecording,
    clearAllData,
  };
}

export function toNamedLandmarks(points: PosePoint[] | undefined): PoseLandmark[] {
  if (!points) {
    return [];
  }

  return points.map((point, index) => ({
    index,
    name: LANDMARK_NAMES[index] ?? `landmark_${index}`,
    x: point.x,
    y: point.y,
    z: point.z ?? 0,
    visibility: point.visibility,
  }));
}

function createPoseSample({
  pose,
  settings,
  recordingId,
  sampleIndex,
}: {
  pose: LatestPoseFrame | null;
  settings: CollectionSettings;
  recordingId: string;
  sampleIndex: number;
}): PoseSample {
  const rawLandmarks = pose?.landmarks?.[0] ? toNamedLandmarks(pose.landmarks[0]) : [];
  const poseConfidence = rawLandmarks.length ? averageKeyLandmarkVisibility(rawLandmarks) : 0;
  const rawQuality = evaluateRawPoseQuality(rawLandmarks, poseConfidence);
  let normalizedLandmarks = rawQuality.isValid ? normalizeLandmarks(rawLandmarks) : [];
  let dropReason: DropReason | undefined = rawQuality.dropReason;

  if (rawQuality.isValid) {
    const normalizedQuality = evaluateNormalizedPoseQuality(normalizedLandmarks);
    if (!normalizedQuality.isValid) {
      normalizedLandmarks = [];
      dropReason = normalizedQuality.dropReason;
    }
  }

  const qualityStatus = dropReason ? "dropped" : "valid";
  const features =
    qualityStatus === "valid"
      ? extractPostureFeatures(normalizedLandmarks, poseConfidence)
      : emptyFeatures(poseConfidence);

  return {
    sample_id: `${recordingId}_sample_${String(sampleIndex).padStart(5, "0")}`,
    recording_id: recordingId,
    person_id: settings.person_id.trim(),
    session_id: settings.session_id.trim(),
    camera_angle: settings.camera_angle,
    label: settings.label,
    timestamp_ms: Date.now(),
    pose_confidence: poseConfidence,
    quality_status: qualityStatus,
    drop_reason: dropReason,
    raw_landmarks: rawLandmarks,
    normalized_landmarks: normalizedLandmarks,
    features,
  };
}

function emptyFeatures(poseConfidence: number): PostureFeatures {
  return {
    shoulder_slope: 0,
    shoulder_width: 0,
    head_center_x: 0,
    head_center_y: 0,
    shoulder_midpoint_x: 0,
    shoulder_midpoint_y: 0,
    hip_midpoint_x: null,
    hip_midpoint_y: null,
    head_to_shoulder_x_offset: 0,
    head_to_shoulder_y_offset: 0,
    nose_to_shoulder_y_offset: 0,
    torso_lean_proxy: null,
    head_drop_proxy: 0,
    side_lean_proxy: 0,
    pose_confidence: poseConfidence,
  };
}

function validateRecordingRequest(
  settings: CollectionSettings,
  canRecord: { cameraActive: boolean; poseModelLoaded: boolean },
): string | null {
  if (!canRecord.cameraActive) return "Start the camera before recording.";
  if (!canRecord.poseModelLoaded) return "Load the pose model before recording.";
  if (!settings.person_id.trim()) return "Person ID is required.";
  if (!settings.session_id.trim()) return "Session ID is required.";
  if (settings.duration_sec <= 0) return "Recording duration must be positive.";
  if (settings.sampling_fps <= 0 || settings.sampling_fps > 10) {
    return "Sampling FPS must be between 1 and 10. Use 5 FPS by default.";
  }
  return null;
}

function createId(prefix: string): string {
  const random = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}_${Date.now()}_${random}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
