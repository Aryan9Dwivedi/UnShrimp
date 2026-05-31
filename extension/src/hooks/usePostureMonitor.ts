import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { CalibrationState, CameraState } from "../types/appTypes";
import type {
  CalibrationBaseline,
  PoseStatus,
  PostureFeatures,
  PostureLabel,
  PostureMonitorState,
  PredictionResult
} from "../types/postureTypes";
import { POSTURE_MESSAGES } from "../constants/posture";
import { loadBrowserModel, predictPosture, type BrowserModel } from "../utils/modelInference";
import { buildPoseFeatures } from "../utils/postureFeatures";
import {
  combinePostureDecision,
  getSmoothedLabel,
  isSustainedBadPosture
} from "../utils/postureDecision";
import { clearPoseOverlay, drawPoseOverlay } from "../utils/poseDrawing";

const BASELINE_STORAGE_KEY = "unshrimp.calibrationBaseline.v1";
const INFERENCE_INTERVAL_MS = 200;
const CALIBRATION_SECONDS = 5;
const ALERT_COOLDOWN_MS = 15000;

const INITIAL_RESULT: PredictionResult = {
  label: "uncertain",
  nnLabel: "uncertain",
  ruleLabel: "uncertain",
  confidence: 0,
  score: 0,
  message: "Start monitoring to begin posture feedback.",
  alertReady: false
};

type UsePostureMonitorArgs = {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  cameraState: CameraState;
  soundEnabled: boolean;
  playAlertSound: () => void;
};

export function usePostureMonitor({
  videoRef,
  canvasRef,
  cameraState,
  soundEnabled,
  playAlertSound
}: UsePostureMonitorArgs): PostureMonitorState & {
  startCalibration: () => void;
} {
  const [model, setModel] = useState<BrowserModel | null>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [modelStatus, setModelStatus] = useState<PostureMonitorState["modelStatus"]>("loading");
  const [poseStatus, setPoseStatus] = useState<PoseStatus>("loading");
  const [poseConfidence, setPoseConfidence] = useState(0);
  const [fps, setFps] = useState(0);
  const [result, setResult] = useState<PredictionResult>(INITIAL_RESULT);
  const [calibrationState, setCalibrationState] =
    useState<CalibrationState>(() => (readStoredBaseline() ? "calibrated" : "not_calibrated"));
  const [calibrationCountdown, setCalibrationCountdown] = useState<number | null>(null);
  const [baseline, setBaseline] = useState<CalibrationBaseline | null>(readStoredBaseline);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);
  const lastInferenceRef = useRef(0);
  const lastFpsRef = useRef(0);
  const latestFeaturesRef = useRef<PostureFeatures | null>(null);
  const calibrationSamplesRef = useRef<PostureFeatures[]>([]);
  const calibrationTimerRef = useRef<number | null>(null);
  const predictionBufferRef = useRef<Array<{ label: PostureLabel; timestamp: number }>>([]);
  const lastAlertRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        const browserModel = await loadBrowserModel(resolveAssetUrl("model/unshrimp_posture_nn_browser.json"));
        if (!isMounted) {
          return;
        }
        setModel(browserModel);
        setModelStatus("ready");
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setModelStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load posture model.");
      }
    }

    void loadModel();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPoseModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(resolveAssetUrl("wasm"));
        const options = {
          baseOptions: {
            modelAssetPath: resolveAssetUrl("models/pose_landmarker_lite.task"),
            delegate: "GPU" as const
          },
          runningMode: "VIDEO" as const,
          numPoses: 1,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        };

        let landmarker: PoseLandmarker;
        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, options);
        } catch {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            ...options,
            baseOptions: {
              ...options.baseOptions,
              delegate: "CPU" as const
            }
          });
        }

        if (!isMounted) {
          landmarker.close();
          return;
        }

        setPoseLandmarker(landmarker);
        setPoseStatus("ready");
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setPoseStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load pose model.");
      }
    }

    void loadPoseModel();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (cameraState !== "camera_active" || !poseLandmarker || !model) {
      clearPoseOverlay(canvasRef.current);
      predictionBufferRef.current = [];
      if (cameraState === "camera_off") {
        setResult(INITIAL_RESULT);
        setPoseConfidence(0);
        setFps(0);
      }
      return;
    }

    const runFrame = () => {
      const now = performance.now();
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (now - lastInferenceRef.current >= INFERENCE_INTERVAL_MS) {
          lastInferenceRef.current = now;
          analyzeFrame(video, canvas, now, poseLandmarker, model);
        }
      }

      animationRef.current = window.requestAnimationFrame(runFrame);
    };

    animationRef.current = window.requestAnimationFrame(runFrame);

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [baseline, cameraState, canvasRef, model, playAlertSound, poseLandmarker, soundEnabled, videoRef]);

  const analyzeFrame = useCallback(
    (
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      now: number,
      landmarker: PoseLandmarker,
      browserModel: BrowserModel
    ) => {
      const poseResult = landmarker.detectForVideo(video, now);
      const landmarks = poseResult.landmarks[0];
      drawPoseOverlay(canvas, video, landmarks);

      if (lastFpsRef.current > 0) {
        setFps(Math.round(1000 / (now - lastFpsRef.current)));
      }
      lastFpsRef.current = now;

      const poseBuild = buildPoseFeatures(landmarks);
      setPoseConfidence(poseBuild.confidence);

      if (!poseBuild.ok) {
        setPoseStatus(poseBuild.reason === "LOW_CONFIDENCE" ? "low_confidence" : "no_pose");
        setResult({
          ...INITIAL_RESULT,
          message: poseBuild.reason === "NO_POSE" ? "No seated pose is visible yet." : POSTURE_MESSAGES.uncertain
        });
        return;
      }

      latestFeaturesRef.current = poseBuild.features;
      calibrationSamplesRef.current =
        calibrationState === "calibrating"
          ? [...calibrationSamplesRef.current, poseBuild.features]
          : calibrationSamplesRef.current;
      setPoseStatus("ready");

      const prediction = predictPosture(browserModel, poseBuild.featureValues);
      predictionBufferRef.current = [
        ...predictionBufferRef.current.filter((item) => now - item.timestamp <= 10000),
        { label: prediction.label, timestamp: now }
      ];
      const smoothedLabel = getSmoothedLabel(predictionBufferRef.current, now);
      const nextResult = combinePostureDecision(prediction, poseBuild.features, baseline, smoothedLabel);
      setResult(nextResult);

      if (
        nextResult.alertReady &&
        isSustainedBadPosture(predictionBufferRef.current, now) &&
        now - lastAlertRef.current > ALERT_COOLDOWN_MS
      ) {
        lastAlertRef.current = now;
        if (soundEnabled) {
          playAlertSound();
        }
        createPostureNotification(nextResult.message);
      }
    },
    [baseline, calibrationState, playAlertSound, soundEnabled]
  );

  const startCalibration = useCallback(() => {
    if (!latestFeaturesRef.current) {
      setCalibrationState("calibration_error");
      setErrorMessage("Start monitoring and make sure your head and shoulders are visible before calibrating.");
      return;
    }

    if (calibrationTimerRef.current !== null) {
      window.clearInterval(calibrationTimerRef.current);
    }

    setErrorMessage(null);
    setCalibrationState("calibrating");
    setCalibrationCountdown(CALIBRATION_SECONDS);
    calibrationSamplesRef.current = [];

    let remaining = CALIBRATION_SECONDS;
    calibrationTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      setCalibrationCountdown(remaining);

      if (remaining <= 0) {
        if (calibrationTimerRef.current !== null) {
          window.clearInterval(calibrationTimerRef.current);
          calibrationTimerRef.current = null;
        }

        const samples = calibrationSamplesRef.current;
        if (samples.length < 6) {
          setCalibrationState("calibration_error");
          setCalibrationCountdown(null);
          setErrorMessage("Calibration needs a few stable pose samples. Sit centered and try again.");
          return;
        }

        const nextBaseline: CalibrationBaseline = {
          createdAt: new Date().toISOString(),
          features: averageFeatures(samples)
        };
        setBaseline(nextBaseline);
        localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(nextBaseline));
        setCalibrationState("calibrated");
        setCalibrationCountdown(null);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (calibrationTimerRef.current !== null) {
        window.clearInterval(calibrationTimerRef.current);
      }
      poseLandmarker?.close();
    };
  }, [poseLandmarker]);

  return {
    modelStatus,
    poseStatus,
    poseConfidence,
    fps,
    result,
    calibrationState,
    calibrationCountdown,
    isCalibrated: Boolean(baseline),
    errorMessage,
    startCalibration
  };
}

function averageFeatures(samples: PostureFeatures[]): PostureFeatures {
  const keys = Object.keys(samples[0]) as Array<keyof PostureFeatures>;
  return keys.reduce((features, key) => {
    features[key] =
      samples.reduce((sum, sample) => sum + sample[key], 0) / Math.max(1, samples.length);
    return features;
  }, {} as PostureFeatures);
}

function readStoredBaseline(): CalibrationBaseline | null {
  try {
    const rawValue = localStorage.getItem(BASELINE_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as CalibrationBaseline;
    return parsed?.features ? parsed : null;
  } catch {
    return null;
  }
}

function createPostureNotification(message: string) {
  if (!("chrome" in window) || !chrome.notifications?.create) {
    return;
  }

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "UnShrimp posture check",
    message
  });
}

function resolveAssetUrl(path: string) {
  if ("chrome" in window && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(path);
  }

  return `/${path}`;
}
