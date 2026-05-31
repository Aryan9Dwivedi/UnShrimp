<div align="center">
  <h1>Un Shrimp</h1>
  <p><strong>Chrome computer vision posture monitor for real-time seated posture feedback.</strong></p>
  <img
    src="assets/images/flat,750x,075,f-pad,750x1000,f8f8f8.u27.jpg"
    alt="Un Shrimp project image"
    width="260"
  />
  <p>
    <code>Chrome Extension</code> |
    <code>Webcam Pose Estimation</code> |
    <code>Posture Feedback</code>
  </p>
</div>

## About The Project

UnShrimp is a locally running Chrome extension that uses the laptop webcam to monitor seated posture in real time. The goal is to build a strong deployed Chrome computer vision project that detects sustained poor sitting posture and gives clear feedback to the user.

The first demo focuses on the browser-based posture monitoring flow: open a monitor page, request webcam access, run pose estimation locally, draw body landmarks and a skeleton overlay, calibrate the user's normal sitting posture, detect sustained poor posture, and show useful feedback.

## Seated Posture Scope

UnShrimp is for seated desk posture while someone is working on a laptop or desktop. The project is not trying to classify standing posture, full-body pose, exercise form, or medical posture conditions.

For data collection and the final demo, the camera should focus on seated upper-body posture:

| Framing Need | Rule |
| --- | --- |
| Required | Head, face or nose area, both shoulders, and upper torso should be visible. |
| Recommended | Waist or hip line should be visible if the laptop camera naturally captures it. |
| Not Required | Legs, knees, ankles, feet, or full-body standing view. |

This keeps the dataset realistic for normal webcam use. Hip landmarks are useful when visible, but they are optional because many real seated laptop setups only show the upper body.

## Dataset And V1 Model Input

The project does not train pose estimation. MediaPipe provides body landmarks, and UnShrimp trains a posture classifier from those landmark values and engineered posture features.

For v1 training:

- Full JSON exports keep all 33 MediaPipe landmarks for debugging and future use.
- The main training CSV uses only upper-body seated webcam landmarks: nose, eyes, ears, mouth points, left shoulder, and right shoulder.
- Hips, knees, ankles, heels, feet, wrists, and hands are excluded from the v1 training CSV.
- The training CSV uses shoulder-normalized landmark coordinates and finite upper-body posture features.
- Train/validation/test splitting is handled by the Python preparation script, not by the browser export.

This keeps the first neural network aligned with the real Chrome extension use case: seated laptop webcam posture monitoring.

## Current ML Training Status

The first model-ready dataset, training scaffold, and saved NN model are prepared.

- `data/gmo/` stores the processed train, validation, and test splits copied from the GMO dataset output.
- `ml/` stores the data-loading utilities, neural-network training script, evaluation script, hybrid helper logic, and Python requirements.
- `ml/Eval/` stores training curves, confusion matrices, reports, metrics, and saved-model recheck notes.
- `models/unshrimp_posture_nn/` stores the trained model and preprocessing metadata.
- `extension/public/model/unshrimp_posture_nn_browser.json` is the browser-ready NN export used by the Chrome extension.

Current dataset notes:

- The current dataset is front-angle-only because that is what the team collected.
- Training data includes conservative augmentation.
- Validation and test data are real collected samples only.
- The first NN architecture follows the research direction: three hidden layers, 100 units each, ReLU, Adam, learning rate `0.001`, and up to 100 epochs.
- The saved-model recheck reached about `99.4%` test accuracy on the current split, with the caveat that this is not yet an unseen-person evaluation.

## Current Extension Status

The Chrome extension has moved beyond boilerplate. It now includes:

- Webcam monitor page.
- Local MediaPipe Pose Landmarker integration.
- Skeleton and landmark overlay.
- Shoulder-based normalization.
- Browser-side NN inference.
- Five-second personalized calibration.
- Hybrid NN plus rule feedback.
- Posture score and correction message.
- Sound toggle with generated alert sounds.
- Chrome notification for sustained bad posture.

The extension should be treated as a working integration build, not final production. The monitor page must stay open while posture monitoring is active.

## Locked Final Demo Goal

UnShrimp will be built as a locally running Chrome extension that uses the laptop webcam to monitor seated posture in real time.

The first demo should:

1. Open a monitoring page.
2. Request webcam permission.
3. Show the live webcam feed.
4. Run pose estimation locally in the browser.
5. Draw body landmarks and skeleton overlay.
6. Let the user calibrate their normal sitting posture.
7. Detect sustained poor posture.
8. Show posture status, posture score, and warning message.
9. Alert only after bad posture continues for a few seconds.

## Locked Posture Classes

Use only these posture states for the first demo:

| Posture State | Definition |
| --- | --- |
| `good_posture` | User is sitting close to their calibrated normal posture. |
| `shrimp_slouch` | User is hunched, rounded forward, or collapsed into a shrimp-like sitting posture. |
| `forward_lean` | User is leaning toward the screen. |
| `looking_down` | User head or face is angled downward toward keyboard, phone, or desk. |
| `uncertain` | Pose cannot be trusted because landmarks are missing, confidence is low, or the user is partially out of frame. |

## Git Workflow

- Keep the main branch stable and demo-ready.
- Use a development branch for active integration work.
- Create feature branches for specific tasks or fixes.
- Commit small, focused changes with clear messages.
- Test changes locally before merging them into the stable branch.
- Avoid mixing unrelated work in the same commit.
- Use pull requests or reviewed merges when multiple people are contributing.
