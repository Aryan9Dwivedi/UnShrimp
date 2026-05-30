from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from .rule_baseline import classify_with_rules


@dataclass(frozen=True)
class HybridDecision:
    label: str
    confidence: float
    reason: str
    nn_label: str
    rule_label: str
    alert_ready: bool


def combine_nn_and_rules(
    nn_label: str,
    nn_confidence: float,
    features: Mapping[str, float],
    min_nn_confidence: float = 0.55,
) -> HybridDecision:
    rule = classify_with_rules(features)

    if rule.label == "uncertain":
        return HybridDecision(
            label="uncertain",
            confidence=rule.confidence,
            reason=rule.reason,
            nn_label=nn_label,
            rule_label=rule.label,
            alert_ready=False,
        )

    if nn_confidence < min_nn_confidence:
        return HybridDecision(
            label="uncertain",
            confidence=nn_confidence,
            reason="NN confidence is low; wait for more frames.",
            nn_label=nn_label,
            rule_label=rule.label,
            alert_ready=False,
        )

    if nn_label == "good_posture" and rule.label != "good_posture":
        return HybridDecision(
            label="watch",
            confidence=(nn_confidence + rule.confidence) / 2,
            reason=f"Rule layer sees possible {rule.label}, but NN says good. Watch before alerting.",
            nn_label=nn_label,
            rule_label=rule.label,
            alert_ready=False,
        )

    if nn_label != "good_posture" and rule.label == "good_posture":
        return HybridDecision(
            label=nn_label,
            confidence=nn_confidence,
            reason="NN sees bad posture; rule layer has no strong reason yet.",
            nn_label=nn_label,
            rule_label=rule.label,
            alert_ready=False,
        )

    if nn_label != "good_posture" and rule.label != "good_posture":
        final_label = rule.label if rule.label == nn_label else nn_label
        return HybridDecision(
            label=final_label,
            confidence=max(nn_confidence, rule.confidence),
            reason=rule.reason,
            nn_label=nn_label,
            rule_label=rule.label,
            alert_ready=True,
        )

    return HybridDecision(
        label="good_posture",
        confidence=max(nn_confidence, rule.confidence),
        reason="NN and rule layer both indicate good posture.",
        nn_label=nn_label,
        rule_label=rule.label,
        alert_ready=False,
    )
