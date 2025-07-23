import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error, r2_score

def train_model_and_report(filepath, target_column, model_name):
    df = pd.read_csv(filepath)

    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in dataset")

    # Drop rows with missing target
    df = df.dropna(subset=[target_column])

    X = df.drop(columns=[target_column])
    y = df[target_column]

    # Simple preprocessing: fill missing values
    X = X.fillna(0)

    # Encode categorical columns
    X = pd.get_dummies(X)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Model selection
    if model_name == "RandomForestClassifier":
        model = RandomForestClassifier()
    elif model_name == "LogisticRegression":
        model = LogisticRegression(max_iter=1000)
    elif model_name == "MLPClassifier":
        model = MLPClassifier(max_iter=1000)
    elif model_name == "RandomForestRegressor":
        model = RandomForestRegressor()
    elif model_name == "LinearRegression":
        model = LinearRegression()
    elif model_name == "MLPRegressor":
        model = MLPRegressor(max_iter=1000)
    else:
        raise ValueError(f"Unknown model: {model_name}")

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    # Metrics
    if "Classifier" in model_name:
        score = accuracy_score(y_test, y_pred)
        class_report = classification_report(y_test, y_pred, output_dict=True)
        report = {
            "accuracy": score,
            "classification_report": class_report,
            "meta": {
                "task": "classification",
                "model": model_name,
                "train_size": len(y_train),
                "test_size": len(y_test),
                "classes": list(np.unique(y))
            }
        }
    else:
        mse = mean_squared_error(y_test, y_pred)
        report = {
            "mse": mse,
            "r2_score": r2_score(y_test, y_pred),
            "meta": {
                "task": "regression",
                "model": model_name,
                "train_size": len(y_train),
                "test_size": len(y_test),
                "target_range": [float(np.min(y)), float(np.max(y))]
            }
        }

    return report
