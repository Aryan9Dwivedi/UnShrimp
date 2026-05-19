# Extension Foundation Dev Log

Branch: `Aryan_Dev`

## Completed Work

- Built the first Chrome extension foundation using Vite, React, and TypeScript.
- Added Manifest V3 configuration for the UnShrimp extension.
- Added a popup page with the required `Open Monitor` action.
- Added a monitor page for the main posture-monitoring demo surface.
- Added webcam start/stop behavior using `navigator.mediaDevices.getUserMedia`.
- Added camera cleanup so media tracks stop when monitoring stops or the page unmounts.
- Added a 5-second placeholder calibration flow.
- Added sound alert settings with localStorage persistence.
- Added Web Audio API test sounds for `soft_beep`, `double_beep`, and `chime`.
- Added placeholder posture feedback for status, score, and message.
- Added a debug/status panel for app, camera, calibration, monitoring, sound, and error state.
- Kept MediaPipe, pose detection, posture classification, and ML out of this step.

## Repository Cleanup

- Moved all Chrome extension code into `extension/`.
- Renamed the root image-only `src/` folder to `assets/images/` to avoid confusion with application source code.
- Kept `data/`, `ml/`, and `models/` as separate project areas.
- Added this `dev-logs/` folder so completed work can be tracked as the project grows.

## Current Extension Location

```text
extension/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  public/
    manifest.json
  src/
    popup/
    monitor/
    components/
    hooks/
    styles/
    types/
```

## How To Run

Run commands from inside the `extension/` folder:

```bash
npm install
npm run dev
npm run build
```

## Chrome Load Unpacked Folder

After building, load this folder in Chrome:

```text
extension/dist
```

## Verified

- `npm install` works from `extension/`.
- `npm run build` works from `extension/`.
- `npm audit --audit-level=moderate` reports no vulnerabilities.
- The build outputs `extension/dist/manifest.json`.
- The popup entry is emitted to `extension/dist/src/popup/popup.html`.
- The monitor entry is emitted to `extension/dist/src/monitor/monitor.html`.
