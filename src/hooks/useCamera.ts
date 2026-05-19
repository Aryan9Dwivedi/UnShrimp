import { useCallback, useEffect, useRef, useState } from "react";

export type CameraState = "camera_off" | "camera_requesting_permission" | "camera_active" | "camera_error";

export type CameraError = {
  code: "CAMERA_PERMISSION_DENIED" | "CAMERA_NOT_FOUND" | "CAMERA_START_FAILED";
  message: string;
};

export function useCamera(videoRef: React.RefObject<HTMLVideoElement>) {
  const [cameraState, setCameraState] = useState<CameraState>("camera_off");
  const [cameraError, setCameraError] = useState<CameraError | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraState("camera_off");
  }, [videoRef]);

  const startCamera = useCallback(async () => {
    setCameraState("camera_requesting_permission");
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 960 },
          height: { ideal: 540 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState("camera_active");
    } catch (error) {
      const domError = error instanceof DOMException ? error : null;
      const code =
        domError?.name === "NotAllowedError"
          ? "CAMERA_PERMISSION_DENIED"
          : domError?.name === "NotFoundError"
            ? "CAMERA_NOT_FOUND"
            : "CAMERA_START_FAILED";
      const message =
        code === "CAMERA_PERMISSION_DENIED"
          ? "Camera permission was denied."
          : code === "CAMERA_NOT_FOUND"
            ? "No webcam was found."
            : "Unable to start camera.";

      setCameraError({ code, message });
      setCameraState("camera_error");
    }
  }, [videoRef]);

  useEffect(() => {
    const handleUnload = () => stopCamera();
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      stopCamera();
    };
  }, [stopCamera]);

  return {
    cameraState,
    cameraError,
    isCameraActive: cameraState === "camera_active",
    startCamera,
    stopCamera,
  };
}
