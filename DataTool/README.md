# UnShrimp DataTool

UnShrimp DataTool is a local Vite + React + TypeScript app for collecting a landmark-only posture dataset for later neural network training.

It uses the webcam locally, runs MediaPipe Pose Landmarker in the browser, records numeric pose landmarks and engineered posture features, labels each sample, validates dataset quality, and exports files that are ready for Python preparation scripts.

No images, videos, screenshots, or base64 frame data are stored.

## What It Collects

- Anonymous person and session metadata
- Camera angle
- Posture label
- Raw MediaPipe landmark coordinates
- Shoulder-normalized landmark coordinates
- Engineered posture features
- Pose confidence
- Quality status and drop reason

## Install

From this folder:

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open the local URL Vite prints, usually:

```text
http://localhost:5173/
```

## Build

```bash
npm run build
```

## MediaPipe Model File

Place the MediaPipe pose landmarker model here:

```text
public/models/pose_landmarker_lite.task
```

The app expects this runtime path:

```text
models/pose_landmarker_lite.task
```

If the model file is missing, the UI shows:

```text
Pose model file missing. Place pose_landmarker_lite.task in public/models/.
```

## Record One Posture Sample

1. Start the app with `npm run dev`.
2. Click `Start Camera`.
3. Confirm the pose model is loaded and landmarks appear.
4. Enter `Person ID`, for example `P001`.
5. Enter `Session ID`, for example `S001`.
6. Select a camera angle.
7. Select a posture label.
8. Keep duration at `15` seconds and sampling at `5` FPS unless testing.
9. Click `Start Recording`.
10. Hold the selected posture until recording stops automatically.

Dropped samples remain in the full JSON export for debugging. Dropped samples are excluded from the training CSV.

## Pilot Workflow

Use this before the team collects the full dataset:

1. Collect `P001`, `S001`, `front`, `good_posture`, `10` seconds.
2. Collect `P001`, `S001`, `front`, `shrimp_slouch`, `10` seconds.
3. Click `Export Full JSON`.
4. Click `Export Training CSV`.
5. Click `Export Manifest JSON`.
6. Move `unshrimp_dataset_raw.json` into `ml/data/raw/`.
7. Run validation.
8. Run preparation.

## Exported Files

The app downloads:

- `unshrimp_dataset_raw.json`
- `unshrimp_dataset_train.csv`
- `unshrimp_dataset_manifest.json`

The full JSON includes all valid and dropped numeric samples. The training CSV includes only valid samples with fixed deterministic columns.

## Validate Dataset

```bash
python ml/scripts/validate_dataset.py --input ml/data/raw/unshrimp_dataset_raw.json
```

The validator prints label counts, person counts, session counts, dropped sample rate, warnings, and a final result:

- `PASS`
- `PASS_WITH_WARNINGS`
- `FAIL`

## Prepare Train/Val/Test Files

```bash
python ml/scripts/prepare_dataset.py --input ml/data/raw/unshrimp_dataset_raw.json --output ml/data/processed
```

Outputs:

- `ml/data/processed/train.csv`
- `ml/data/processed/val.csv`
- `ml/data/processed/test.csv`
- `ml/data/processed/dataset_report.json`

The preparation script uses grouped splits when enough people or sessions exist. If there are not enough people or sessions, it uses a random split and records that warning in `dataset_report.json`.

## Posture Labels

- `good_posture`
- `shrimp_slouch`
- `forward_lean`
- `looking_down`
- `side_lean`

## Camera Angles

- `front`
- `left_angle`
- `right_angle`
- `side`

## Privacy Rule

The DataTool is for numeric dataset creation only. Do not record names, images, videos, screenshots, or raw webcam frames.
