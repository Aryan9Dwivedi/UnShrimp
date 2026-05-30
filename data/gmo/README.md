# GMO Model Dataset

This folder contains the current model-ready dataset for UnShrimp posture classification.

## Files

- `train.csv`: training split with conservative augmentation included.
- `train_original.csv`: training split before augmentation.
- `train_augmented_only.csv`: generated training-only augmented rows.
- `val.csv`: validation split, real samples only.
- `test.csv`: test split, real samples only.
- `unshrimp_gmo_training.csv`: all clean real training rows before splitting.
- `unshrimp_gmo_master_raw.json`: merged source-of-truth JSON from valid raw exports.
- `unshrimp_gmo_manifest.json`: schema and count summary.
- `dataset_report.json`: split, label, warning, and data-health report.

## Status

This dataset is normalized and structurally ready for the first neural-network training pass.

Known limitation: all collected samples are from the front camera angle.
