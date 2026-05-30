# UnShrimp DataFeed

This branch stores the dataset pipeline for the UnShrimp posture classifier.

## Completed

- `RawData/` contains the collected DataTool exports from the team.
- `GMOScripts/` contains the preprocessing script that merges raw JSON exports, filters to the v1 labels, validates upper-body training fields, creates conservative train-only augmentation, and writes final CSV splits.
- `GMOData/` contains the final model-ready dataset files.

## Final V1 Labels

- `good_posture`
- `shrimp_slouch`
- `forward_lean`
- `looking_down`

## Final Dataset Files

- `GMOData/unshrimp_gmo_master_raw.json`
- `GMOData/unshrimp_gmo_training.csv`
- `GMOData/train.csv`
- `GMOData/val.csv`
- `GMOData/test.csv`
- `GMOData/dataset_report.json`

## Notes

- Current collected data is front-angle only.
- `side_lean` samples are excluded from the final v1 training dataset.
- Augmentation is applied only to `train.csv`; `val.csv` and `test.csv` contain real collected samples only.
- The model input remains upper-body-only: face/head landmarks, shoulder landmarks, and engineered posture features.
