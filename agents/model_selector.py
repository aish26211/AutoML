# agents/model_selector.py

import pandas as pd

def select_model(filepath, target_column):
    df = pd.read_csv(filepath)

    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found.")

    target_dtype = df[target_column].dtype

    # Simple logic: classification if categorical, regression if numerical
    if df[target_column].nunique() <= 10 or target_dtype == 'object':
        return "RandomForestClassifier"
    else:
        return "RandomForestRegressor"
