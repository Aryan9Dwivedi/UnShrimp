import type { RefObject } from "react";
import type { CameraState } from "../types/appTypes";

type WebcamPanelProps = {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  cameraState: CameraState;
  errorMessage: string | null;
};

function getCameraMessage(cameraState: CameraState, errorMessage: string | null) {
  if (cameraState === "camera_requesting_permission") {
    return "Requesting webcam permission...";
  }

  if (cameraState === "camera_error") {
    return errorMessage ?? "Unable to start camera.";
  }

  return "Camera is off. Click Start Monitoring to begin.";
}

export function WebcamPanel({
  videoRef,
  canvasRef,
  cameraState,
  errorMessage
}: WebcamPanelProps) {
  const isCameraActive = cameraState === "camera_active";

  return (
    <section className="panel webcam-panel">
      <div className="panel-heading">
        <h2>Preview</h2>
        <span className={`status-chip ${cameraState}`}>{cameraState}</span>
      </div>
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
            {getCameraMessage(cameraState, errorMessage)}
          </div>
        )}
      </div>
    </section>
  );
}
