# UnShrimp Task Plan

This document tracks the major work needed to move UnShrimp from initial scope to a stable final demo. Priorities are grouped as:

- `P0`: Required for the core demo.
- `P1`: Important for data, model quality, and stronger validation.
- `P2`: Nice-to-have improvements after the core system is stable.

| Priority | Batch | Step | Task | Purpose / Need | Done When | Status |
| --- | --- | ---: | --- | --- | --- | --- |
| P0 | Scope Lock | 1 | Lock final demo goal | Define UnShrimp as a Chrome extension that monitors seated posture using webcam-based pose estimation and gives real-time feedback. Keeps the project focused. | Team agrees on one clear demo goal. | Done |
| P0 | Scope Lock | 2 | Lock posture classes | Use only: good posture, shrimp/slouch, forward lean, looking down, side lean. Prevents vague labels and messy logic. | Labels are fixed in README, UI, data collection, and model code. | Done |
| P0 | Scope Lock | 3 | Define non-goals | Exclude cloud inference, login, medical diagnosis, full Web Store release, mobile app, raw video storage, and complex dashboard. Prevents overbuilding. | Non-goals are written in README. | Done |
| P0 | Repo Setup | 4 | Create final repo structure | Separate extension code, ML code, docs, datasets, and model files. Keeps work organized. | Repo has clear folders for extension, ML, docs, data, and models. | Done |
| P0 | Repo Setup | 5 | Add project README | Explain project name, goal, MVP scope, tech stack, setup, team roles, and demo target. | Anyone can understand the repo in under 2 minutes. | Done |
| P0 | Repo Setup | 6 | Define Git workflow | Use stable main/dev branches and feature branches. Prevents breaking demo code. | Main branch stays stable and features are merged only after testing. | Done |
| P0 | Extension Foundation | 7 | Build Chrome extension shell | Create manifest, popup, monitor page, basic app entry point, and temporary icons. | Extension loads using Chrome Load Unpacked. | Not Started |
| P0 | Extension Foundation | 8 | Build monitor page | Create the main screen with webcam area, posture status, score, warning message, start/stop, calibrate, and dev mode buttons. | Monitor page looks like a usable app screen. | Not Started |
| P0 | Extension Foundation | 9 | Add webcam permission and live feed | Let user start camera and see live webcam stream in the extension. This is the CV input. | Camera starts, displays video, and stops correctly. | Not Started |
| P0 | Extension Foundation | 10 | Add app state management | Track idle, loading, camera active, monitoring, calibrating, collecting data, and error states. | UI behaves correctly for each state. | Not Started |
| P0 | MediaPipe Pipeline | 11 | Install MediaPipe Pose Landmarker | Add the pose estimation library that detects body landmarks. | MediaPipe loads in browser without errors. | Not Started |
| P0 | MediaPipe Pipeline | 12 | Connect MediaPipe to webcam stream | Run pose estimation continuously on webcam frames. | Live landmark arrays are produced in console or state. | Not Started |
| P0 | MediaPipe Pipeline | 13 | Draw landmark points | Show detected body keypoints over the webcam feed. Makes CV visible in demo. | Points appear and move with the user. | Not Started |
| P0 | MediaPipe Pipeline | 14 | Draw skeleton connections | Connect landmarks with body lines for shoulders, torso, hips, arms, and optional legs. | Skeleton overlay aligns with the user. | Not Started |
| P0 | MediaPipe Pipeline | 15 | Track FPS and pose confidence | Show system performance and detection reliability. Helps debug bad predictions. | UI shows FPS and pose detected/confidence status. | Not Started |
| P0 | Landmark Processing | 16 | Create standard landmark object | Convert raw MediaPipe output into your own clean format with timestamp, landmark name, x, y, z, and visibility. | Every frame produces a consistent landmark object. | Not Started |
| P0 | Landmark Processing | 17 | Select key posture landmarks | Use nose, ears, shoulders, hips, and optional face points/elbows. Focuses posture logic. | Helper function returns key landmarks safely. | Not Started |
| P0 | Landmark Processing | 18 | Add landmark visibility filtering | Ignore frames where key landmarks are missing or low confidence. Prevents false posture alerts. | Low-quality frames return uncertain state, not wrong labels. | Not Started |
| P0 | Landmark Processing | 19 | Normalize landmarks | Center body using shoulder/hip midpoint and scale using shoulder width or torso length. Makes data less camera-distance dependent. | Normalized landmarks are generated every frame. | Not Started |
| P0 | Landmark Processing | 20 | Build posture feature extraction | Compute shoulder slope, head offset, torso alignment, head drop, side lean, confidence score, and other useful features. | Each frame outputs a posture feature vector. | Not Started |
| P0 | Calibration | 21 | Build 5-second calibration flow | User sits straight and system records baseline good posture. Personalizes detection. | Calibration records and saves a baseline. | Not Started |
| P0 | Calibration | 22 | Save baseline posture features | Store baseline head position, shoulder slope, torso alignment, head-to-shoulder offset, and confidence. | Current posture can be compared against baseline. | Not Started |
| P0 | Calibration | 23 | Add recalibration option | Let user reset baseline if camera/chair changes. | Recalibrate button replaces old baseline. | Not Started |
| P0 | Rule-Based Detection | 24 | Build good posture detection | Identify when current posture is close to calibrated baseline. | UI shows stable Good Posture when user sits correctly. | Not Started |
| P0 | Rule-Based Detection | 25 | Build shrimp/slouch detection | Detect collapsed posture using head/shoulder/torso deviation from baseline. Core UnShrimp behavior. | Obvious slouching triggers shrimp/slouch state. | Not Started |
| P0 | Rule-Based Detection | 26 | Build forward lean detection | Detect user leaning toward the screen. Important and demo-friendly. | Leaning forward changes state correctly. | Not Started |
| P0 | Rule-Based Detection | 27 | Build looking down detection | Detect neck/head downward posture using nose/ear/shoulder relationship. | Looking down is detected separately from slouching. | Not Started |
| P0 | Rule-Based Detection | 28 | Build side lean detection | Detect uneven shoulders or lateral body shift. Adds multi-posture capability. | Leaning left/right triggers side lean warning. | Not Started |
| P0 | Rule-Based Detection | 29 | Add uncertain state | Return uncertain when pose is unclear, person is out of frame, or confidence is low. | UI shows Pose Unclear instead of wrong classification. | Not Started |
| P0 | Smoothing and Alerts | 30 | Add prediction buffer | Store recent frame predictions over a window, for example 10 to 15 seconds. | Recent predictions are available for smoothing. | Not Started |
| P0 | Smoothing and Alerts | 31 | Add majority-vote smoothing | Use recent predictions instead of one frame to decide final posture. | UI does not flicker rapidly between labels. | Not Started |
| P0 | Smoothing and Alerts | 32 | Add sustained bad posture alert | Alert only after bad posture persists for 10 to 15 seconds. | Temporary movement does not trigger alert. | Not Started |
| P0 | Smoothing and Alerts | 33 | Add alert cooldown | Prevent repeated annoying alerts. | Alerts do not spam the user. | Not Started |
| P0 | UI Feedback | 34 | Build live posture status display | Show current status: good, shrimp, forward lean, looking down, side lean, or unclear. | Status updates live and matches user behavior. | Not Started |
| P0 | UI Feedback | 35 | Build posture score | Show score from 0 to 100 based on deviation from baseline. | Score drops when posture worsens and improves when corrected. | Not Started |
| P0 | UI Feedback | 36 | Build explanation messages | Give specific feedback like "You are leaning forward" or "Shrimp posture detected." | Each posture class has a clear correction message. | Not Started |
| P0 | UI Feedback | 37 | Add privacy message | State that frames are processed locally and images/videos are not stored. Important for webcam trust. | Privacy message appears in UI or onboarding. | Not Started |
| P1 | Data Collection | 38 | Build developer data collection panel | Add label dropdown, camera angle dropdown, start/stop recording, export, and clear session. | Team can record labeled landmark data from extension. | Not Started |
| P1 | Data Collection | 39 | Define dataset labels | Use good, shrimp_slouch, forward_lean, looking_down, side_lean, and optional uncertain. | Labels are constants in code and docs. | Not Started |
| P1 | Data Collection | 40 | Define metadata fields | Save sample ID, session ID, person ID, timestamp, label, camera angle, landmarks, normalized landmarks, features, confidence. | Every exported sample has complete metadata. | Not Started |
| P1 | Data Collection | 41 | Collect from multiple people | Collect from at least 5 people, 4 to 5 labels, 2 to 3 camera angles, 15 to 30 seconds per label. | Dataset includes multiple person IDs and labels. | Not Started |
| P1 | Data Collection | 42 | Collect multiple camera angles | Capture front, slight left/right, and side if possible. Improves robustness. | Dataset includes at least front and angled views. | Not Started |
| P1 | Data Collection | 43 | Export dataset as JSON and CSV | JSON preserves nested landmarks. CSV supports model training. | Exported files load correctly in Python. | Not Started |
| P1 | Dataset Cleaning | 44 | Remove low-confidence frames | Filter frames with missing shoulders, head, hips, or low confidence. | Clean dataset has noisy samples removed. | Not Started |
| P1 | Dataset Cleaning | 45 | Balance classes | Avoid too many good posture samples compared to bad posture classes. | Class counts are roughly balanced or documented. | Not Started |
| P1 | Dataset Cleaning | 46 | Split by person or session | Avoid random frame-level split because adjacent frames are too similar. | Train/test do not share the same session, ideally not same person. | Not Started |
| P1 | Model Training | 47 | Evaluate rule-based baseline | Run collected data through rule system and record metrics. | Rule-only accuracy, precision, recall, and confusion matrix exist. | Not Started |
| P1 | Model Training | 48 | Train simple ML baselines | Train logistic regression, random forest, or XGBoost on posture features. | At least one classical ML model has metrics. | Not Started |
| P1 | Model Training | 49 | Train small NN classifier | Train a small neural network on normalized landmarks and features. Start binary good vs bad, then optional multi-class. | NN trains successfully and metrics are recorded. | Not Started |
| P1 | Model Training | 50 | Compare rule-only, ML-only, NN, and hybrid | Show why final approach is better or more reliable. | Comparison table/chart exists. | Not Started |
| P1 | Model Deployment | 51 | Export trained model | Convert model to TensorFlow.js, JSON weights, or simple JS inference format. | Model file exists inside extension model folder. | Not Started |
| P1 | Model Deployment | 52 | Add local model inference | Run model inside browser using normalized landmarks/features. | Extension produces live NN predictions. | Not Started |
| P1 | Model Deployment | 53 | Build model fallback logic | If model fails to load, extension should use rule-based mode. Protects demo. | App still works without model file. | Not Started |
| P1 | Hybrid System | 54 | Combine rule output and NN output | NN predicts good/bad. Rules provide specific reason. | Final state uses both model and rule results. | Not Started |
| P1 | Hybrid System | 55 | Add confidence scoring | Combine MediaPipe confidence, NN probability, rule strength, and temporal consistency. | Final output has label and confidence. | Not Started |
| P1 | Hybrid System | 56 | Connect hybrid result to alert system | Alerts should use smoothed hybrid decision, not raw frame output. | Alerts include final posture reason. | Not Started |
| P2 | Analytics | 57 | Track posture time | Track time spent in good, shrimp, forward lean, looking down, side lean, and uncertain states. | Session has duration per posture state. | Not Started |
| P2 | Analytics | 58 | Track number of alerts | Count posture alerts per session. | Alert count appears in session stats. | Not Started |
| P2 | Analytics | 59 | Build session summary panel | Show total time, good posture percentage, bad posture percentage, most common issue, alerts, and average score. | Stop session displays summary. | Not Started |
| P0 | Testing | 60 | Test extension loading | Test Chrome Load Unpacked on at least two machines. | Extension loads successfully outside dev machine. | Not Started |
| P0 | Testing | 61 | Test webcam behavior | Test start, stop, refresh, permission accepted, and permission denied. | Camera behavior is stable and clear. | Not Started |
| P0 | Testing | 62 | Test posture cases manually | Test good, shrimp, forward lean, looking down, side lean, no person, partial body, and poor lighting. | Each case has known behavior and documented failure cases. | Not Started |
| P1 | Testing | 63 | Test on unseen people | Try users not used during threshold tuning or training. | At least 2 unseen users test the system. | Not Started |
| P0 | Testing | 64 | Tune thresholds | Adjust slouch, forward lean, looking down, side lean, smoothing window, alert delay, and cooldown. | False alerts are reduced and demo feels stable. | Not Started |
| P1 | Documentation | 65 | Write architecture document | Document Webcam -> MediaPipe -> Landmarks -> Normalization -> Rules -> NN -> Hybrid -> Feedback. | Architecture diagram and explanation exist. | Not Started |
| P1 | Documentation | 66 | Write dataset document | Explain labels, people count, camera angles, no image/video storage, cleaning, and split strategy. | Dataset process is reproducible and privacy-safe. | Not Started |
| P1 | Documentation | 67 | Write evaluation document | Include rule-only, ML/NN, hybrid results, confusion matrix, and limitations. | Final approach is justified with metrics. | Not Started |
| P0 | Demo Prep | 68 | Prepare demo flow | Script: open extension, start webcam, show landmarks, calibrate, sit normally, slouch, alert, lean, stop, show summary. | Demo can be completed in under 3 minutes. | Not Started |
| P0 | Demo Prep | 69 | Record backup demo video | Record working system in case live demo fails. | Backup video shows complete pipeline. | Not Started |
| P0 | Demo Prep | 70 | Freeze features | Stop adding features before final testing. Only bug fixes and polish. | Final demo branch is stable. | Not Started |
