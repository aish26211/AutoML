import pandas as pd
import os
import logging

def clean_data(filepath: str) -> str:
    """
    Cleans the dataset by:
    - Filling missing numerical values with the median
    - Filling missing categorical values with the mode

    Args:
        filepath (str): Path to the input CSV file

    Returns:
        str: Path to the cleaned CSV file
    """
    try:
        df = pd.read_csv(filepath)

        # Numeric columns
        for col in df.select_dtypes(include=['number']).columns:
            if df[col].isnull().any():
                median = df[col].median()
                df[col] = df[col].fillna(median)

        # Categorical columns
        for col in df.select_dtypes(include=['object', 'category']).columns:
            if df[col].isnull().any():
                mode = df[col].mode()
                if not mode.empty:
                    df[col] = df[col].fillna(mode[0])

        # Handle file extension robustly
        base, ext = os.path.splitext(filepath)
        cleaned_path = f"{base}_cleaned{ext if ext else '.csv'}"
        df.to_csv(cleaned_path, index=False)

        return cleaned_path

    except Exception as e:
        logging.error(f"❌ Error cleaning data: {e}")
        return ""
