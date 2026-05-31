import type { RefObject } from "react";
import type { CameraState } from "../types/appTypes";
import { BRAND_IMAGES } from "../utils/brandAssets";

type WebcamPanelProps = {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  cameraState: CameraState;
  errorMessage: string | null;
};

function getCameraMessage(cameraState: CameraState, errorMessage: string | null) {
  if (cameraState === "camera_requesting_permission") {
    return "Allow camera access when Chrome asks.";
  }

  if (cameraState === "camera_error") {
    return errorMessage ?? "Unable to start camera.";
  }

  return "Hop in your chair and click Start monitoring to begin your posture adventure.";
}

export function WebcamPanel({
  videoRef,
  canvasRef,
  cameraState,
  errorMessage
}: WebcamPanelProps) {
  const isCameraActive = cameraState === "camera_active";

  return (
    <section className="surface-card webcam-card">
      <div className="webcam-frame">
        <video
          ref={videoRef}
          className={`webcam-video ${isCameraActive ? "visible" : ""}`}
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className={`pose-canvas ${isCameraActive ? "visible" : ""}`}
          aria-hidden="true"
        />
        {!isCameraActive && (
          <div className="camera-placeholder">
            <img
              className="camera-scene-art"
              src={BRAND_IMAGES.cameraIdle}
              alt=""
              aria-hidden="true"
            />
            <div className="camera-copy-overlay">
              <p className="camera-placeholder-title">Camera sleeps until you sit!</p>
              <p>{getCameraMessage(cameraState, errorMessage)}</p>
            </div>
          </div>
        )}
        {isCameraActive && (
          <div className="webcam-live-badge">
            <span className="live-dot" aria-hidden="true" />
            Live
          </div>
        )}
      </div>
    </section>
  );
}
