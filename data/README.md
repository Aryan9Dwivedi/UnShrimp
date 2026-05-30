# Data

This folder stores the model-ready dataset used by the UnShrimp ML pipeline.

## Current Dataset

The active dataset is in:

```text
data/gmo/
```

It was copied from the DataFeed `GMOData` output after merge, filtering, normalization, train-only augmentation, and train/validation/test splitting.

## Important Notes

- The data is front-angle-only right now because that is what the team collected.
- The training data is upper-body-only and shoulder-normalized.
- Validation and test files are real collected samples only.
- Augmented samples are used only in `train.csv`.
