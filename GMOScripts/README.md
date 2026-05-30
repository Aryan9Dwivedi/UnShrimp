# GMO Dataset Scripts

This folder contains the scripts that turn exported UnShrimp DataTool files into the final model-ready dataset.

## Input

Put DataTool raw exports in:

```text
../RawData/
```

The script reads files matching `*raw*.json`.

## Build Final Dataset

From this folder:

```bash
python build_gmo_dataset.py
```

Or from the repo root:

```bash
python DataFeed/GMOScripts/build_gmo_dataset.py
```

## Output

The script writes final files to:

```text
../GMOData/
```

Generated files:

- `unshrimp_gmo_master_raw.json`
- `unshrimp_gmo_manifest.json`
- `unshrimp_gmo_training.csv`
- `train.csv`
- `val.csv`
- `test.csv`
- `dataset_report.json`

## Rules

- Uses only DataTool schema `2.0.0`.
- Uses only v1 labels: `good_posture`, `shrimp_slouch`, `forward_lean`, `looking_down`.
- Excludes `side_lean` samples from final training data.
- Keeps the model input upper-body only.
- Uses raw JSON as the source of truth; CSV files from DataTool are not merged directly.
