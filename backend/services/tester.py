import numpy as np
import pandas as pd
import logging
from typing import Any, Dict, Optional
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    mean_squared_error,
    r2_score,
    mean_absolute_error,
)
import matplotlib.pyplot as plt
import seaborn as sns

logging.basicConfig(level=logging.INFO)

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

def evaluate_model(
    model: Any,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    task_type: Optional[str] = None,
    plot: bool = True,
) -> Dict:
    """
    Evaluate a trained model on test data producing metrics and optional plots.

    Args:
        model: Trained sklearn-like model supporting predict/predict_proba.
        X_test: Features for test dataset.
        y_test: True labels/values for test dataset.
        task_type: 'classification' or 'regression'. If None, inferred.
        plot: Whether to show/save evaluation plots.

    Returns:
        Dictionary with computed numeric metrics and evaluation summaries (JSON-serializable).
    """

    # Infer task type if not supplied
    if task_type is None:
        if len(np.unique(y_test)) <= 20 and len(y_test) >= 10:
            task_type = "classification"
        else:
            task_type = "regression"

    logging.info(f"Evaluating model for task type: {task_type}")

    results = {}

    # Perform predictions
    y_pred = model.predict(X_test)

    if task_type == "classification":
        # Get classification report
        class_report = classification_report(y_test, y_pred, output_dict=True)
        results["classification_report"] = convert_numpy_types(class_report)
        
        # Get confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        results["confusion_matrix"] = cm.tolist()
        
        # Add summary metrics
        from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
        results["accuracy"] = float(accuracy_score(y_test, y_pred))
        results["f1_macro"] = float(f1_score(y_test, y_pred, average="macro"))
        results["precision_macro"] = float(precision_score(y_test, y_pred, average="macro"))
        results["recall_macro"] = float(recall_score(y_test, y_pred, average="macro"))

        # ROC-AUC if binary classification and predict_proba available
        if hasattr(model, "predict_proba") and len(np.unique(y_test)) == 2:
            try:
                probs = model.predict_proba(X_test)[:, 1]
                results["roc_auc"] = float(roc_auc_score(y_test, probs))
            except Exception as e:
                logging.warning(f"Could not calculate ROC-AUC: {e}")

        # Add metadata
        results["meta"] = {
            "task_type": "classification",
            "n_classes": int(len(np.unique(y_test))),
            "test_samples": int(len(y_test)),
            "feature_count": int(X_test.shape[1]),
            "class_distribution": {int(k): int(v) for k, v in pd.Series(y_test).value_counts().items()}
        }

        if plot:
            # Confusion matrix heatmap (for API, we'll skip plotting)
            logging.info("Plotting disabled for API endpoint")

    elif task_type == "regression":
        mse = float(mean_squared_error(y_test, y_pred))
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_test, y_pred))
        mae = float(mean_absolute_error(y_test, y_pred))

        results.update({
            "mse": mse, 
            "rmse": rmse, 
            "r2_score": r2, 
            "mae": mae
        })
        
        # Add metadata
        results["meta"] = {
            "task_type": "regression",
            "test_samples": int(len(y_test)),
            "feature_count": int(X_test.shape[1]),
            "target_range": [float(y_test.min()), float(y_test.max())],
            "prediction_range": [float(y_pred.min()), float(y_pred.max())]
        }

        if plot:
            # Skip plotting for API endpoint
            logging.info("Plotting disabled for API endpoint")

    else:
        raise ValueError(f"Unknown task_type: {task_type}")

    # Ensure all values are JSON-serializable
    results = convert_numpy_types(results)
    
    logging.info(f"Evaluation completed for {task_type}. Main metric: {results.get('accuracy', results.get('r2_score', 'N/A'))}")

    return results

if __name__ == "__main__":
    import joblib
    import sys

    if len(sys.argv) != 4:
        print(
            "Usage: python tester.py <model_filepath> <X_test_filepath> <y_test_filepath>\n"
            "All files must be CSV (except model file which is joblib pickle)."
        )
        sys.exit(1)

    model_path, X_path, y_path = sys.argv[1:4]

    try:
        model = joblib.load(model_path)
        X_test = pd.read_csv(X_path)
        y_test = pd.read_csv(y_path).iloc[:, 0]  # Assume single-column target CSV

        results = evaluate_model(model, X_test, y_test, plot=True)

        import json

        print("Evaluation Results:")
        print(json.dumps(results, indent=2))

    except Exception as e:
        logging.error(f"Evaluation failed: {e}")
