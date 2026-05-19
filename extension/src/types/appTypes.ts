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

export type AlertSound = "soft_beep" | "double_beep" | "chime" | "none";

export type AppErrorCode =
  | "CAMERA_PERMISSION_DENIED"
  | "CAMERA_NOT_FOUND"
  | "CAMERA_START_FAILED"
  | "CALIBRATION_FAILED";

export type AppError = {
  code: AppErrorCode;
  message: string;
};

export type SoundSettingsState = {
  soundEnabled: boolean;
  selectedSound: AlertSound;
};

export const SOUND_OPTIONS: Array<{ value: AlertSound; label: string }> = [
  { value: "soft_beep", label: "Soft Beep" },
  { value: "double_beep", label: "Double Beep" },
  { value: "chime", label: "Chime" },
  { value: "none", label: "None" }
];