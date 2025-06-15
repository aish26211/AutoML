import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import classification_report, mean_squared_error, r2_score

def train_model_and_report(filepath, target_column):
    df = pd.read_csv(filepath)

    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in dataset")

    # Drop rows with missing target
    df = df.dropna(subset=[target_column])

    X = df.drop(columns=[target_column])
    y = df[target_column]

    # Preprocess features
    X = pd.get_dummies(X)
    X.replace([np.inf, -np.inf], np.nan, inplace=True)
    X.dropna(inplace=True)

    # Sync y length with X
    y = y[:len(X)]

    # If y is object (categorical), convert to numeric
    if y.dtype == 'object':
        y = pd.factorize(y)[0]

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) < 10 else None
    )

    # Warn if small test size
    if len(y_test) < 5:
        print(f"⚠️ Warning: Only {len(y_test)} test samples. Model may not generalize well.")

    # Automatically determine task type
    task_type = "regression" if y.dtype.kind in "iufc" and len(np.unique(y)) > 10 else "classification"

    if task_type == "classification":
        model = RandomForestClassifier()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        report = classification_report(y_test, y_pred, output_dict=True)
        report['meta'] = {
            "task": "classification",
            "train_size": len(y_train),
            "test_size": len(y_test),
            "classes": list(np.unique(y))
        }

    else:
        model = RandomForestRegressor()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        report = {
            "r2_score": r2_score(y_test, y_pred),
            "mse": mean_squared_error(y_test, y_pred),
            "meta": {
                "task": "regression",
                "train_size": len(y_train),
                "test_size": len(y_test),
                "target_range": [float(np.min(y)), float(np.max(y))]
            }
        }

    return report
