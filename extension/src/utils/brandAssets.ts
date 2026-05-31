import type { PostureLabel } from "../types/postureTypes";

const BRAND_BASE = "brand";

export function brandAsset(filename: string): string {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(`${BRAND_BASE}/${filename}`);
  }

  return `/${BRAND_BASE}/${filename}`;
}

export const BRAND_IMAGES = {
  logo: brandAsset("shrimp-mascot.png"),
  cameraIdle: brandAsset("shrimp-shell-cool.png"),
  paused: brandAsset("shrimp-sleepy.png"),
  setupStart: brandAsset("shrimp-thumbs-up.png"),
  setupCalibrate: brandAsset("shrimp-top-hat.png"),
  setupMonitor: brandAsset("shrimp-laptop.png"),
  postureUncertain: brandAsset("shrimp-wink.png"),
  postureGood: brandAsset("shrimp-happy.png"),
  postureBad: brandAsset("shrimp-laptop.png"),
  calibration: brandAsset("shrimp-ruler.png")
} as const;

export function postureArt(label: PostureLabel, isMonitoring: boolean): string {
  if (!isMonitoring || label === "uncertain") {
    return BRAND_IMAGES.postureUncertain;
  }

  if (label === "good_posture") {
    return BRAND_IMAGES.postureGood;
  }

  return BRAND_IMAGES.postureBad;
}
