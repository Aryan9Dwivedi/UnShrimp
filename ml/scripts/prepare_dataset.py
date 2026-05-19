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
    "side_lean",
}

FEATURE_NAMES = [
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

for index in range(33):
    CSV_COLUMNS.extend([f"x_{index}", f"y_{index}", f"z_{index}", f"v_{index}"])

CSV_COLUMNS.extend(FEATURE_NAMES)


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare UnShrimp exported JSON into train/val/test CSV files.")
    parser.add_argument("--input", required=True, help="Path to unshrimp_dataset_raw.json")
    parser.add_argument("--output", required=True, help="Output folder for processed CSV files")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as handle:
        dataset = json.load(handle)

    rows, dropped_bad_rows = collect_rows(dataset)
    if not rows:
        raise SystemExit("No valid finite rows found. Export more valid samples before preparing data.")

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
        warnings.append(f"Removed {dropped_bad_rows} valid-labeled rows because they contained invalid values.")

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
        "warnings": warnings,
        "csv_columns": CSV_COLUMNS,
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

    normalized_landmarks = sample.get("normalized_landmarks", [])
    if len(normalized_landmarks) != 33:
        raise ValueError("Expected 33 normalized landmarks.")

    row: Dict[str, Any] = {
        "sample_id": sample.get("sample_id", ""),
        "recording_id": sample.get("recording_id", ""),
        "person_id": sample.get("person_id", ""),
        "session_id": sample.get("session_id", ""),
        "camera_angle": sample.get("camera_angle", ""),
        "label": label,
        "timestamp_ms": sample.get("timestamp_ms", ""),
        "pose_confidence": sample.get("pose_confidence", ""),
        "quality_status": sample.get("quality_status", ""),
    }

    for index, landmark in enumerate(normalized_landmarks):
        row[f"x_{index}"] = landmark.get("x")
        row[f"y_{index}"] = landmark.get("y")
        row[f"z_{index}"] = landmark.get("z")
        row[f"v_{index}"] = landmark.get("visibility", "")

    features = sample.get("features", {})
    for feature_name in FEATURE_NAMES:
        row[feature_name] = features.get(feature_name, "")

    if list(row.keys()) != CSV_COLUMNS:
        raise ValueError("Fixed CSV columns do not match.")

    for column in CSV_COLUMNS:
        if column in {"sample_id", "recording_id", "person_id", "session_id", "camera_angle", "label", "quality_status"}:
            continue
        value = row[column]
        if value == "" and column.startswith("v_"):
            continue
        if value in {"", None} and column in {"hip_midpoint_x", "hip_midpoint_y", "torso_lean_proxy"}:
            continue
        if not is_finite_number(value):
            raise ValueError(f"Column {column} is not finite.")

    return row


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


def is_finite_number(value: Any) -> bool:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return False
    return math.isfinite(number)


if __name__ == "__main__":
    raise SystemExit(main())
