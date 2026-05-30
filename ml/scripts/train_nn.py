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

from ml.utils.constants import ID_TO_LABEL, LABELS, LABEL_TO_ID
from ml.utils.data_loader import load_dataset_splits
from ml.utils.plots import save_confusion_matrix, save_training_curves


def main() -> int:
    parser = argparse.ArgumentParser(description="Train the UnShrimp posture neural network.")
    parser.add_argument("--data-dir", default="data/gmo", help="Folder containing train/val/test CSV files.")
    parser.add_argument("--model-dir", default="models/unshrimp_posture_nn", help="Folder for model artifacts.")
    parser.add_argument("--eval-dir", default="ml/Eval", help="Folder for evaluation outputs.")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--dropout", type=float, default=0.0)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--no-early-stopping", action="store_true")
    args = parser.parse_args()

    set_seed(args.seed)
    data = load_dataset_splits(args.data_dir)
    model_dir = Path(args.model_dir)
    eval_dir = Path(args.eval_dir)
    model_dir.mkdir(parents=True, exist_ok=True)
    eval_dir.mkdir(parents=True, exist_ok=True)

    model = build_model(
        input_dim=data.x_train.shape[1],
        num_classes=len(LABELS),
        learning_rate=args.learning_rate,
        dropout=args.dropout,
    )

    callbacks = []
    if not args.no_early_stopping:
        callbacks.extend(
            [
                tf.keras.callbacks.EarlyStopping(
                    monitor="val_loss",
                    patience=15,
                    restore_best_weights=True,
                ),
                tf.keras.callbacks.ReduceLROnPlateau(
                    monitor="val_loss",
                    factor=0.5,
                    patience=6,
                    min_lr=1e-6,
                ),
            ]
        )

    history = model.fit(
        data.x_train,
        data.y_train,
        validation_data=(data.x_val, data.y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=callbacks,
        verbose=1,
    )

    val_metrics = evaluate_split(model, data.x_val, data.y_val, "val", eval_dir)
    test_metrics = evaluate_split(model, data.x_test, data.y_test, "test", eval_dir)
    save_training_curves(history.history, eval_dir / "training_curves.png")

    model.save(model_dir / "posture_nn.keras")
    joblib.dump(
        {
            "scaler": data.scaler,
            "feature_columns": data.feature_columns,
            "labels": LABELS,
        },
        model_dir / "preprocessor.joblib",
    )

    metadata = {
        "model_name": "unshrimp_posture_nn",
        "labels": LABELS,
        "label_to_id": LABEL_TO_ID,
        "id_to_label": ID_TO_LABEL,
        "feature_columns": data.feature_columns,
        "input_dim": data.x_train.shape[1],
        "architecture": {
            "hidden_layers": [100, 100, 100],
            "activation": "relu",
            "optimizer": "adam",
            "learning_rate": args.learning_rate,
            "epochs_requested": args.epochs,
            "dropout": args.dropout,
        },
        "splits": {
            "train_rows": int(data.x_train.shape[0]),
            "val_rows": int(data.x_val.shape[0]),
            "test_rows": int(data.x_test.shape[0]),
        },
        "metrics": {
            "val": val_metrics,
            "test": test_metrics,
        },
    }
    write_json(model_dir / "metadata.json", metadata)
    write_json(model_dir / "label_map.json", {"labels": LABELS, "label_to_id": LABEL_TO_ID, "id_to_label": ID_TO_LABEL})
    write_json(eval_dir / "metrics.json", metadata["metrics"])

    print("Training complete.")
    print(f"Validation accuracy: {val_metrics['accuracy']:.4f}")
    print(f"Test accuracy: {test_metrics['accuracy']:.4f}")
    print(f"Model written to: {model_dir}")
    print(f"Evaluation written to: {eval_dir}")
    return 0


def build_model(input_dim: int, num_classes: int, learning_rate: float, dropout: float) -> tf.keras.Model:
    layers: list[tf.keras.layers.Layer] = [tf.keras.layers.Input(shape=(input_dim,))]
    for _ in range(3):
        layers.append(tf.keras.layers.Dense(100, activation="relu"))
        if dropout > 0:
            layers.append(tf.keras.layers.Dropout(dropout))
    layers.append(tf.keras.layers.Dense(num_classes, activation="softmax"))

    model = tf.keras.Sequential(layers)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


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
    metrics = {
        "accuracy": float(accuracy),
        "precision_weighted": float(precision),
        "recall_weighted": float(recall),
        "f1_weighted": float(f1),
        "confusion_matrix": matrix.tolist(),
    }

    write_json(eval_dir / f"classification_report_{split_name}.json", report)
    save_confusion_matrix(
        y,
        predictions,
        LABELS,
        eval_dir / f"confusion_matrix_{split_name}.png",
        f"{split_name.upper()} Confusion Matrix",
    )
    return metrics


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)
        handle.write("\n")


def set_seed(seed: int) -> None:
    np.random.seed(seed)
    tf.random.set_seed(seed)


if __name__ == "__main__":
    raise SystemExit(main())
