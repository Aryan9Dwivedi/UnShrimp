# UnShrimp ML

This folder contains the first neural-network training pipeline for UnShrimp.

The current model input comes from `data/gmo/`:

- shoulder-normalized upper-body landmarks
- engineered posture features
- four labels: `good_posture`, `shrimp_slouch`, `forward_lean`, `looking_down`

Validation and test splits are real-only. Augmentation is used only in `train.csv`.

## Setup

From the repo root on Windows PowerShell:

```powershell
py -3.11 -m venv .venv-ml
.\.venv-ml\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r ml\requirements.txt
```

If `py -3.11` is not available, use a Python 3.10 or 3.11 install. TensorFlow support can be sensitive to Python version.

macOS/Linux:

```bash
python3.11 -m venv .venv-ml
source .venv-ml/bin/activate
python -m pip install --upgrade pip
pip install -r ml/requirements.txt
```

## Start Training

Do not run this until you are ready to train:

```powershell
python ml\scripts\train_nn.py --data-dir data\gmo --model-dir models\unshrimp_posture_nn --eval-dir ml\Eval --epochs 100 --batch-size 32
```

The default neural network follows the research direction:

- 3 hidden layers
- 100 perceptrons each
- ReLU activation
- Adam optimizer
- learning rate `0.001`
- up to 100 epochs

## Outputs

Model artifacts are written to:

```text
models/unshrimp_posture_nn/
```

Evaluation outputs are written to:

```text
ml/Eval/
```

Expected evaluation files:

- `training_curves.png`
- `confusion_matrix_val.png`
- `confusion_matrix_test.png`
- `classification_report_val.json`
- `classification_report_test.json`
- `metrics.json`

## Evaluate A Saved Model

After training:

```powershell
python ml\scripts\evaluate_saved_model.py --data-dir data\gmo --model-dir models\unshrimp_posture_nn --eval-dir ml\Eval
```

## Hybrid Direction

The NN predicts the posture class. Rule helpers in `ml/utils/rule_baseline.py` and `ml/utils/hybrid_inference.py` provide the beginning of the rule-plus-NN path that will later be mirrored in the Chrome extension.
