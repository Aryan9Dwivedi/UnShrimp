# Permission justifications (Chrome Web Store)

Paste these into the developer dashboard when Chrome asks why each capability is needed.

## notifications

UnShrimp uses Chrome notifications only to optionally alert the user after **sustained** poor seated posture (for example, slouching for several seconds). The user can disable sounds and alerts in **Anti-Shrimp Protocols** on the monitor page. Notifications are not used for advertising or background tracking.

## Camera (runtime — not a manifest permission)

The extension does **not** declare `videoCapture` in the manifest. Camera access is requested with `getUserMedia` only when the user clicks **Begin Unshrimping** on the monitor page. If the user never starts monitoring, the camera is never accessed.

**Reviewer testing:** Open popup → Open Monitor → Begin Unshrimping → Allow camera.

## Host permissions

None. The extension does not inject content scripts into other sites.

## Remote code

None. Models and WASM ship inside the extension package.

## Storage

`localStorage` stores the user’s calibration baseline (numeric pose features) on device only. No cloud sync.

## Content Security Policy — wasm-unsafe-eval

Required to run the bundled MediaPipe Pose Landmarker WebAssembly runtime locally. No external scripts are loaded at runtime beyond Google Fonts for UI typography.
