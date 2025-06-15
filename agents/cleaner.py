import pandas as pd
import os

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

        # Handle numeric columns
        numeric_cols = df.select_dtypes(include=['number']).columns
        for col in numeric_cols:
            if df[col].isnull().any():
                median = df[col].median()
                df[col].fillna(median, inplace=True)

        # Handle categorical columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        for col in categorical_cols:
            if df[col].isnull().any():
                mode = df[col].mode()
                if not mode.empty:
                    df[col].fillna(mode[0], inplace=True)

        # Generate cleaned file path
        cleaned_path = filepath.replace(".csv", "_cleaned.csv")
        df.to_csv(cleaned_path, index=False)

        return cleaned_path

    except Exception as e:
        print(f"❌ Error cleaning data: {e}")
        return ""
