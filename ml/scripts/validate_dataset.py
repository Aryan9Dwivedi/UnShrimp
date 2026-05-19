import argparse
import json
import math
from collections import Counter
from typing import Any, Dict, List

POSTURE_LABELS = {
    "good_posture",
    "shrimp_slouch",
    "forward_lean",
    "looking_down",
    "side_lean",
}

FEATURE_NAMES = {
    "shoulder_slope",
    "shoulder_width",
    "head_center_x",
    "head_center_y",
    "shoulder_midpoint_x",
    "shoulder_midpoint_y",
    "hip_midpoint_x",
    "hip_midpoint_y",
    "head_to_shoulder_x_offset",
    "head_to_shoulder_y_offset",
    "nose_to_shoulder_y_offset",
    "torso_lean_proxy",
    "head_drop_proxy",
    "side_lean_proxy",
    "pose_confidence",
}

NULLABLE_FEATURES = {"hip_midpoint_x", "hip_midpoint_y", "torso_lean_proxy"}


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an UnShrimp raw dataset export.")
    parser.add_argument("--input", required=True, help="Path to unshrimp_dataset_raw.json")
    args = parser.parse_args()

    failures: List[str] = []
    warnings: List[str] = []

    try:
        with open(args.input, "r", encoding="utf-8") as handle:
            dataset = json.load(handle)
    except Exception as exc:
        print(f"FAIL: JSON could not be loaded: {exc}")
        return 1

    if not dataset.get("schema_version"):
        failures.append("schema_version is missing.")

    recordings = dataset.get("recordings")
    if not isinstance(recordings, list) or not recordings:
        failures.append("recordings is missing or empty.")
        recordings = []

    valid_samples = []
    dropped_samples = []
    invalid_labels = []
    bad_landmark_counts = 0
    bad_feature_objects = 0
    bad_numeric_values = 0

    for recording in recordings:
        for sample in recording.get("samples", []):
            if sample.get("quality_status") == "valid":
                valid_samples.append(sample)
                if sample.get("label") not in POSTURE_LABELS:
                    invalid_labels.append(sample.get("label"))
                if len(sample.get("raw_landmarks", [])) != 33 or len(sample.get("normalized_landmarks", [])) != 33:
                    bad_landmark_counts += 1
                if not has_required_features(sample.get("features", {})):
                    bad_feature_objects += 1
                if not numeric_fields_are_finite(sample):
                    bad_numeric_values += 1
            else:
                dropped_samples.append(sample)

    if not valid_samples:
        failures.append("No valid samples found.")
    if invalid_labels:
        failures.append(f"Invalid labels found: {sorted(set(str(label) for label in invalid_labels))}")
    if bad_landmark_counts:
        failures.append(f"{bad_landmark_counts} valid samples do not have 33 raw and normalized landmarks.")
    if bad_feature_objects:
        failures.append(f"{bad_feature_objects} valid samples are missing required posture features.")
    if bad_numeric_values:
        failures.append(f"{bad_numeric_values} valid samples contain NaN, Infinity, or non-finite numeric values.")

    label_counts = Counter(sample.get("label") for sample in valid_samples)
    person_counts = Counter(sample.get("person_id") for sample in valid_samples)
    session_counts = Counter(sample.get("session_id") for sample in valid_samples)
    dropped_rate = len(dropped_samples) / max(1, len(valid_samples) + len(dropped_samples))

    if len(label_counts) < 2 and valid_samples:
        warnings.append("Only one label has valid samples.")
    if any(count < 100 for count in label_counts.values()):
        warnings.append("Some labels have fewer than 100 valid samples.")
    if is_imbalanced(label_counts):
        warnings.append("Dataset is heavily imbalanced.")
    if dropped_rate > 0.25:
        warnings.append("Dropped sample rate is above 25%.")

    print("Label counts:")
    print_counts(label_counts)
    print("Person counts:")
    print_counts(person_counts)
    print("Session counts:")
    print_counts(session_counts)
    print(f"Dropped sample rate: {dropped_rate:.2%}")

    for warning in warnings:
        print(f"WARNING: {warning}")
    for failure in failures:
        print(f"FAIL: {failure}")

    if failures:
        print("Final result: FAIL")
        return 1
    if warnings:
        print("Final result: PASS_WITH_WARNINGS")
        return 0

    print("Final result: PASS")
    return 0


def has_required_features(features: Dict[str, Any]) -> bool:
    return isinstance(features, dict) and FEATURE_NAMES.issubset(features.keys())


def numeric_fields_are_finite(sample: Dict[str, Any]) -> bool:
    for key in ("timestamp_ms", "pose_confidence"):
        if not is_finite_number(sample.get(key)):
            return False

    for collection_name in ("raw_landmarks", "normalized_landmarks"):
        for landmark in sample.get(collection_name, []):
            for axis in ("x", "y", "z"):
                if not is_finite_number(landmark.get(axis)):
                    return False
            visibility = landmark.get("visibility")
            if visibility is not None and not is_finite_number(visibility):
                return False

    features = sample.get("features", {})
    for name in FEATURE_NAMES:
        value = features.get(name)
        if name in NULLABLE_FEATURES and value is None:
            continue
        if not is_finite_number(value):
            return False

    return True


def is_finite_number(value: Any) -> bool:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return False
    return math.isfinite(number)


def is_imbalanced(label_counts: Counter) -> bool:
    counts = [count for count in label_counts.values() if count > 0]
    if len(counts) < 2:
        return False
    return max(counts) / min(counts) > 2.5


def print_counts(counter: Counter) -> None:
    if not counter:
        print("  none")
        return
    for key, value in sorted(counter.items()):
        print(f"  {key}: {value}")


if __name__ == "__main__":
    raise SystemExit(main())
