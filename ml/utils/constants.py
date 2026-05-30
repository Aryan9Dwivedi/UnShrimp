LABELS = [
    "good_posture",
    "shrimp_slouch",
    "forward_lean",
    "looking_down",
]

LABEL_TO_ID = {label: index for index, label in enumerate(LABELS)}
ID_TO_LABEL = {index: label for label, index in LABEL_TO_ID.items()}

METADATA_COLUMNS = {
    "sample_id",
    "recording_id",
    "person_id",
    "session_id",
    "camera_angle",
    "label",
    "timestamp_ms",
    "pose_confidence",
    "quality_status",
}

LOWER_BODY_TOKENS = (
    "hip",
    "knee",
    "ankle",
    "heel",
    "foot",
)
