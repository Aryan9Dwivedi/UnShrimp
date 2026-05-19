import argparse
import csv
import json
import math
import os
import random
from collections import Counter, defaultdict
from typing import Any, Dict, Iterable, List, Tuple

POSTURE_LABELS = {
    "good_posture",
    "shrimp_slouch",
    "forward_lean",
    "looking_down",
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

FEATURE_NAMES = [
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
]

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

CSV_COLUMNS = [
    "sample_id",
    "recording_id",
    "person_id",
    "session_id",
    "camera_angle",
    "label",
    "timestamp_ms",
    "pose_confidence",
    "quality_status",
]

for name in TRAINING_LANDMARKS:
    CSV_COLUMNS.extend([f"{name}_x", f"{name}_y", f"{name}_z", f"{name}_v"])

CSV_COLUMNS.extend(FEATURE_NAMES)


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare UnShrimp raw JSON into upper-body v1 train/val/test CSV files.")
    parser.add_argument("--input", required=True, help="Path to unshrimp_dataset_raw.json")
    parser.add_argument("--output", required=True, help="Output folder for processed CSV files")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as handle:
        dataset = json.load(handle)

    rows, dropped_bad_rows = collect_rows(dataset)
    if not rows:
        raise SystemExit("No valid finite upper-body rows found. Re-export data with the v1 DataTool schema.")

    label_counts = Counter(row["label"] for row in rows)
    person_counts = Counter(row["person_id"] for row in rows)
    session_counts = Counter(row["session_id"] for row in rows)

    print("Label counts:")
    print_counts(label_counts)
    print("Person counts:")
    print_counts(person_counts)
    print("Session counts:")
    print_counts(session_counts)

    train_rows, val_rows, test_rows, strategy, warnings = split_rows(rows)
    if dropped_bad_rows:
        warnings.append(f"Removed {dropped_bad_rows} valid-labeled rows because they failed v1 training schema checks.")
    if has_forbidden_columns(CSV_COLUMNS):
        raise SystemExit("Forbidden lower-body columns are present in CSV_COLUMNS.")

    os.makedirs(args.output, exist_ok=True)
    write_csv(os.path.join(args.output, "train.csv"), train_rows)
    write_csv(os.path.join(args.output, "val.csv"), val_rows)
    write_csv(os.path.join(args.output, "test.csv"), test_rows)

    report = {
        "input_file": os.path.abspath(args.input),
        "split_strategy": strategy,
        "row_count": len(rows),
        "train_count": len(train_rows),
        "val_count": len(val_rows),
        "test_count": len(test_rows),
        "label_counts": dict(label_counts),
        "person_counts": dict(person_counts),
        "session_counts": dict(session_counts),
        "training_landmarks": TRAINING_LANDMARKS,
        "feature_names": FEATURE_NAMES,
        "csv_columns": CSV_COLUMNS,
        "forbidden_columns_excluded": True,
        "warnings": warnings,
    }
    with open(os.path.join(args.output, "dataset_report.json"), "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)

    print(f"Wrote {os.path.join(args.output, 'train.csv')}")
    print(f"Wrote {os.path.join(args.output, 'val.csv')}")
    print(f"Wrote {os.path.join(args.output, 'test.csv')}")
    print(f"Wrote {os.path.join(args.output, 'dataset_report.json')}")
    return 0


def collect_rows(dataset: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], int]:
    rows: List[Dict[str, Any]] = []
    dropped_bad_rows = 0

    for recording in dataset.get("recordings", []):
        for sample in recording.get("samples", []):
            if sample.get("quality_status") != "valid":
                continue
            try:
                row = flatten_sample(sample)
            except ValueError:
                dropped_bad_rows += 1
                continue
            rows.append(row)

    return rows, dropped_bad_rows


def flatten_sample(sample: Dict[str, Any]) -> Dict[str, Any]:
    label = sample.get("label")
    if label not in POSTURE_LABELS:
        raise ValueError(f"Invalid label: {label}")

    normalized_by_name = landmarks_by_name(sample.get("training_landmarks") or sample.get("normalized_landmarks", []))
    if not all(name in normalized_by_name for name in TRAINING_LANDMARKS):
        raise ValueError("Missing selected upper-body training landmarks.")

    row: Dict[str, Any] = {
        "sample_id": required_text(sample, "sample_id"),
        "recording_id": required_text(sample, "recording_id"),
        "person_id": required_text(sample, "person_id"),
        "session_id": required_text(sample, "session_id"),
        "camera_angle": required_text(sample, "camera_angle"),
        "label": label,
        "timestamp_ms": sample.get("timestamp_ms"),
        "pose_confidence": sample.get("pose_confidence"),
        "quality_status": sample.get("quality_status"),
    }

    for name in TRAINING_LANDMARKS:
        landmark = normalized_by_name[name]
        row[f"{name}_x"] = landmark.get("x")
        row[f"{name}_y"] = landmark.get("y")
        row[f"{name}_z"] = landmark.get("z")
        row[f"{name}_v"] = landmark.get("visibility", 1)

    features = sample.get("features", {})
    for feature_name in FEATURE_NAMES:
        row[feature_name] = features.get(feature_name)

    if list(row.keys()) != CSV_COLUMNS:
        raise ValueError("Fixed CSV columns do not match.")
    if has_forbidden_columns(row.keys()):
        raise ValueError("Forbidden lower-body column present.")

    for column in CSV_COLUMNS:
        if column in {"sample_id", "recording_id", "person_id", "session_id", "camera_angle", "label", "quality_status"}:
            if row[column] in {"", None}:
                raise ValueError(f"Column {column} is empty.")
            continue
        if row[column] in {"", None} or not is_finite_number(row[column]):
            raise ValueError(f"Column {column} is not finite.")

    return row


def landmarks_by_name(landmarks: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    return {
        landmark.get("name"): landmark
        for landmark in landmarks
        if isinstance(landmark, dict) and isinstance(landmark.get("name"), str)
    }


def required_text(sample: Dict[str, Any], key: str) -> str:
    value = sample.get(key)
    if not isinstance(value, str) or not value:
        raise ValueError(f"Missing required field {key}.")
    return value


def split_rows(rows: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], str, List[str]]:
    people = sorted({row["person_id"] for row in rows})
    sessions = sorted({row["session_id"] for row in rows})
    warnings: List[str] = []

    if len(people) >= 5:
        return split_by_group(rows, "person_id", "person")
    if len(sessions) >= 3:
        return split_by_group(rows, "session_id", "session")

    warnings.append("Not enough people or sessions for grouped split. Used random row split.")
    shuffled = rows[:]
    random.Random(42).shuffle(shuffled)
    train_rows, val_rows, test_rows = split_sequence(shuffled)
    return train_rows, val_rows, test_rows, "random", warnings


def split_by_group(
    rows: List[Dict[str, Any]],
    group_key: str,
    strategy_name: str,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], str, List[str]]:
    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[row[group_key]].append(row)

    keys = list(grouped.keys())
    random.Random(42).shuffle(keys)
    train_keys, val_keys, test_keys = split_sequence(keys)

    def collect(keys_subset: Iterable[str]) -> List[Dict[str, Any]]:
        collected: List[Dict[str, Any]] = []
        for key in keys_subset:
            collected.extend(grouped[key])
        return collected

    return collect(train_keys), collect(val_keys), collect(test_keys), f"by_{strategy_name}", []


def split_sequence(items: List[Any]) -> Tuple[List[Any], List[Any], List[Any]]:
    if len(items) <= 1:
        return items, [], []

    train_end = max(1, round(len(items) * 0.70))
    val_end = max(train_end, train_end + round(len(items) * 0.15))
    if val_end >= len(items) and len(items) >= 3:
        val_end = len(items) - 1

    return items[:train_end], items[train_end:val_end], items[val_end:]


def write_csv(path: str, rows: List[Dict[str, Any]]) -> None:
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def print_counts(counter: Counter) -> None:
    for key, value in sorted(counter.items()):
        print(f"  {key}: {value}")


def has_forbidden_columns(columns: Iterable[str]) -> bool:
    return any(any(column.startswith(prefix) for prefix in FORBIDDEN_COLUMN_PREFIXES) for column in columns)


def is_finite_number(value: Any) -> bool:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return False
    return math.isfinite(number)


if __name__ == "__main__":
    raise SystemExit(main())
