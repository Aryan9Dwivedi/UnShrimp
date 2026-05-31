from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import tensorflow as tf


def main() -> int:
    parser = argparse.ArgumentParser(description="Export the trained UnShrimp NN for plain browser inference.")
    parser.add_argument("--model-dir", default="models/unshrimp_posture_nn")
    parser.add_argument("--output", default="extension/public/model/unshrimp_posture_nn_browser.json")
    args = parser.parse_args()

    model_dir = Path(args.model_dir)
    output_path = Path(args.output)
    model = tf.keras.models.load_model(model_dir / "posture_nn.keras")
    preprocessor = joblib.load(model_dir / "preprocessor.joblib")
    metadata = read_json(model_dir / "metadata.json")

    dense_layers = []
    for layer in model.layers:
        if not isinstance(layer, tf.keras.layers.Dense):
            continue
        weights, bias = layer.get_weights()
        dense_layers.append(
            {
                "activation": layer.activation.__name__,
                "weights": weights.tolist(),
                "bias": bias.tolist(),
            }
        )

    scaler = preprocessor["scaler"]
    browser_model = {
        "schema_version": "1.0.0",
        "model_name": metadata.get("model_name", "unshrimp_posture_nn"),
        "labels": metadata["labels"],
        "feature_columns": preprocessor["feature_columns"],
        "scaler": {
            "mean": scaler.mean_.tolist(),
            "scale": scaler.scale_.tolist(),
        },
        "layers": dense_layers,
        "metrics": metadata.get("metrics", {}),
        "notes": [
            "Plain JSON export for browser-side inference.",
            "Apply scaler before dense-layer inference.",
            "Do not send webcam frames or landmarks to a server.",
        ],
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(browser_model, handle, separators=(",", ":"))
        handle.write("\n")

    print(f"Wrote browser model: {output_path}")
    print(f"Feature count: {len(browser_model['feature_columns'])}")
    print(f"Layer count: {len(browser_model['layers'])}")
    return 0


def read_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


if __name__ == "__main__":
    raise SystemExit(main())
