# UnShrimp

UnShrimp is a privacy-preserving computer vision Chrome extension for monitoring seated posture while working. The project focuses on the common "sitting like a shrimp" posture: hunched forward, leaning toward the screen, looking down, or sitting unevenly.

## Locked Demo Goal

The final demo goal is a working local Chrome extension that uses webcam-based pose estimation to detect seated posture and give real-time feedback. The demo should prove the full browser pipeline:

```text
Webcam feed
  -> MediaPipe Pose Landmarker Web JS
  -> 33 body landmarks
  -> Landmark quality filtering
  -> Landmark normalization
  -> Posture feature extraction
  -> 5-second calibration baseline
  -> Rule-based posture detector
  -> Temporal smoothing
  -> Sustained bad-posture alert
  -> UI feedback
```

The key objective is not just to show MediaPipe landmarks. The project contribution is the system around pose estimation: local Chrome deployment, calibration, normalization, explainable posture rules, smoothing, alerts, data collection, and later a hybrid rule plus neural network classifier.

## MVP Scope

The first working version must:

1. Open a Chrome extension monitor page.
2. Request webcam permission.
3. Show a live camera feed.
4. Run MediaPipe Pose Landmarker locally in the browser.
5. Draw pose keypoints and skeleton overlay.
6. Extract landmarks per frame.
7. Normalize landmarks.
8. Let the user calibrate good posture for 5 seconds.
9. Detect posture using rule-based logic.
10. Smooth predictions over time.
11. Alert only after sustained bad posture.
12. Show posture status, posture score, and a correction message.

## Posture Classes

These labels are locked for the MVP and should be used consistently in the README, UI, data collection, and model code:

| Label | Meaning |
| --- | --- |
| `good_posture` | User is close to their calibrated good posture baseline. |
| `shrimp_slouch` | User is hunched or collapsed forward in a slouched posture. |
| `forward_lean` | User is leaning toward the screen. |
| `looking_down` | User's head or neck is angled downward. |
| `side_lean` | User is leaning left or right, often with uneven shoulders. |
| `uncertain` | Pose quality is too low, landmarks are missing, or the user is partly out of frame. |

The `uncertain` state is required. The system should avoid confident posture labels when key landmarks are missing or pose confidence is low.

## Strict Non-Goals

For the first demo, UnShrimp will not:

- Build login or account management.
- Build a cloud-first inference system.
- Send raw webcam frames to any backend.
- Store images or videos.
- Build a mobile app.
- Provide medical diagnosis.
- Claim to prevent, treat, or diagnose back pain.
- Focus on Chrome Web Store publishing.
- Train a CNN on raw images.
- Start with the neural network before the extension and rule-based detector work.
- Build a complex dashboard before the core demo is stable.

## Privacy Requirements

The demo should run locally in the browser. Webcam frames should not be uploaded or stored. If data collection mode is added, it should only save numeric landmark data:

- Raw landmarks
- Normalized landmarks
- Engineered posture features
- Label
- Timestamp
- Person/session ID
- Camera angle
- Pose confidence

No raw images or videos should be saved.

## Core Architecture

The project will be organized around these modules:

1. Extension shell
2. Webcam controller
3. MediaPipe pose service
4. Skeleton overlay renderer
5. Landmark formatter
6. Landmark quality filter
7. Landmark normalizer
8. Posture feature extractor
9. Calibration manager
10. Rule-based posture detector
11. Temporal smoothing buffer
12. Alert manager
13. UI feedback components
14. Data collection mode
15. ML training scripts
16. Optional browser model inference
17. Hybrid decision system

## Posture Features

The rule system and later ML model should use normalized landmarks plus engineered features such as:

- `shoulder_slope`
- `shoulder_width`
- `head_center_x`
- `head_center_y`
- `shoulder_midpoint_x`
- `shoulder_midpoint_y`
- `hip_midpoint_x`
- `hip_midpoint_y`
- `head_to_shoulder_x_offset`
- `head_to_shoulder_y_offset`
- `nose_to_shoulder_y_offset`
- `torso_lean_proxy`
- `head_drop_proxy`
- `side_lean_proxy`
- `pose_confidence`

## Detection Logic

The first guaranteed demo path is rule-based detection. The detector should classify:

- `good_posture`
- `shrimp_slouch`
- `forward_lean`
- `looking_down`
- `side_lean`
- `uncertain`

The system should not decide from one frame. It should use a rolling prediction buffer and temporal smoothing. Bad posture alerts should appear only after poor posture is sustained for about 10 to 15 seconds, with an alert cooldown to avoid repeated notifications.

## Calibration Logic

The user sits in good posture and clicks Calibrate. The system records valid posture features for about 5 seconds and averages them into a personal baseline. Future posture detection compares current features against that baseline instead of relying only on fixed universal thresholds.

## Dataset Plan

There may not be a public dataset that exactly matches this project, so UnShrimp will create a landmark-only dataset through developer data collection mode.

### Dataset Labels

- `good_posture`
- `shrimp_slouch`
- `forward_lean`
- `looking_down`
- `side_lean`
- `uncertain` optional

### Dataset Fields

- `sample_id`
- `session_id`
- `person_id`
- `timestamp`
- `label`
- `camera_angle`
- `raw_landmarks`
- `normalized_landmarks`
- `features`
- `pose_confidence`

### Collection Target

| People | Posture labels | Camera angles | Time per label | Notes |
| ---: | ---: | ---: | ---: | --- |
| At least 5 | 4 to 5 | 2 to 3 | 15 to 30 sec | Front, slight left/right, and side if time allows |

Datasets should be split by session or person where possible. Do not randomly split frame by frame because nearby frames are too similar.

## ML Plan

Machine learning comes after the rule-based demo and data collection mode. The planned sequence is:

1. Evaluate the rule-based baseline.
2. Train a simple ML baseline such as logistic regression or random forest.
3. Train a small neural network on normalized landmarks plus engineered features.
4. Compare rule-only, ML-only, NN-only, and hybrid approaches.
5. Export the selected model for local browser inference.

Initial small NN idea:

```text
Input: normalized landmarks + engineered posture features
Hidden: Dense 128, ReLU
Hidden: Dense 64, ReLU
Output: binary good vs bad first, then multi-class if the data supports it
```

## Hybrid System Direction

The later hybrid system should use the NN to improve classification and rules to provide explanations. Example:

```text
NN says: bad posture
Rules identify: forward lean
UI says: You are leaning forward. Sit back slightly.
```

Hybrid decision rules:

- If pose confidence is low, return `uncertain`.
- If NN says bad and rules identify a posture issue, show that specific issue.
- If NN says bad but rules are unsure, show possible bad posture.
- If rules say bad but NN says good, treat it as a watch state and avoid immediate alerts.
- If both indicate good posture, show `good_posture`.

## Repository Layout

```text
UnShrimp/
  Docs/          Project planning, research notes, task tracking
  extension/     Chrome extension source code
  ml/            Dataset cleaning, training, and evaluation scripts
  data/          Landmark-only datasets and exports
  models/        Exported browser-ready model files
  README.md      Project scope and setup overview
```

The repository structure is intentionally lightweight for now and will grow as each system area is implemented.

## Tech Stack

- Chrome extension
- React + TypeScript preferred for the extension UI
- MediaPipe Pose Landmarker Web JS for browser pose estimation
- Local browser inference
- Browser local storage for calibration and session summaries
- Python for later model training
- TensorFlow.js or simple exported JSON model for later browser inference
- Optional cloud support later only for dataset or model hosting, not required for MVP

## Git Workflow

- `main` is the stable branch for committed project milestones.
- `Aryan_Dev` is the active development branch.
- Feature work should happen on feature branches created from `Aryan_Dev`.
- Changes should be tested locally before merging into `main`.
- `main` should stay demo-safe and should not receive experimental work directly once implementation begins.

## Team Working Areas

- Extension and UI: Chrome extension shell, monitor page, webcam controls, feedback UI.
- Computer vision pipeline: MediaPipe integration, landmarks, overlay, normalization, features.
- Detection logic: calibration, rule-based detector, smoothing, alerts.
- Data and ML: data collection mode, cleaning, baselines, NN, hybrid comparison.
- Documentation and demo: scope, task tracking, architecture notes, final demo script.

## Demo Success Criteria

Minimum acceptable demo:

```text
Chrome extension
  -> Webcam feed
  -> MediaPipe landmarks
  -> Skeleton overlay
  -> Calibration
  -> Rule-based slouch detection
  -> Temporal smoothing
  -> Sustained bad-posture alert
```

Ideal demo:

```text
Chrome extension
  -> Webcam feed
  -> MediaPipe landmarks
  -> Skeleton overlay
  -> Calibration
  -> Rule-based detector
  -> Data collection mode
  -> Small NN classifier
  -> Hybrid decision
  -> Posture score
  -> Alert system
  -> Session summary
  -> Evaluation comparison
```

## Current Priority

Build the working local browser demo first. Do not overbuild. The first version must prove the extension, webcam, pose estimation, landmarks, calibration, rules, smoothing, and alert flow before moving into cloud work or neural network deployment.
