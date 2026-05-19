import { useCallback, useEffect, useRef, useState } from "react";
import type { AppError, CalibrationState } from "../types/appTypes";

const CALIBRATION_SECONDS = 5;

export function useCalibration() {
  const timerRef = useRef<number | null>(null);
  const [calibrationState, setCalibrationState] =
    useState<CalibrationState>("not_calibrated");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startCalibration = useCallback(() => {
    try {
      clearTimer();
      setError(null);
      setCalibrationState("calibrating");
      setCountdown(CALIBRATION_SECONDS);

      let remainingSeconds = CALIBRATION_SECONDS;
      timerRef.current = window.setInterval(() => {
        remainingSeconds -= 1;

        if (remainingSeconds <= 0) {
          clearTimer();
          setCountdown(null);
          setCalibrationState("calibrated");
          return;
        }

        setCountdown(remainingSeconds);
      }, 1000);
    } catch {
      clearTimer();
      setCountdown(null);
      setCalibrationState("calibration_error");
      setError({
        code: "CALIBRATION_FAILED",
        message: "Calibration failed."
      });
    }
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    calibrationState,
    countdown,
    error,
    startCalibration
  };
}