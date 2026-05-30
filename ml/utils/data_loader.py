from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

from .constants import LABELS, LABEL_TO_ID, LOWER_BODY_TOKENS, METADATA_COLUMNS


@dataclass
class DatasetSplits:
    x_train: np.ndarray
    y_train: np.ndarray
    x_val: np.ndarray
    y_val: np.ndarray
    x_test: np.ndarray
    y_test: np.ndarray
    feature_columns: List[str]
    scaler: StandardScaler
    train_df: pd.DataFrame
    val_df: pd.DataFrame
    test_df: pd.DataFrame


def load_dataset_splits(data_dir: str | Path) -> DatasetSplits:
    data_path = Path(data_dir)
    train_df = _read_split(data_path / "train.csv")
    val_df = _read_split(data_path / "val.csv")
    test_df = _read_split(data_path / "test.csv")

    _validate_labels(train_df, "train")
    _validate_labels(val_df, "val")
    _validate_labels(test_df, "test")

    feature_columns = get_feature_columns(train_df)
    _validate_feature_columns(feature_columns)
    _validate_same_columns(train_df, val_df, test_df, feature_columns)

    x_train_raw = train_df[feature_columns].astype("float32").to_numpy()
    x_val_raw = val_df[feature_columns].astype("float32").to_numpy()
    x_test_raw = test_df[feature_columns].astype("float32").to_numpy()

    scaler = StandardScaler()
    x_train = scaler.fit_transform(x_train_raw).astype("float32")
    x_val = scaler.transform(x_val_raw).astype("float32")
    x_test = scaler.transform(x_test_raw).astype("float32")

    return DatasetSplits(
        x_train=x_train,
        y_train=encode_labels(train_df["label"]),
        x_val=x_val,
        y_val=encode_labels(val_df["label"]),
        x_test=x_test,
        y_test=encode_labels(test_df["label"]),
        feature_columns=feature_columns,
        scaler=scaler,
        train_df=train_df,
        val_df=val_df,
        test_df=test_df,
    )


def encode_labels(labels: pd.Series) -> np.ndarray:
    return labels.map(LABEL_TO_ID).astype("int64").to_numpy()


def get_feature_columns(df: pd.DataFrame) -> List[str]:
    return [column for column in df.columns if column not in METADATA_COLUMNS]


def _read_split(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Missing dataset split: {path}")
    df = pd.read_csv(path)
    if df.empty:
        raise ValueError(f"Dataset split is empty: {path}")
    return df


def _validate_labels(df: pd.DataFrame, split_name: str) -> None:
    labels = set(df["label"].unique())
    invalid = labels.difference(LABELS)
    if invalid:
        raise ValueError(f"{split_name} has invalid labels: {sorted(invalid)}")


def _validate_feature_columns(feature_columns: List[str]) -> None:
    if not feature_columns:
        raise ValueError("No feature columns found.")
    forbidden = [
        column
        for column in feature_columns
        if any(token in column for token in LOWER_BODY_TOKENS)
    ]
    if forbidden:
        raise ValueError(f"Lower-body columns are not allowed in v1 training: {forbidden}")


def _validate_same_columns(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    feature_columns: List[str],
) -> None:
    expected = list(train_df.columns)
    if list(val_df.columns) != expected or list(test_df.columns) != expected:
        raise ValueError("Train, val, and test columns do not match.")
    for name, df in (("train", train_df), ("val", val_df), ("test", test_df)):
        values = df[feature_columns].to_numpy()
        if not np.isfinite(values).all():
            raise ValueError(f"{name} contains NaN or Infinity in feature columns.")
