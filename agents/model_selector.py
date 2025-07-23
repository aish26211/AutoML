# agents/model_selector.py

import pandas as pd

def select_models(filepath, target_column):
    df = pd.read_csv(filepath)

    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found.")

    target_dtype = df[target_column].dtype

    # Classification or regression logic
    if df[target_column].nunique() <= 10 or target_dtype == 'object':
        return ["RandomForestClassifier", "LogisticRegression", "MLPClassifier"]
    else:
        return ["RandomForestRegressor", "LinearRegression", "MLPRegressor"]
