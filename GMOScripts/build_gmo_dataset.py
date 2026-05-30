import argparse
import csv
import json
import math
import random
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple


ALLOWED_LABELS = [
    "good_posture",
    "shrimp_slouch",
    "forward_lean",
    "looking_down",
]

CAMERA_ANGLES = [
    "front",
    "left_angle",
    "right_angle",
    "side",
]

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

METADATA_COLUMNS = [
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

CSV_COLUMNS = [*METADATA_COLUMNS]
for landmark_name in TRAINING_LANDMARKS:
    CSV_COLUMNS.extend(
        [
            f"{landmark_name}_x",
            f"{landmark_name}_y",
            f"{landmark_name}_z",
            f"{landmark_name}_v",
        ]
    )
CSV_COLUMNS.extend(FEATURE_NAMES)

REQUIRED_SCHEMA_VERSION = "2.0.0"
GMO_SCHEMA_VERSION = "1.0.0"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Merge UnShrimp DataTool exports into final GMO training files."
    )
    parser.add_argument(
        "--input",
        default=str(Path(__file__).resolve().parents[1] / "RawData"),
        help="Folder containing raw DataTool JSON exports.",
    )
    parser.add_argument(
        "--output",
        default=str(Path(__file__).resolve().parents[1] / "GMOData"),
        help="Folder where final merged and prepared files will be written.",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for fallback splitting.")
    args = parser.parse_args()

    input_dir = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    merge_result = merge_raw_exports(input_dir)
    rows, invalid_training_samples = build_training_rows(merge_result["recordings"])
    train_rows, val_rows, test_rows, split_strategy, split_warnings = split_rows(rows, args.seed)

    created_at = datetime.now(timezone.utc).isoformat()
    report = build_report(
        created_at=created_at,
        input_dir=input_dir,
        merge_result=merge_result,
        rows=rows,
        invalid_training_samples=invalid_training_samples,
        train_rows=train_rows,
        val_rows=val_rows,
        test_rows=test_rows,
        split_strategy=split_strategy,
        split_warnings=split_warnings,
    )

    master_raw = {
        "gmo_schema_version": GMO_SCHEMA_VERSION,
        "source_schema_version": REQUIRED_SCHEMA_VERSION,
        "dataset_version": "gmo_v1",
        "created_at": created_at,
        "allowed_labels": ALLOWED_LABELS,
        "training_landmarks": TRAINING_LANDMARKS,
        "feature_names": FEATURE_NAMES,
        "recordings": merge_result["recordings"],
    }

    manifest = {
        "gmo_schema_version": GMO_SCHEMA_VERSION,
        "created_at": created_at,
        "allowed_labels": ALLOWED_LABELS,
        "training_landmarks": TRAINING_LANDMARKS,
        "feature_names": FEATURE_NAMES,
        "csv_columns": CSV_COLUMNS,
        "recording_count": len(merge_result["recordings"]),
        "training_row_count": len(rows),
        "label_counts": report["label_counts"],
        "person_counts": report["person_counts"],
        "session_counts": report["session_counts"],
        "camera_angle_counts": report["camera_angle_counts"],
        "split_strategy": split_strategy,
        "train_count": len(train_rows),
        "val_count": len(val_rows),
        "test_count": len(test_rows),
    }

    write_json(output_dir / "unshrimp_gmo_master_raw.json", master_raw)
    write_json(output_dir / "unshrimp_gmo_manifest.json", manifest)
    write_json(output_dir / "dataset_report.json", report)
    write_csv(output_dir / "unshrimp_gmo_training.csv", rows)
    write_csv(output_dir / "train.csv", train_rows)
    write_csv(output_dir / "val.csv", val_rows)
    write_csv(output_dir / "test.csv", test_rows)

    print(f"Input folder: {input_dir}")
    print(f"Output folder: {output_dir}")
    print(f"Raw files scanned: {len(merge_result['file_summaries']) + len(merge_result['skipped_files'])}")
    print(f"Merged recordings: {len(merge_result['recordings'])}")
    print(f"Training rows: {len(rows)}")
    print(f"Split strategy: {split_strategy}")
    print(f"Train/Val/Test: {len(train_rows)}/{len(val_rows)}/{len(test_rows)}")
    print("Label counts:")
    for label, count in sorted(report["label_counts"].items()):
        print(f"  {label}: {count}")
    if report["warnings"]:
        print("Warnings:")
        for warning in report["warnings"]:
            print(f"  WARNING: {warning}")
    print("Wrote final GMO files.")
    return 0


def merge_raw_exports(input_dir: Path) -> Dict[str, Any]:
    raw_files = sorted(input_dir.glob("*raw*.json"))
    recordings: List[Dict[str, Any]] = []
    seen_sample_ids = set()
    file_summaries = []
    skipped_files = []
    skipped_label_counts = Counter()
    duplicate_sample_count = 0
    incompatible_sample_count = 0

    for raw_file in raw_files:
        try:
            dataset = load_json(raw_file)
        except Exception as exc:
            skipped_files.append({"file": raw_file.name, "reason": f"JSON_LOAD_FAILED: {exc}"})
            continue

        schema_version = dataset.get("schema_version")
        if schema_version != REQUIRED_SCHEMA_VERSION:
            skipped_files.append(
                {
                    "file": raw_file.name,
                    "reason": f"UNSUPPORTED_SCHEMA: {schema_version}",
                }
            )
            continue

        source_recordings = dataset.get("recordings", [])
        file_valid_kept = 0
        file_skipped_label = 0
        file_duplicates = 0

        for recording in source_recordings:
            filtered_samples = []
            for sample in recording.get("samples", []):
                sample_id = sample.get("sample_id")
                label = sample.get("label")
                if label not in ALLOWED_LABELS:
                    skipped_label_counts[str(label)] += 1
                    file_skipped_label += 1
                    continue
                if not sample_id:
                    incompatible_sample_count += 1
                    continue
                if sample_id in seen_sample_ids:
                    duplicate_sample_count += 1
                    file_duplicates += 1
                    continue
                seen_sample_ids.add(sample_id)
                sample = dict(sample)
                sample["source_file"] = raw_file.name
                filtered_samples.append(sample)
                if sample.get("quality_status") == "valid":
                    file_valid_kept += 1

            if filtered_samples:
                merged_recording = dict(recording)
                merged_recording["source_file"] = raw_file.name
                merged_recording["samples"] = filtered_samples
                merged_recording["valid_sample_count"] = sum(
                    1 for sample in filtered_samples if sample.get("quality_status") == "valid"
                )
                merged_recording["dropped_sample_count"] = len(filtered_samples) - merged_recording[
                    "valid_sample_count"
                ]
                recordings.append(merged_recording)

        file_summaries.append(
            {
                "file": raw_file.name,
                "source_recordings": len(source_recordings),
                "kept_valid_samples": file_valid_kept,
                "skipped_label_samples": file_skipped_label,
                "duplicate_samples": file_duplicates,
            }
        )

    return {
        "recordings": recordings,
        "file_summaries": file_summaries,
        "skipped_files": skipped_files,
        "skipped_label_counts": dict(skipped_label_counts),
        "duplicate_sample_count": duplicate_sample_count,
        "incompatible_sample_count": incompatible_sample_count,
    }


def build_training_rows(recordings: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], int]:
    rows: List[Dict[str, Any]] = []
    invalid_training_samples = 0
    seen_row_ids = set()

    for recording in recordings:
        for sample in recording.get("samples", []):
            if sample.get("quality_status") != "valid":
                continue
            if sample.get("sample_id") in seen_row_ids:
                continue
            try:
                row = flatten_sample(sample)
            except ValueError:
                invalid_training_samples += 1
                continue
            rows.append(row)
            seen_row_ids.add(sample.get("sample_id"))

    return rows, invalid_training_samples


def flatten_sample(sample: Dict[str, Any]) -> Dict[str, Any]:
    label = required_text(sample, "label")
    if label not in ALLOWED_LABELS:
        raise ValueError(f"Invalid label: {label}")

    camera_angle = required_text(sample, "camera_angle")
    if camera_angle not in CAMERA_ANGLES:
        raise ValueError(f"Invalid camera angle: {camera_angle}")

    landmarks = landmarks_by_name(sample.get("training_landmarks") or sample.get("normalized_landmarks", []))
    if not all(name in landmarks for name in TRAINING_LANDMARKS):
        raise ValueError("Missing selected upper-body landmarks.")

    row: Dict[str, Any] = {
        "sample_id": required_text(sample, "sample_id"),
        "recording_id": required_text(sample, "recording_id"),
        "person_id": required_text(sample, "person_id"),
        "session_id": required_text(sample, "session_id"),
        "camera_angle": camera_angle,
        "label": label,
        "timestamp_ms": required_number(sample, "timestamp_ms"),
        "pose_confidence": required_number(sample, "pose_confidence"),
        "quality_status": "valid",
    }

    for name in TRAINING_LANDMARKS:
        landmark = landmarks[name]
        row[f"{name}_x"] = required_number(landmark, "x")
        row[f"{name}_y"] = required_number(landmark, "y")
        row[f"{name}_z"] = required_number(landmark, "z")
        row[f"{name}_v"] = required_number(landmark, "visibility")

    features = sample.get("features", {})
    for feature_name in FEATURE_NAMES:
        row[feature_name] = required_number(features, feature_name)

    if list(row.keys()) != CSV_COLUMNS:
        raise ValueError("CSV column order mismatch.")
    return row


def split_rows(
    rows: List[Dict[str, Any]],
    seed: int,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], str, List[str]]:
    warnings = []
    people = sorted({row["person_id"] for row in rows})
    sessions = sorted({row["session_id"] for row in rows})

    if len(people) >= 5:
        train, val, test = split_by_group(rows, "person_id", seed)
        return train, val, test, "person_group_split", warnings
    if len(sessions) >= 3:
        train, val, test = split_by_group(rows, "session_id", seed)
        return train, val, test, "session_group_split", warnings

    warnings.append("Not enough people or sessions for grouped split; using stratified random split.")
    train, val, test = stratified_random_split(rows, seed)
    return train, val, test, "stratified_random_split", warnings


def split_by_group(
    rows: List[Dict[str, Any]],
    group_key: str,
    seed: int,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    rng = random.Random(seed)
    groups: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for row in rows:
        groups[str(row[group_key])].append(row)

    group_names = sorted(groups)
    rng.shuffle(group_names)
    train_groups, val_groups, test_groups = split_group_names(group_names)
    return (
        collect_groups(groups, train_groups),
        collect_groups(groups, val_groups),
        collect_groups(groups, test_groups),
    )


def split_group_names(group_names: List[str]) -> Tuple[List[str], List[str], List[str]]:
    if len(group_names) < 3:
        return group_names, [], []
    train_end = max(1, round(len(group_names) * 0.70))
    val_end = max(train_end + 1, round(len(group_names) * 0.85))
    return group_names[:train_end], group_names[train_end:val_end], group_names[val_end:]


def collect_groups(groups: Dict[str, List[Dict[str, Any]]], names: Iterable[str]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for name in names:
        rows.extend(groups[name])
    return rows


def stratified_random_split(
    rows: List[Dict[str, Any]],
    seed: int,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    rng = random.Random(seed)
    by_label: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_label[row["label"]].append(row)

    train_rows: List[Dict[str, Any]] = []
    val_rows: List[Dict[str, Any]] = []
    test_rows: List[Dict[str, Any]] = []

    for label_rows in by_label.values():
        label_rows = list(label_rows)
        rng.shuffle(label_rows)
        total = len(label_rows)
        if total < 3:
            train_rows.extend(label_rows)
            continue
        train_count = max(1, int(total * 0.70))
        val_count = max(1, int(total * 0.15))
        if train_count + val_count >= total:
            val_count = max(1, total - train_count - 1)
        test_count = total - train_count - val_count
        if test_count <= 0:
            test_count = 1
            train_count = max(1, total - val_count - test_count)
        train_rows.extend(label_rows[:train_count])
        val_rows.extend(label_rows[train_count : train_count + val_count])
        test_rows.extend(label_rows[train_count + val_count :])

    rng.shuffle(train_rows)
    rng.shuffle(val_rows)
    rng.shuffle(test_rows)
    return train_rows, val_rows, test_rows


def build_report(
    *,
    created_at: str,
    input_dir: Path,
    merge_result: Dict[str, Any],
    rows: List[Dict[str, Any]],
    invalid_training_samples: int,
    train_rows: List[Dict[str, Any]],
    val_rows: List[Dict[str, Any]],
    test_rows: List[Dict[str, Any]],
    split_strategy: str,
    split_warnings: List[str],
) -> Dict[str, Any]:
    label_counts = Counter(row["label"] for row in rows)
    person_counts = Counter(row["person_id"] for row in rows)
    session_counts = Counter(row["session_id"] for row in rows)
    camera_angle_counts = Counter(row["camera_angle"] for row in rows)
    warnings = list(split_warnings)

    missing_labels = [label for label in ALLOWED_LABELS if label_counts[label] == 0]
    if missing_labels:
        warnings.append(f"Missing labels in final training rows: {', '.join(missing_labels)}")
    if len(person_counts) < 5:
        warnings.append("Fewer than 5 people are present; model quality may be limited.")
    if len(camera_angle_counts) < 2:
        warnings.append("Only one camera angle is present; collect angled data if possible.")
    if invalid_training_samples:
        warnings.append(f"{invalid_training_samples} valid samples were removed because training fields were invalid.")
    if merge_result["skipped_label_counts"]:
        warnings.append(f"Excluded non-v1 labels: {merge_result['skipped_label_counts']}")
    if merge_result["skipped_files"]:
        warnings.append(f"Skipped incompatible files: {merge_result['skipped_files']}")

    return {
        "created_at": created_at,
        "input_dir": str(input_dir),
        "allowed_labels": ALLOWED_LABELS,
        "source_schema_required": REQUIRED_SCHEMA_VERSION,
        "raw_files_scanned": len(merge_result["file_summaries"]) + len(merge_result["skipped_files"]),
        "file_summaries": merge_result["file_summaries"],
        "skipped_files": merge_result["skipped_files"],
        "duplicate_sample_count": merge_result["duplicate_sample_count"],
        "incompatible_sample_count": merge_result["incompatible_sample_count"],
        "invalid_training_sample_count": invalid_training_samples,
        "recording_count": len(merge_result["recordings"]),
        "training_row_count": len(rows),
        "train_count": len(train_rows),
        "val_count": len(val_rows),
        "test_count": len(test_rows),
        "split_strategy": split_strategy,
        "label_counts": dict(label_counts),
        "person_counts": dict(person_counts),
        "session_counts": dict(session_counts),
        "camera_angle_counts": dict(camera_angle_counts),
        "training_landmarks": TRAINING_LANDMARKS,
        "feature_names": FEATURE_NAMES,
        "csv_columns": CSV_COLUMNS,
        "warnings": warnings,
    }


def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, data: Dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(data, handle, indent=2)
        handle.write("\n")


def write_csv(path: Path, rows: List[Dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def landmarks_by_name(landmarks: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    return {
        landmark.get("name"): landmark
        for landmark in landmarks
        if isinstance(landmark, dict) and isinstance(landmark.get("name"), str)
    }


def required_text(source: Dict[str, Any], key: str) -> str:
    value = source.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} is missing or empty.")
    return value


def required_number(source: Dict[str, Any], key: str) -> float:
    value = source.get(key)
    if not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value):
        raise ValueError(f"{key} is missing or non-finite.")
    return value


if __name__ == "__main__":
    raise SystemExit(main())
