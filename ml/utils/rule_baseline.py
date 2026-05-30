from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping


@dataclass(frozen=True)
class RuleDecision:
    label: str
    confidence: float
    reason: str


def classify_with_rules(features: Mapping[str, float]) -> RuleDecision:
    """Initial explainable rule layer.

    These thresholds are intentionally conservative. They are not meant to replace
    the NN; they provide a reason string for the hybrid output and a fallback path
    while the extension integration matures.
    """
    confidence = float(features.get("upper_body_confidence", features.get("pose_confidence", 0.0)))
    if confidence < 0.5:
        return RuleDecision("uncertain", confidence, "Pose confidence is too low.")

    head_drop = float(features.get("head_drop_proxy", 0.0))
    head_y_offset = float(features.get("head_to_shoulder_y_offset", 0.0))
    head_z_offset = float(features.get("head_to_shoulder_z_offset", 0.0))
    nose_z_offset = float(features.get("nose_to_shoulder_z_offset", 0.0))
    shoulder_slope = abs(float(features.get("shoulder_slope", 0.0)))

    if head_drop > -0.55 or head_y_offset > -0.60:
        return RuleDecision("looking_down", min(1.0, confidence), "Head is low relative to the shoulders.")

    if nose_z_offset < -2.25 or head_z_offset < -0.90:
        return RuleDecision("forward_lean", min(1.0, confidence), "Head is moving toward the camera.")

    if shoulder_slope > 0.18 or head_y_offset > -0.85:
        return RuleDecision("shrimp_slouch", min(1.0, confidence), "Shoulder/head alignment suggests slouching.")

    return RuleDecision("good_posture", min(1.0, confidence), "Posture is close to the normal upright pattern.")
