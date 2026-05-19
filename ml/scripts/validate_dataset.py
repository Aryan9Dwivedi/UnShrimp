import argparse
import json
import math
from collections import Counter
from typing import Any, Dict, Iterable, List

POSTURE_LABELS = {
    "good_posture",
    "shrimp_slouch",
    "forward_lean",
    "looking_down",
    "side_lean",
}

TRAINING_LANDMARKS = [
    "nose",
    "left_eye_inner",
    "left_eye",
    "left_eye_outer",
    "right_eye_inner",
    "right_eye",
    "right_eye_outer",
    "left_ear",
    "right_ear",
    "mouth_left",
    "mouth_right",
    "left_shoulder",
    "right_shoulder",
]

FEATURE_NAMES = {
    "shoulder_slope",
    "head_center_x",
    "head_center_y",
    "head_center_z",
    "shoulder_midpoint_x",
    "shoulder_midpoint_y",
    "shoulder_midpoint_z",
    "head_to_shoulder_x_offset",
    "head_to_shoulder_y_offset",
    "head_to_shoulder_z_offset",
    "nose_to_shoulder_y_offset",
    "nose_to_shoulder_z_offset",
    "face_tilt_proxy",
    "head_drop_proxy",
    "side_lean_proxy",
    "upper_body_confidence",
}

FORBIDDEN_COLUMN_PREFIXES = [
    "left_hip_",
    "right_hip_",
    "left_knee_",
    "right_knee_",
    "left_ankle_",
    "right_ankle_",
    "left_heel_",
    "right_heel_",
    "left_foot_index_",
    "right_foot_index_",
]


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an UnShrimp raw dataset export for v1 NN training.")
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
    bad_raw_or_normalized = 0
    bad_training_landmarks = 0
    bad_features = 0
    bad_numeric_values = 0
    missing_shoulders = 0
    missing_head_signal = 0

    for recording in recordings:
        for sample in recording.get("samples", []):
            if sample.get("quality_status") == "valid":
                valid_samples.append(sample)
                if sample.get("label") not in POSTURE_LABELS:
                    invalid_labels.append(sample.get("label"))
                if len(sample.get("raw_landmarks", [])) != 33 or len(sample.get("normalized_landmarks", [])) != 33:
                    bad_raw_or_normalized += 1
                if not has_training_landmarks(sample):
                    bad_training_landmarks += 1
                if not has_required_features(sample.get("features", {})):
                    bad_features += 1
                if not training_fields_are_finite(sample):
                    bad_numeric_values += 1
                if not has_shoulders(sample.get("raw_landmarks", [])):
                    missing_shoulders += 1
                if not has_head_signal(sample.get("raw_landmarks", [])):
                    missing_head_signal += 1
            else:
                dropped_samples.append(sample)

    if not valid_samples:
        failures.append("No valid samples found.")
    if invalid_labels:
        failures.append(f"Invalid labels found: {sorted(set(str(label) for label in invalid_labels))}")
    if bad_raw_or_normalized:
        failures.append(f"{bad_raw_or_normalized} valid samples do not keep 33 raw and normalized landmarks.")
    if bad_training_landmarks:
        failures.append(f"{bad_training_landmarks} valid samples are missing selected upper-body training landmarks.")
    if bad_features:
        failures.append(f"{bad_features} valid samples are missing required v1 features.")
    if bad_numeric_values:
        failures.append(f"{bad_numeric_values} valid samples contain null, NaN, Infinity, or non-finite training values.")
    if missing_shoulders:
        failures.append(f"{missing_shoulders} valid samples are missing shoulders.")
    if missing_head_signal:
        failures.append(f"{missing_head_signal} valid samples are missing a usable head signal.")

    label_counts = Counter(sample.get("label") for sample in valid_samples)
    person_counts = Counter(sample.get("person_id") for sample in valid_samples)
    session_counts = Counter(sample.get("session_id") for sample in valid_samples)
    dropped_rate = len(dropped_samples) / max(1, len(valid_samples) + len(dropped_samples))

    if len(label_counts) < len(POSTURE_LABELS) and valid_samples:
        warnings.append("Not all five labels have valid samples.")
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
    print("Lower-body landmarks required: no")
    print("Training landmarks:")
    for name in TRAINING_LANDMARKS:
        print(f"  {name}")

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


def has_training_landmarks(sample: Dict[str, Any]) -> bool:
    training_landmarks = sample.get("training_landmarks", [])
    names = {landmark.get("name") for landmark in training_landmarks if isinstance(landmark, dict)}
    return len(training_landmarks) == len(TRAINING_LANDMARKS) and set(TRAINING_LANDMARKS).issubset(names)


def has_required_features(features: Dict[str, Any]) -> bool:
    return isinstance(features, dict) and FEATURE_NAMES.issubset(features.keys())


def training_fields_are_finite(sample: Dict[str, Any]) -> bool:
    for key in ("timestamp_ms", "pose_confidence"):
        if not is_finite_number(sample.get(key)):
            return False

    for landmark in sample.get("training_landmarks", []):
        if landmark.get("name") not in TRAINING_LANDMARKS:
            return False
        for axis in ("x", "y", "z"):
            if not is_finite_number(landmark.get(axis)):
                return False
        if not is_finite_number(landmark.get("visibility", 1)):
            return False

    features = sample.get("features", {})
    for name in FEATURE_NAMES:
        if not is_finite_number(features.get(name)):
            return False

    return True


def has_shoulders(landmarks: List[Dict[str, Any]]) -> bool:
    names = {landmark.get("name") for landmark in landmarks if isinstance(landmark, dict)}
    return "left_shoulder" in names and "right_shoulder" in names


def has_head_signal(landmarks: List[Dict[str, Any]]) -> bool:
    names = {landmark.get("name") for landmark in landmarks if isinstance(landmark, dict)}
    face_names = {
        "left_eye_inner",
        "left_eye",
        "left_eye_outer",
        "right_eye_inner",
        "right_eye",
        "right_eye_outer",
        "mouth_left",
        "mouth_right",
    }
    return "nose" in names or {"left_ear", "right_ear"}.issubset(names) or len(face_names.intersection(names)) >= 2


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


def has_forbidden_columns(columns: Iterable[str]) -> bool:
    return any(any(column.startswith(prefix) for prefix in FORBIDDEN_COLUMN_PREFIXES) for column in columns)


def print_counts(counter: Counter) -> None:
    if not counter:
        print("  none")
        return
    for key, value in sorted(counter.items()):
        print(f"  {key}: {value}")


if __name__ == "__main__":
    raise SystemExit(main())
