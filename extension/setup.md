# UnShrimp Extension Setup

This guide explains how to run and verify the UnShrimp Chrome extension foundation on Windows or macOS.

## Prerequisites

Install these first:

- Google Chrome
- Node.js LTS or newer
- Git

To check Node and npm:

```bash
node -v
npm -v
```

## Project Folder

All extension code lives inside:

```text
extension/
```

Run extension commands from that folder.

Windows:

```bash
cd "C:\Code Base\UnShrimp\extension"
```

macOS:

```bash
cd path/to/UnShrimp/extension
```

## Install Dependencies

```bash
npm install
```

## Run In Development Mode

```bash
npm run dev
```

Open the local monitor page:

```text
http://127.0.0.1:5173/src/monitor/monitor.html
```

This is useful while editing the UI, but Chrome extension testing should use the production build.

## Build The Chrome Extension

```bash
npm run build
```

This creates:

```text
extension/dist/
```

## Load In Chrome

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `dist` folder inside `extension`.

Windows folder to select:

```text
C:\Code Base\UnShrimp\extension\dist
```

macOS folder to select:

```text
path/to/UnShrimp/extension/dist
```

## Verify The Extension

1. Click the UnShrimp extension icon in Chrome.
2. Click **Open Monitor**.
3. Click **Start Monitoring**.
4. Allow webcam permission.
5. Confirm the webcam feed appears.
6. Confirm debug status shows:

```text
Camera State: camera_active
Monitoring State: monitoring
```

7. Click **Stop Monitoring**.
8. Confirm the webcam turns off.
9. Click **Calibrate Posture**.
10. Confirm the countdown runs and status becomes `calibrated`.
11. Choose an alert sound and click **Test Sound**.

## Current Scope

Implemented in this foundation:

- Popup page
- Monitor page
- Webcam start/stop
- Placeholder calibration countdown
- Sound alert settings
- Debug/status display

Not included yet:

- MediaPipe
- Pose landmark detection
- Skeleton overlay
- Real posture classification
- Machine learning

## Troubleshooting

If the extension does not update after code changes:

1. Run `npm run build` again.
2. Go to `chrome://extensions`.
3. Click the reload icon on the UnShrimp extension card.
4. Reopen the popup and monitor page.

If the webcam does not start:

- Make sure Chrome has camera permission.
- Make sure no other app is using the camera.
- Try reloading the monitor page.
- Try removing and loading the unpacked extension again.
