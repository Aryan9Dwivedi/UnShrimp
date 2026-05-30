# Models

This folder stores trained model artifacts that can later be wired into the Chrome extension.

The first NN training script writes to:

```text
models/unshrimp_posture_nn/
```

Expected files after training:

- `posture_nn.keras`
- `preprocessor.joblib`
- `metadata.json`
- `label_map.json`

Browser/extension export is the next phase after the Python model has been trained and evaluated.
