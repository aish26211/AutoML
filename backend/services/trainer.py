import pandas as pd
import numpy as np
import logging
from typing import Tuple, Dict, Any, Optional

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, mean_squared_error, r2_score, accuracy_score, f1_score

from sklearn.ensemble import (
    RandomForestClassifier,
    RandomForestRegressor,
    GradientBoostingClassifier,
    GradientBoostingRegressor,
)
from sklearn.linear_model import LogisticRegression

logging.basicConfig(level=logging.INFO)

# Mapping string model names to classes
MODEL_MAP = {
    "RandomForestClassifier": RandomForestClassifier,
    "RandomForestRegressor": RandomForestRegressor,
    "GradientBoostingClassifier": GradientBoostingClassifier,
    "GradientBoostingRegressor": GradientBoostingRegressor,
    "LogisticRegression": LogisticRegression,
}

def convert_numpy_types(obj):
    """Convert NumPy types to Python native types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif hasattr(obj, 'item'):  # Handle numpy scalars
        return obj.item()
    return obj

def train_model(
    filepath: str,
    target_column: str,
    model_name: str,
    model_params: Optional[dict] = None,
    test_size: float = 0.2,
    random_state: int = 42,
) -> Tuple[Dict[str, Any], Any]:
    """
    Train the specified model on the dataset's target.

    Args:
        filepath (str): Path to CSV dataset.
        target_column (str): Target column name.
        model_name (str): One of the valid model names from MODEL_MAP.
        model_params (Optional[dict]): Hyperparameters for model instantiation.
        test_size (float): Fraction for test split.
        random_state (int): Seed for reproducibility.

    Returns:
        report (dict): Evaluation metrics and metadata (JSON-serializable).
        model (sklearn estimator): Trained model instance.
    """
    if model_name not in MODEL_MAP:
        raise ValueError(f"Unsupported model '{model_name}'. Choose from {list(MODEL_MAP.keys())}")

    model_params = model_params or {}
    logging.info(f"Training {model_name} with params {model_params}")

    df = pd.read_csv(filepath)
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in dataset")

    # Drop rows with missing target
    df = df.dropna(subset=[target_column])

    X = df.drop(columns=[target_column])
    y = df[target_column]

    # Feature preprocessing
    X = pd.get_dummies(X)
    X.replace([np.inf, -np.inf], np.nan, inplace=True)
    valid_idx = X.dropna().index
    X = X.loc[valid_idx]
    y = y.loc[valid_idx]

    # Determine if classification based on model_name
    is_classification = model_name.endswith("Classifier") or model_name == "LogisticRegression"

    # Encode target if classification and target is categorical
    label_encoder = None
    if is_classification and (y.dtype == 'object' or y.nunique() < 20):
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(y)

    # Train-test split with stratify for classification
    stratify = y if is_classification else None
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=stratify
        )
    except ValueError as e:
        logging.warning(f"Stratified split failed: {e}. Retrying without stratify.")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

    if len(y_test) < 5:
        logging.warning(f"Only {len(y_test)} samples in test set, results may be unreliable")

    # Instantiate and train model
    model_class = MODEL_MAP[model_name]
    model = model_class(**model_params)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    # Prepare evaluation report
    if is_classification:
        report = classification_report(y_test, y_pred, output_dict=True)
        
        # Add accuracy and macro-F1 explicitly for convenience
        report["accuracy"] = float(accuracy_score(y_test, y_pred))
        report["f1_macro"] = float(f1_score(y_test, y_pred, average="macro"))
        report["meta"] = {
            "task": "classification",
            "model": model_name,
            "train_size": int(len(y_train)),
            "test_size": int(len(y_test)),
            "classes": [int(x) for x in np.unique(y)],
            "feature_count": int(X.shape[1])
        }
    else:
        report = {
            "r2_score": float(r2_score(y_test, y_pred)),
            "mse": float(mean_squared_error(y_test, y_pred)),
            "meta": {
                "task": "regression",
                "model": model_name,
                "train_size": int(len(y_train)),
                "test_size": int(len(y_test)),
                "target_range": [float(np.min(y)), float(np.max(y))],
                "feature_count": int(X.shape[1])
            },
        }

    # Convert all NumPy types in the report
    report = convert_numpy_types(report)
    
    logging.info(f"Training completed successfully. Test accuracy/R²: {report.get('accuracy', report.get('r2_score', 'N/A'))}")
    
    return report, model

if __name__ == "__main__":
    import pprint

    # Example usage:
    dataset_path = input("Enter dataset path: ").strip()
    target_col = input("Enter target column name: ").strip()
    model_name = input(f"Enter model name {list(MODEL_MAP.keys())}: ").strip()

    try:
        metrics, trained = train_model(dataset_path, target_col, model_name)
        print("\nTraining complete. Evaluation metrics:")
        pprint.pprint(metrics)
    except Exception as e:
        print(f"Error: {e}")
