export type AppState = "idle" | "ready" | "error";

export type CameraState =
  | "camera_off"
  | "camera_requesting_permission"
  | "camera_active"
  | "camera_error";

export type CalibrationState =
  | "not_calibrated"
  | "calibrating"
  | "calibrated"
  | "calibration_error";

export type MonitoringState = "not_monitoring" | "monitoring" | "paused";

export type AlertSound = "faaah" | "desk_honk" | "arcade_panic" | "none";

export type AppErrorCode =
  | "CAMERA_PERMISSION_DENIED"
  | "CAMERA_NOT_FOUND"
  | "CAMERA_START_FAILED"
  | "CALIBRATION_FAILED"
  | "MODEL_LOAD_FAILED"
  | "POSE_MODEL_LOAD_FAILED";

export type AppError = {
  code: AppErrorCode;
  message: string;
};

export type SoundSettingsState = {
  soundEnabled: boolean;
  selectedSound: AlertSound;
};

export const SOUND_OPTIONS: Array<{ value: AlertSound; label: string }> = [
  { value: "faaah", label: "FAAAAAHHH" },
  { value: "desk_honk", label: "Desk Honk" },
  { value: "arcade_panic", label: "Arcade Panic" },
  { value: "none", label: "None" }
];
