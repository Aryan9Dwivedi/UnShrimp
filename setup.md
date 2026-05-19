# UnShrimp DataTool Setup

UnShrimp DataTool is a local browser app for collecting a landmark-only posture dataset for later neural network training.

It uses the webcam locally, runs MediaPipe Pose Landmarker in the browser, records numeric pose landmarks and engineered posture features, labels each sample, validates dataset quality, and exports files that are ready for Python preparation scripts.

No images, videos, screenshots, or base64 webcam frames are stored.

## Requirements

- Node.js 18 or newer
- npm
- Python 3.10 or newer
- Chrome or another modern Chromium-based browser
- The MediaPipe pose landmarker model file

Check versions:

```bash
node --version
npm --version
python --version
```

On macOS, if `python --version` does not work, use:

```bash
python3 --version
```

## Install

From the DataTool project root:

```bash
npm install
```

Windows PowerShell example:

```powershell
cd "C:\Code Base\UnShrimp\DataTool"
npm install
```

macOS Terminal example:

```bash
cd ~/Code/UnShrimp
npm install
```

Use the folder path that matches where you cloned the repo.

## Add The MediaPipe Model

Place the model file here:

```text
public/models/pose_landmarker_lite.task
```

The app expects this browser path:

```text
models/pose_landmarker_lite.task
```

If the file is missing, the app shows:

```text
Pose model file missing. Place pose_landmarker_lite.task in public/models/.
```

That message is expected until the model file is added.

Download the model with one of these commands.

Windows PowerShell:

```powershell
cd "C:\Code Base\UnShrimp\DataTool"
Invoke-WebRequest -Uri "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task" -OutFile "public\models\pose_landmarker_lite.task"
Get-Item "public\models\pose_landmarker_lite.task" | Select-Object Name,Length
```

macOS Terminal:

```bash
cd ~/Code/UnShrimp
curl -L "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task" -o "public/models/pose_landmarker_lite.task"
ls -lh public/models/pose_landmarker_lite.task
```

The downloaded file should be roughly 4.5 MB. If the command finishes but the file is missing or has size `0`, delete it and run the download command again.

## Run Locally

```bash
npm run dev
```

Open the local URL printed by Vite. This project is configured to use:

```text
http://127.0.0.1:5174/
```

If that port is busy, Vite may show a different local URL. Use the URL printed in your terminal.

## Build

```bash
npm run build
```

The production output goes to:

```text
dist/
```

## What The Tool Stores

The DataTool stores only numeric dataset records:

- Anonymous person ID
- Session ID
- Camera angle
- Posture label
- Timestamp
- Raw MediaPipe landmarks
- Normalized landmarks
- Engineered posture features
- Pose confidence
- Quality status
- Drop reason for invalid samples

It does not store:

- Images
- Videos
- Screenshots
- Webcam frames
- Base64 frame data
- Names or personal identity information

## Record One Posture Sample

1. Start the app with `npm run dev`.
2. Open the local URL in the browser.
3. Click `Start Camera`.
4. Confirm the pose model is loaded.
5. Confirm landmarks appear over the webcam preview.
6. Enter `Person ID`, for example `P001`.
7. Enter `Session ID`, for example `S001`.
8. Select a camera angle.
9. Select a posture label.
10. Keep sampling at `5` FPS.
11. Click `Start Recording`.
12. Hold the selected posture until recording ends.

Dropped samples stay in the full JSON export for debugging. Dropped samples are excluded from the training CSV.

## Labels

Use exactly these posture labels:

- `good_posture`
- `shrimp_slouch`
- `forward_lean`
- `looking_down`
- `side_lean`

Use exactly these camera angles:

- `front`
- `left_angle`
- `right_angle`
- `side`

## Pilot Workflow

Run this before collecting the full dataset:

1. Collect `P001`, `S001`, `front`, `good_posture`, `10` seconds.
2. Collect `P001`, `S001`, `front`, `shrimp_slouch`, `10` seconds.
3. Click `Export All Files`.
4. Confirm the browser downloads raw JSON, training CSV, and manifest files.
5. Move the downloaded `*_raw.json` file into `ml/data/raw/`.
7. Run the validation script.
8. Run the preparation script.
9. Confirm processed files are created in `ml/data/processed/`.

## Exported Files

The app downloads timestamped files like:

- `unshrimp_dataset_YYYYMMDDTHHMMSSZ_raw.json`
- `unshrimp_dataset_YYYYMMDDTHHMMSSZ_train.csv`
- `unshrimp_dataset_YYYYMMDDTHHMMSSZ_manifest.json`

The full JSON includes valid and dropped numeric samples. The training CSV includes only valid samples with fixed deterministic columns.

## Validate Dataset

Windows:

```powershell
python ml/scripts/validate_dataset.py --input ml/data/raw/unshrimp_dataset_raw.json
```

macOS:

```bash
python3 ml/scripts/validate_dataset.py --input ml/data/raw/unshrimp_dataset_raw.json
```

The validator prints label counts, person counts, session counts, dropped sample rate, warnings, and one final result:

- `PASS`
- `PASS_WITH_WARNINGS`
- `FAIL`

## Prepare Train/Val/Test Files

Windows:

```powershell
python ml/scripts/prepare_dataset.py --input ml/data/raw/unshrimp_dataset_raw.json --output ml/data/processed
```

macOS:

```bash
python3 ml/scripts/prepare_dataset.py --input ml/data/raw/unshrimp_dataset_raw.json --output ml/data/processed
```

Outputs:

- `ml/data/processed/train.csv`
- `ml/data/processed/val.csv`
- `ml/data/processed/test.csv`
- `ml/data/processed/dataset_report.json`

The preparation script uses grouped splits when enough people or sessions exist. If there are not enough people or sessions, it uses a random split and records that warning in `dataset_report.json`.

## Recommended Collection Target

Minimum useful target:

- 4 people
- 2 sessions per person
- 5 labels
- 2 camera angles
- 15 seconds per recording
- 5 FPS sampling

Better target:

- 5 people
- 2 sessions per person
- 5 labels
- 2 camera angles
- 20 seconds per recording
- 5 FPS sampling

## Troubleshooting

If the camera does not start:

- Confirm browser camera permission is allowed.
- Close other apps using the webcam.
- Refresh the page and click `Start Camera` again.

If the pose model does not load:

- Confirm the file is named exactly `pose_landmarker_lite.task`.
- Confirm it is inside `public/models/`.
- Confirm the file size is not `0`.
- Restart `npm run dev` after adding the file.

If Python commands fail on macOS:

- Use `python3` instead of `python`.

If exports look empty:

- Confirm the model loaded.
- Confirm pose landmarks are detected.
- Record while your head and shoulders are visible.
