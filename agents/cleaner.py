# agents/cleaner.py
import pandas as pd
import os

def clean_data(filepath):
    df = pd.read_csv(filepath)

    for col in df.select_dtypes(include=['number']).columns:
        df[col].fillna(df[col].median(), inplace=True)

    for col in df.select_dtypes(include=['object']).columns:
        df[col].fillna(df[col].mode()[0], inplace=True)

    cleaned_path = filepath.replace(".csv", "_cleaned.csv")
    df.to_csv(cleaned_path, index=False)
    return cleaned_path

