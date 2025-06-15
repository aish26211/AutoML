# agents/analyzer.py
import pandas as pd

def analyze_file(filepath):
    df = pd.read_csv(filepath)
    structure = {col: str(dtype) for col, dtype in df.dtypes.items()}
    missing = df.isnull().sum().to_dict()
    return {
        "structure": structure,
        "missing": missing,
        "shape": df.shape
    }


