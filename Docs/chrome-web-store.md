# Chrome Web Store — UnShrimp checklist

Use this when the extension builds cleanly from `extension/` and posture detection is acceptable for demo.

## Before you submit

- [ ] `cd extension && npm run build`
- [ ] Load `extension/dist` in Chrome → full flow works (camera, calibrate, slouch, alert)
- [ ] Test on a second machine (Load Unpacked)
- [ ] Merge `dev` → `main` if store build should include latest fixes

## Developer account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time **$5** registration (if not already done)
3. Verify identity if prompted

## Package to upload

Chrome wants the **built** extension, not source.

```bash
cd extension
npm run build
cd dist
zip -r ../unshrimp-v0.1.0.zip .
```

Upload `unshrimp-v0.1.0.zip` in the dashboard (**Package** tab).

**Do not** zip `node_modules`, `src/`, or the repo root.

## Store listing copy

Use text from [`store/listing.md`](../store/listing.md).

| Field | Limit |
|-------|--------|
| Short description | 132 chars max |
| Detailed description | See listing.md |

## Privacy policy (required)

Chrome requires a **public HTTPS URL** because the extension uses the camera.

1. Host [`Docs/privacy-policy.html`](privacy-policy.html) via GitHub Pages (deploy **main** from **/ (root)**).
2. Example URL after Pages is enabled:  
   `https://aryan9dwivedi.github.io/UnShrimp/Docs/privacy-policy.html`
3. Paste that URL in the store listing **Privacy policy** field.

Steps for GitHub Pages (project site from `/docs`):

1. Repo **Settings → Pages**
2. Source: **Deploy from branch** → `main` → folder **`/docs`**
3. Save; wait for deploy
4. Use `https://aryan9dwivedi.github.io/UnShrimp/Docs/privacy-policy.html` (adjust org/repo name)

## Screenshots (required)

Capture from the **monitor page** after `npm run build` + reload extension.

| Asset | Size | What to show |
|-------|------|----------------|
| Screenshot 1 (required) | **1280×800** or **640×400** | Full monitor UI, camera on, good posture |
| Screenshot 2 | Same | Slouch / alert / Shrimp Index orange or red |
| Screenshot 3 (optional) | Same | Quick setup or calibration |
| Small promo tile (optional) | **440×280** | Logo + tagline |
| Marquee (optional) | **1400×560** | Hero banner |

macOS: resize with Preview or screenshot at stable window width (~1280px wide).

## Icons

Built into `extension/public/icons/` (16, 32, 48, 128). Regenerate from mascot:

```bash
# from repo root, after updating shrimp-mascot.png
python3 store/scripts/generate-icons.py
cd extension && npm run build
```

Store dashboard also asks for **128×128** — same as `icon128.png`.

## Permissions justification (review form)

Copy from [`store/permissions-justification.md`](../store/permissions-justification.md).

| Permission | Why |
|------------|-----|
| **Camera** | Not in manifest; requested at runtime on monitor page only when user clicks Start. |
| **Notifications** | Optional alerts after sustained bad posture. |

## Single purpose

> UnShrimp helps people maintain healthier seated posture while working at a computer by using the webcam locally to detect slouching and provide real-time feedback.

## Data use (dashboard questionnaire)

- **Does not sell user data**
- **Does not collect personal data on a server** — processing is on-device
- **Camera**: used only when user starts monitoring; no upload, no storage of photos/video
- **Local storage**: calibration baseline in `localStorage` on the user’s machine only

## Category & audience

- **Category**: Productivity or Health & fitness
- **Mature content**: No
- **Region**: as needed

## After upload

1. Submit for review (often 1–3 business days; can take longer)
2. Fix any rejection reasons (permissions wording, privacy URL, misleading claims)
3. Publish **Unlisted** first for class/demo, then **Public** when ready

## Common rejection reasons

- Privacy policy URL missing or not HTTPS
- Vague permission justification for `notifications`
- Screenshots don’t match actual UI
- Promising medical outcomes — keep copy “wellness / posture reminder”, not diagnosis
- `wasm-unsafe-eval` in CSP — required for MediaPipe WASM; mention in review notes if asked

## Review note (optional paste in submission)

> UnShrimp runs pose estimation and posture classification entirely in the browser. The user must open the monitor page and click Start to enable the camera. Webcam frames are not transmitted or stored. Calibration data is saved locally in localStorage. Notifications are optional and only fire after sustained poor posture.
