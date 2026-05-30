# UnShrimp NN Evaluation Notes

Last recheck: 2026-05-30

## Confirmed Saved-Model Result

The saved model in `models/unshrimp_posture_nn` was reloaded and evaluated against the current `data/gmo` validation and test splits.

Validation:

- Accuracy: 1.0000
- Weighted precision: 1.0000
- Weighted recall: 1.0000
- Weighted F1: 1.0000

Test:

- Accuracy: 0.9940
- Weighted precision: 0.9942
- Weighted recall: 0.9940
- Weighted F1: 0.9940

## Test Confusion Matrix

Label order:

1. `good_posture`
2. `shrimp_slouch`
3. `forward_lean`
4. `looking_down`

Matrix:

```text
[[125,   0,   1,   0],
 [  0,  69,   0,   0],
 [  0,   0,  69,   0],
 [  0,   0,   1,  68]]
```

The model made 2 mistakes out of 333 test samples:

- 1 `good_posture` sample was predicted as `forward_lean`.
- 1 `looking_down` sample was predicted as `forward_lean`.

## What To Be Conscious About

This result is a strong first checkpoint, but it should not be treated as final real-world accuracy yet.

Important caveats:

- The current dataset is front-camera only.
- The current split is not a true unseen-person split.
- Adjacent webcam frames can be very similar, which can make validation/test accuracy look higher.
- The model is most likely to over-call `forward_lean`, so the extension should use smoothing and hybrid rule checks before alerting.
- Live extension testing on new people, lighting, laptop heights, and seating positions is still required.

## Practical Takeaway

The model is good enough to begin extension integration and hybrid inference work. Before claiming robust performance, collect more people and run an unseen-person or unseen-session evaluation.
