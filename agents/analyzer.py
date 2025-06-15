import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from groq import Groq

os.environ["GROQ_API_KEY"] = "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"

# 🧠 LLM setup
groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])

prompt_template = """
You are an expert data analyst. Here's the dataset summary:

{summary}

Please:
- Briefly describe the dataset structure
- Suggest the most likely target column for ML
- Point out any issues (nulls, imbalance, skew)
"""

def call_llm(summary: str) -> str:
    prompt = prompt_template.format(summary=summary)
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # or another Groq-supported model
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=512,
    )
    return response.choices[0].message.content


def generate_visuals(df: pd.DataFrame, target_col: str):
    visuals = {}

    # Correlation Heatmap
    fig_corr, ax_corr = plt.subplots(figsize=(10, 6))
    sns.heatmap(df.select_dtypes(include='number').corr(), annot=True, cmap='coolwarm', ax=ax_corr)
    visuals["correlation_heatmap"] = fig_corr

    # Target Distribution
    if target_col and target_col in df.columns:
        fig_target, ax_target = plt.subplots()
        df[target_col].value_counts().plot(kind='bar', ax=ax_target)
        ax_target.set_title(f"Distribution of '{target_col}'")
        visuals["target_distribution"] = fig_target

    return visuals


def analyze_dataset(filepath: str) -> dict:
    df = pd.read_csv(filepath)
    analysis = {}

    # Basic Info
    analysis['shape'] = df.shape
    analysis['dtypes'] = df.dtypes.astype(str).to_dict()
    analysis['nulls'] = df.isnull().sum().to_dict()
    analysis['unique'] = df.nunique().to_dict()

    # Detect potential target columns
    potential_targets = []
    for col in df.columns:
        unique_vals = df[col].nunique()
        if df[col].dtype == 'object' and 2 <= unique_vals <= 10:
            potential_targets.append(col)
        elif df[col].dtype in ['int64', 'float64'] and 2 <= unique_vals <= 10:
            potential_targets.append(col)
    analysis['potential_targets'] = potential_targets

    # Select default target
    target = potential_targets[0] if potential_targets else None

    # LLM Summary
    stats = df.describe(include='all').transpose().to_string()
    analysis['llm_summary'] = call_llm(stats)

    # Graphs
    visuals = generate_visuals(df, target)

    return {
        "df": df,
        "analysis": analysis,
        "target_column": target,
        "visuals": visuals
    }
