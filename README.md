# Un Shrimp

![Un Shrimp](src/flat,750x,075,f-pad,750x1000,f8f8f8.u27.jpg)

## About The Project

UnShrimp is a locally running Chrome extension that uses the laptop webcam to monitor seated posture in real time. The goal is to build the best working deployed Chrome computer vision project for detecting sustained poor sitting posture and giving clear feedback to the user.

The first demo focuses only on the browser-based posture monitoring flow. The system should open a monitor page, use the webcam, run pose estimation locally, draw the body landmarks and skeleton, let the user calibrate normal sitting posture, detect sustained poor posture, and show useful feedback.

## 1. Lock Final Demo Goal

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

## 2. Lock Posture Classes

Use only these posture states for the first demo:

1. `good_posture`
2. `shrimp_slouch`
3. `forward_lean`
4. `looking_down`
5. `side_lean`
6. `uncertain`

Definitions:

`good_posture`: User is sitting close to their calibrated normal posture.

`shrimp_slouch`: User is hunched, rounded forward, or collapsed into a shrimp-like sitting posture.

`forward_lean`: User is leaning toward the screen.

`looking_down`: User head or face is angled downward toward keyboard, phone, or desk.

`side_lean`: User is leaning left or right, or shoulders are visibly uneven.

`uncertain`: Pose cannot be trusted because landmarks are missing, confidence is low, or the user is partially out of frame.

## 3. Define Non-Goals

For the first 15-day demo, do not build the following:

1. Cloud inference
2. User login
3. Medical diagnosis
4. Chrome Web Store publishing
5. Mobile app support
6. Raw image or video storage
7. Complex dashboard
8. Raw-image CNN training
9. Backend dependency for real-time prediction
10. Claims about treating or preventing back pain

## Git Workflow

- Keep the main branch stable and demo-ready.
- Use a development branch for active integration work.
- Create feature branches for specific tasks or fixes.
- Commit small, focused changes with clear messages.
- Test changes locally before merging them into the stable branch.
- Avoid mixing unrelated work in the same commit.
- Use pull requests or reviewed merges when multiple people are contributing.
