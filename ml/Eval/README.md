# Evaluation Outputs

Training and evaluation scripts write model-performance artifacts here.

Expected files after training:

- `training_curves.png`
- `confusion_matrix_val.png`
- `confusion_matrix_test.png`
- `classification_report_val.json`
- `classification_report_test.json`
- `metrics.json`

Validation and test metrics should be treated as the honest check because those splits contain real collected samples only.
