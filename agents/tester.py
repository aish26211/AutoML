# agents/tester.py

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

def test_model_on_data(train_path, target_column, test_path, model=None):
    # Load and preprocess train data
    train_df = pd.read_csv(train_path)
    if target_column not in train_df.columns:
        raise ValueError(f"Target column '{target_column}' not found in training data.")

    X_train = train_df.drop(columns=[target_column])
    y_train = train_df[target_column]
    X_train = pd.get_dummies(X_train)

    # Load and preprocess test data
    test_df = pd.read_csv(test_path)
    test_X = pd.get_dummies(test_df)

    # Align columns between training and test data
    X_train, test_X = X_train.align(test_X, join='left', axis=1, fill_value=0)

    # Train the model (or use provided one)
    if model is None:
        model = RandomForestClassifier()
    model.fit(X_train, y_train)

    # Predict
    predictions = model.predict(test_X)
    result_df = test_df.copy()
    result_df['Prediction'] = predictions

    return result_df

def evaluate_model(y_true, y_pred):
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, average="weighted", zero_division=0),
        "recall": recall_score(y_true, y_pred, average="weighted", zero_division=0),
        "f1_score": f1_score(y_true, y_pred, average="weighted", zero_division=0)
    }
