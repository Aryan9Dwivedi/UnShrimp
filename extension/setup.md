# UnShrimp Extension Setup

This guide explains how to build, load, reload, and test the UnShrimp Chrome extension on Windows or macOS.

## Prerequisites

Install:

- Google Chrome
- Node.js LTS or newer
- Git

Check Node and npm:

```bash
node -v
npm -v
```

## Project Folder

All extension code lives in:

```text
extension/
```

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

## Build The Extension

```bash
npm run build
```

This creates the Chrome-loadable folder:

```text
extension/dist/
```

## Load In Chrome

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `dist` folder.

Windows folder:

```text
C:\Code Base\UnShrimp\extension\dist
```

macOS folder:

```text
path/to/UnShrimp/extension/dist
```

## Reload After Code Changes

After every code change:

```bash
npm run build
```

Then in `chrome://extensions`:

1. Find UnShrimp.
2. Click the reload icon on the extension card.
3. Close old UnShrimp monitor tabs.
4. Open the popup again.
5. Click **Open Monitor**.

## Verify The Live Posture Flow

1. Click the UnShrimp extension icon.
2. Click **Open Monitor**.
3. Click **Start Monitoring**.
4. Allow webcam permission.
5. Confirm the webcam preview appears.
6. Confirm pose landmarks and skeleton lines appear over your head and shoulders.
7. Sit normally and click **Calibrate**.
8. Hold normal posture until the countdown ends.
9. Confirm calibration says the personal baseline is saved.
10. Slouch, lean forward, or look down for several seconds.
11. Confirm the status, score, and message update.
12. Confirm the selected alert sound plays after sustained bad posture.
13. Click **Stop Monitoring** and confirm the camera turns off.

## What Runs Locally

The extension ships local assets inside `dist/`:

- MediaPipe Pose Landmarker model
- MediaPipe WASM runtime
- Browser-exported UnShrimp NN model JSON

The extension does not upload webcam frames, save images, or save videos.

## Background Use

For this version, keep the UnShrimp monitor page open while monitoring. You can switch to other apps while it runs, and bad posture can trigger sound plus a Chrome notification.

Do not close the monitor page if you want posture detection to continue.

## Troubleshooting

If the model or pose status shows an error:

- Run `npm run build` again.
- Reload the extension in `chrome://extensions`.
- Make sure `dist/model/unshrimp_posture_nn_browser.json` exists.
- Make sure `dist/models/pose_landmarker_lite.task` exists.
- Make sure `dist/wasm/` contains MediaPipe WASM files.

If the webcam does not start:

- Make sure Chrome has camera permission.
- Make sure no other app is using the camera.
- Reload the monitor page.
- Remove and load the unpacked extension again if needed.
