from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import tensorflow as tf
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_recall_fscore_support

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.utils.constants import LABELS
from ml.utils.data_loader import load_dataset_splits
from ml.utils.plots import save_confusion_matrix


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate a saved UnShrimp NN model.")
    parser.add_argument("--data-dir", default="data/gmo")
    parser.add_argument("--model-dir", default="models/unshrimp_posture_nn")
    parser.add_argument("--eval-dir", default="ml/Eval")
    args = parser.parse_args()

    model_dir = Path(args.model_dir)
    eval_dir = Path(args.eval_dir)
    eval_dir.mkdir(parents=True, exist_ok=True)

    data = load_dataset_splits(args.data_dir)
    model = tf.keras.models.load_model(model_dir / "posture_nn.keras")
    preprocessor = joblib.load(model_dir / "preprocessor.joblib")

    if preprocessor["feature_columns"] != data.feature_columns:
        raise ValueError("Saved feature columns do not match current dataset columns.")

    val_metrics = evaluate_split(model, data.x_val, data.y_val, "val", eval_dir)
    test_metrics = evaluate_split(model, data.x_test, data.y_test, "test", eval_dir)
    write_json(eval_dir / "metrics_recheck.json", {"val": val_metrics, "test": test_metrics})

    print(f"Validation accuracy: {val_metrics['accuracy']:.4f}")
    print(f"Test accuracy: {test_metrics['accuracy']:.4f}")
    return 0


def evaluate_split(model: tf.keras.Model, x: np.ndarray, y: np.ndarray, split_name: str, eval_dir: Path) -> dict:
    probabilities = model.predict(x, verbose=0)
    predictions = np.argmax(probabilities, axis=1)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y,
        predictions,
        average="weighted",
        zero_division=0,
    )
    accuracy = accuracy_score(y, predictions)
    report = classification_report(
        y,
        predictions,
        target_names=LABELS,
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(y, predictions, labels=list(range(len(LABELS))))
    save_confusion_matrix(
        y,
        predictions,
        LABELS,
        eval_dir / f"confusion_matrix_{split_name}_recheck.png",
        f"{split_name.upper()} Confusion Matrix Recheck",
    )
    write_json(eval_dir / f"classification_report_{split_name}_recheck.json", report)
    return {
        "accuracy": float(accuracy),
        "precision_weighted": float(precision),
        "recall_weighted": float(recall),
        "f1_weighted": float(f1),
        "confusion_matrix": matrix.tolist(),
    }


def write_json(path: Path, data: dict) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)
        handle.write("\n")


if __name__ == "__main__":
    raise SystemExit(main())
