import { PoseLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";

export function drawPoseOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks?: NormalizedLandmark[]
) {
  const width = video.videoWidth || video.clientWidth;
  const height = video.videoHeight || video.clientHeight;
  if (!width || !height) {
    return;
  }

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, width, height);

  if (!landmarks?.length) {
    return;
  }

  context.lineWidth = 3;
  context.strokeStyle = "rgba(20, 184, 166, 0.9)";
  PoseLandmarker.POSE_CONNECTIONS.forEach(({ start, end }) => {
    const from = landmarks[start];
    const to = landmarks[end];
    if (!from || !to || isLowVisibility(from) || isLowVisibility(to)) {
      return;
    }

    context.beginPath();
    context.moveTo(from.x * width, from.y * height);
    context.lineTo(to.x * width, to.y * height);
    context.stroke();
  });

  landmarks.forEach((landmark, index) => {
    if (isLowVisibility(landmark)) {
      return;
    }

    const upperBody = index <= 12;
    context.beginPath();
    context.fillStyle = upperBody ? "#f97316" : "rgba(226, 232, 240, 0.6)";
    context.arc(landmark.x * width, landmark.y * height, upperBody ? 5 : 3, 0, Math.PI * 2);
    context.fill();
  });
}

export function clearPoseOverlay(canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  context?.clearRect(0, 0, canvas.width, canvas.height);
}

function isLowVisibility(landmark: NormalizedLandmark) {
  return (landmark.visibility ?? 1) < 0.35;
}
