import { useCallback, useEffect, useRef, useState } from "react";
import type { AppError, CameraState, MonitoringState } from "../types/appTypes";

function mapCameraError(error: unknown): AppError {
  const errorName = error instanceof DOMException ? error.name : "";

  if (
    errorName === "NotAllowedError" ||
    errorName === "PermissionDeniedError" ||
    errorName === "SecurityError"
  ) {
    return {
      code: "CAMERA_PERMISSION_DENIED",
      message: "Camera permission was denied."
    };
  }

  if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
    return {
      code: "CAMERA_NOT_FOUND",
      message: "No webcam was found."
    };
  }

  return {
    code: "CAMERA_START_FAILED",
    message: "Unable to start camera."
  };
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("camera_off");
  const [monitoringState, setMonitoringState] =
    useState<MonitoringState>("not_monitoring");
  const [error, setError] = useState<AppError | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopStream();
    setCameraState("camera_off");
    setMonitoringState("not_monitoring");
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    setError(null);
    setCameraState("camera_requesting_permission");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new DOMException("No webcam was found.", "NotFoundError");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user"
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => undefined);
      }

      setCameraState("camera_active");
      setMonitoringState("monitoring");
    } catch (caughtError) {
      stopStream();
      setError(mapCameraError(caughtError));
      setCameraState("camera_error");
      setMonitoringState("not_monitoring");
    }
  }, [stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    videoRef,
    cameraState,
    monitoringState,
    error,
    startCamera,
    stopCamera
  };
}