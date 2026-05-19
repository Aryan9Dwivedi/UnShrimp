# UnShrimp

UnShrimp is a computer vision posture-monitoring project focused on detecting and correcting poor sitting posture in real time. The first target deployment is a local Chrome extension that uses webcam-based pose detection, rule-based posture checks, and a lightweight neural network classifier.

## Core Pipeline

### S1: MediaPipe Pose Landmarker Web

The first stage uses MediaPipe Pose Landmarker Web JS to process webcam frames and extract the full 33-landmark body pose output.

```text
Webcam frame
  -> MediaPipe Pose Landmarker
  -> 33 body landmarks
  -> Normalize landmarks
  -> Posture rule system + NN classifier
  -> Posture feedback
```

### S2: Hybrid Rule + Neural Network System

UnShrimp will combine deterministic posture rules with a small machine learning model. The rule system provides an interpretable baseline, while the neural network helps improve classification across users, camera positions, and body types.

```text
MediaPipe landmarks
  -> Landmark normalization
  -> Engineered posture features
  -> Rule-based baseline
  -> NN classifier
  -> Temporal smoothing
  -> Final alert
```

## Dataset Plan

### Posture Classes

- Good
- Shrimp / slouch
- Forward lean
- Looking down
- Side lean

### Collection Targets

| People | Posture classes | Camera angles | Time per class | FPS saved | Approx samples |
| -----: | --------------: | ------------: | -------------: | --------: | -------------: |
| 6 people | 4 classes | 3 angles | 20 sec | 5 fps | 7,200 samples |
| 8 people | 5 classes | 3 angles | 20 sec | 5 fps | 12,000 samples |

The dataset will store landmark-only samples rather than raw video whenever possible. This keeps the project lightweight and helps reduce privacy risk.

## Chrome Extension Deployment

```text
Chrome Extension
  |-- popup.html
  |     |-- Start / Stop / Open Monitor
  |
  |-- monitor.html
  |     |-- Webcam feed
  |     |-- MediaPipe pose overlay
  |     |-- Rule + NN inference
  |     |-- Posture score
  |     |-- Alerts
  |
  |-- model/
  |     |-- posture_model.json
  |     |-- weights.bin
  |
  |-- storage
        |-- User settings
        |-- Calibration baseline
        |-- Session summaries
```

## Tech Stack

- React + TypeScript Chrome extension
- MediaPipe Pose Landmarker Web JS
- Landmark normalization
- Rule-based posture baseline
- Small neural network classifier
- TensorFlow.js or plain JavaScript inference
- Local browser deployment
- Optional Azure Functions support for dataset/API workflows

## Approach and Progression

1. Finalize project scope and repo structure.
2. Build Chrome extension skeleton.
3. Add webcam permission and live video feed.
4. Integrate MediaPipe Pose Landmarker.
5. Display body landmarks and skeleton overlay.
6. Extract 33 landmark coordinates per frame.
7. Normalize landmarks by body center and scale.
8. Add posture feature calculations.
9. Add 5-second user calibration.
10. Build rule-based posture detector.
11. Add temporal smoothing over multiple frames.
12. Add alert logic after sustained bad posture.
13. Add basic UI: posture status, score, and warning message.
14. Build data collection mode.
15. Define labels: good, shrimp/slouch, forward lean, looking down, side lean.
16. Collect landmark-only data from users.
17. Collect multiple camera angles: front, side, and angled.
18. Export dataset as CSV/JSON.
19. Clean and verify collected data.
20. Split dataset by person/session, not random frames.
21. Train baseline models: logistic regression, random forest/XGBoost, and small NN.
22. Evaluate rule-based detection against the NN classifier.
23. Add NN model into the extension.
24. Combine rule system and NN into hybrid decision logic.
25. Add explanation layer, such as "leaning forward" or "slouching."
26. Add session summary analytics.
27. Test on new users and different lighting/camera positions.
28. Fix false positives and threshold issues.
29. Prepare final demo flow.
30. Freeze features and polish presentation.

## Current Status

This repository is in the initial planning stage. The immediate next milestone is to create the Chrome extension skeleton and confirm webcam access in the browser.
