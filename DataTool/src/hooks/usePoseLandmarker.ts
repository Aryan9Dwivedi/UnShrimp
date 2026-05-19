import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";
import { LANDMARK_INDEX, POSE_CONNECTIONS } from "../constants/landmarks";
import type { LatestPoseFrame, PosePoint } from "../types/dataset";
import { averageKeyLandmarkVisibility } from "../utils/postureFeatures";
import { toNamedLandmarks } from "./useDataRecorder";

const MODEL_PATH = "models/pose_landmarker_lite.task";
const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";
const MISSING_MODEL_MESSAGE = "Pose model file missing. Place pose_landmarker_lite.task in public/models/.";

export type PoseModelStatus = "idle" | "loading" | "loaded" | "missing" | "error";

export function usePoseLandmarker(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  isCameraActive: boolean,
) {
  const [modelStatus, setModelStatus] = useState<PoseModelStatus>("idle");
  const [modelMessage, setModelMessage] = useState("Pose model has not been loaded yet.");
  const [poseDetected, setPoseDetected] = useState(false);
  const [poseConfidence, setPoseConfidence] = useState(0);
  const [fps, setFps] = useState(0);
  const latestPoseRef = useRef<LatestPoseFrame | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      if (!isCameraActive || landmarkerRef.current || modelStatus === "loading") {
        return;
      }

      setModelStatus("loading");
      setModelMessage("Loading pose landmarker model...");

      try {
        const modelCheck = await fetch(MODEL_PATH, { method: "HEAD", cache: "no-store" });
        if (!modelCheck.ok) {
          throw new Error("MODEL_MISSING");
        }

        const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
        const landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: MODEL_PATH,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setModelStatus("loaded");
        setModelMessage("Pose model loaded.");
      } catch (error) {
        if (cancelled) {
          return;
        }
        const isMissing = error instanceof Error && error.message === "MODEL_MISSING";
        setModelStatus(isMissing ? "missing" : "error");
        setModelMessage(isMissing ? MISSING_MODEL_MESSAGE : "Unable to load pose landmarker model.");
      }
    }

    loadModel();

    return () => {
      cancelled = true;
    };
  }, [isCameraActive, modelStatus]);

  useEffect(() => {
    if (!isCameraActive || !landmarkerRef.current || !videoRef.current || !canvasRef.current) {
      clearCanvas(canvasRef.current);
      latestPoseRef.current = null;
      setPoseDetected(false);
      setPoseConfidence(0);
      setFps(0);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const detect = () => {
      const now = performance.now();
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const result = landmarkerRef.current?.detectForVideo(video, now) as
          | { landmarks?: PosePoint[][] }
          | undefined;
        const pose = result?.landmarks?.[0] ?? [];
        const detected = pose.length === 33;

        latestPoseRef.current = detected
          ? {
              landmarks: [pose],
              timestamp_ms: Date.now(),
            }
          : null;

        const confidence = detected ? averageKeyLandmarkVisibility(toNamedLandmarks(pose)) : 0;
        setPoseDetected(detected);
        setPoseConfidence(confidence);
        drawPose(canvas, context, pose);

        if (lastFrameTimeRef.current) {
          const delta = now - lastFrameTimeRef.current;
          if (delta > 0) {
            setFps(Math.round(1000 / delta));
          }
        }
        lastFrameTimeRef.current = now;
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      lastFrameTimeRef.current = null;
      clearCanvas(canvas);
    };
  }, [canvasRef, isCameraActive, videoRef, modelStatus]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  return {
    modelStatus,
    modelMessage,
    poseDetected,
    poseConfidence,
    fps,
    latestPoseRef,
  };
}

function drawPose(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, pose: PosePoint[]) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);

  if (pose.length !== 33) {
    return;
  }

  context.lineWidth = 3;
  context.strokeStyle = "rgba(0, 134, 109, 0.9)";
  for (const [start, end] of POSE_CONNECTIONS) {
    const a = pose[start];
    const b = pose[end];
    if (isDrawable(a) && isDrawable(b)) {
      context.beginPath();
      context.moveTo(a.x * width, a.y * height);
      context.lineTo(b.x * width, b.y * height);
      context.stroke();
    }
  }

  pose.forEach((point, index) => {
    if (!isDrawable(point)) {
      return;
    }
    context.beginPath();
    context.fillStyle =
      index === LANDMARK_INDEX.nose || index === LANDMARK_INDEX.left_shoulder || index === LANDMARK_INDEX.right_shoulder
        ? "#ffcf5a"
        : "#00a685";
    context.arc(point.x * width, point.y * height, 4, 0, Math.PI * 2);
    context.fill();
  });
}

function clearCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    return;
  }
  const context = canvas.getContext("2d");
  context?.clearRect(0, 0, canvas.width, canvas.height);
}

function isDrawable(point: PosePoint | undefined): point is PosePoint {
  return Boolean(point && (point.visibility === undefined || point.visibility >= 0.3));
}
