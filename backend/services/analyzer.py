import os
import logging
import pandas as pd
from dotenv import load_dotenv
from groq import Groq
import plotly.express as px
import plotly.io as pio
import json

load_dotenv()
logging.basicConfig(level=logging.INFO)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

PROMPT_TEMPLATE = """
You are an expert data analyst. Here's the dataset summary:

{summary}

Please:
- Briefly describe the dataset structure
- Suggest the most likely target column for ML
- Recommend 1 or 2 informative graph types (with relevant columns) for data exploration, specifying the kind of plot (e.g. bar, box, scatter) and columns to use.
- Point out any key issues (nulls, imbalance, outliers)
- Respond in this JSON template:
  {{
    "target_column": "...",
    "graphs": [{{"type": "...", "columns": ["col1", "col2"]}}, ...]
  }}
"""

def call_llm_for_graphs(summary: str) -> dict:
    """
    Calls LLM to get target column guess and graph suggestions.
    Returns a dict with keys: target_column, graphs (list of dicts).
    """
    if not groq_client:
        logging.warning("No LLM client available. Skipping LLM suggestions.")
        return {}
    prompt = PROMPT_TEMPLATE.format(summary=summary)
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=512,
        )
        text = response.choices[0].message.content
        # Safely parse JSON section
        import re
        match = re.search(r'({.*})', text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        else:
            logging.warning("LLM did not return proper JSON. Output: %s", text)
            return {}
    except Exception as e:
        logging.error(f"LLM call failed: {e}")
        return {}

def generate_plotly_graphs(df: pd.DataFrame, graph_suggestions: list):
    """
    Generates up to 2 plotly graphs as dicts based on LLM or fallback suggestions.
    Returns a dict: {label: plotly_json}
    """
    graphs = {}
    count = 0
    for g in graph_suggestions:
        if count >= 2:
            break
        kind, columns = g.get("type"), g.get("columns", [])
        try:
            if kind == "bar" and len(columns) == 1 and columns[0] in df.columns:
                fig = px.bar(df[columns[0]].value_counts().reset_index(),
                             x="index", y=columns[0],
                             title=f"Bar plot of {columns[0]}")
            elif kind == "histogram" and len(columns) == 1 and columns[0] in df.columns:
                fig = px.histogram(df, x=columns[0], title=f"Histogram of {columns[0]}")
            elif kind == "scatter" and len(columns) == 2 and all(c in df.columns for c in columns):
                fig = px.scatter(df, x=columns[0], y=columns[1], title=f"Scatter: {columns[0]} vs {columns[1]}")
            elif kind == "box" and len(columns) == 1 and columns[0] in df.columns:
                fig = px.box(df, y=columns[0], title=f"Boxplot of {columns[0]}")
            else:
                continue  # Skip unsupported/invalid
            # Serialize for web
            graphs[f"{kind}_{'_'.join(columns)}"] = pio.to_json(fig)
            count += 1
        except Exception as e:
            logging.warning(f"Plotly graph '{kind}' for columns {columns} failed: {e}")
    return graphs

def analyze_dataset(filepath: str) -> dict:
    """
    Analyzes a CSV, suggests a target, issues basic stats, and provides web-friendly plotly graphs.
    """
    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        logging.error(f"Failed to load CSV: {e}")
        return {"error": str(e)}

    analysis = {
        "shape": df.shape,
        "dtypes": df.dtypes.astype(str).to_dict(),
        "nulls": df.isnull().sum().to_dict(),
        "unique": df.nunique().to_dict(),
    }
    # Dataset short stats for LLM
    summary_stats = df.describe(include="all", percentiles=[.25, .5, .75]).transpose().to_string()
    llm_output = call_llm_for_graphs(summary_stats)
    # Use LLM's target_column or fallback
    if llm_output.get("target_column") and llm_output["target_column"] in df.columns:
        target = llm_output["target_column"]
    else:
        # fallback: use object column with 2-10 uniques
        candidates = [c for c in df.columns if df[c].dtype == 'object' and 2 <= df[c].nunique() <= 10]
        target = candidates[0] if candidates else df.columns[0]
    analysis["suggested_target"] = target
    # Use LLM's graph suggestions or fallback
    if llm_output.get("graphs"):
        graph_suggestions = llm_output["graphs"]
    else:
        # fallback suggestion: distribution on target, correlation heatmap
        graph_suggestions = [{"type": "bar", "columns": [target]}]
        num_cols = df.select_dtypes(include='number').columns
        if len(num_cols) >= 2:
            graph_suggestions.append({"type": "scatter", "columns": [num_cols[0], num_cols[1]]})

    plotly_graphs = generate_plotly_graphs(df, graph_suggestions)
    # Return analysis and serialized graphs for web
    return {
        "analysis": analysis,
        "plotly_graphs": plotly_graphs,
    }

# Example usage:
# res = analyze_dataset('/path/to/your.csv')
# print(res.keys())
# The plotly_graphs dict contains JSON strings for direct consumption by your React frontend.
