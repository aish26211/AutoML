import os
import pandas as pd
import logging
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
logging.basicConfig(level=logging.INFO)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

PROMPT_TEMPLATE = """
You are an expert machine learning engineer. Given the sample data below and information about the target column, please:

1. Recommend the single best ML model for this prediction task from these model list: RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor, LogisticRegression
2. Suggest 2-3 alternative eligible models, with a brief explanation of why each model could be suitable.
3. Explain shortly why you chose the best model.

Dataset sample (first 5 rows):
{sample}

Target column name: {target_col}
Target column type: {target_type}
Number of unique values in target column: {target_unique}

Respond only with JSON in this format:

{{
  "best_model": {{
    "name": "model_name",
    "description": "reason for choosing this model"
  }},
  "other_options": [
    {{
      "name": "alternative_model_name",
      "description": "reason for this alternative"
    }},
    {{
      "name": "another_alternative_model",
      "description": "reason for this alternative"
    }}
  ]
}}
"""

def call_llm_model_selector(sample_df: pd.DataFrame, target_col: str) -> dict:
    """
    Calls the LLM to get the best and other ML model suggestions with explanations.
    Returns a dict with keys: best_model, other_options.
    """
    if not groq_client:
        logging.warning("No LLM client available, returning empty suggestions.")
        return {}

    try:
        target_type = str(sample_df[target_col].dtype)
        target_unique = sample_df[target_col].nunique()
        sample_text = sample_df.head(5).to_csv(index=False)

        prompt = PROMPT_TEMPLATE.format(
            sample=sample_text,
            target_col=target_col,
            target_type=target_type,
            target_unique=target_unique,
        )

        print("🤖 Calling LLM for model suggestions...")
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=512,
        )
        text = response.choices[0].message.content
        print(f"📝 LLM Response: {text[:200]}...")

        # Extract JSON object from response safely
        import re

        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            result_json = json.loads(match.group(1))
            print("✅ Successfully parsed LLM response")
            return result_json
        else:
            logging.warning(f"LLM output did not contain parseable JSON: {text}")
            return {}

    except Exception as e:
        logging.error(f"LLM model selector call failed: {e}")
        return {}

def get_fallback_model_suggestions(df: pd.DataFrame, target_column: str) -> dict:
    """Fallback rule-based model selection when LLM fails"""
    print("🔧 Using fallback rule-based model selection...")
    
    target_unique = df[target_column].nunique()
    target_dtype = df[target_column].dtype
    
    # Determine if classification or regression
    is_classification = (target_unique <= 10) or (target_dtype == 'object') or (target_dtype == 'bool')
    
    if is_classification:
        print("📊 Detected classification task")
        if target_unique == 2:
            # Binary classification
            return {
                "best_model": {
                    "name": "RandomForestClassifier",
                    "description": "Robust ensemble method excellent for binary classification with built-in feature importance and handles overfitting well"
                },
                "other_options": [
                    {
                        "name": "LogisticRegression", 
                        "description": "Fast, interpretable linear model ideal for binary classification with good baseline performance"
                    },
                    {
                        "name": "GradientBoostingClassifier",
                        "description": "High-performance boosting algorithm that often achieves excellent accuracy on structured data"
                    }
                ]
            }
        else:
            # Multi-class classification
            return {
                "best_model": {
                    "name": "RandomForestClassifier",
                    "description": "Excellent for multi-class classification with natural handling of multiple classes and feature importance"
                },
                "other_options": [
                    {
                        "name": "GradientBoostingClassifier",
                        "description": "Powerful boosting method that handles multi-class problems well with high accuracy potential"
                    }
                ]
            }
    else:
        # Regression
        print("📈 Detected regression task")
        return {
            "best_model": {
                "name": "RandomForestRegressor",
                "description": "Robust ensemble method for regression with good handling of non-linear relationships and feature importance"
            },
            "other_options": [
                {
                    "name": "GradientBoostingRegressor",
                    "description": "High-performance boosting algorithm excellent for regression tasks with complex patterns"
                }
            ]
        }

def select_model(filepath: str, target_column: str) -> dict:
    """
    Main function to select the best and alternative ML models for the dataset.

    Returns a dict:
    {
        "best_model": {"name": "...", "description": "..."},
        "other_options": [ {"name": "...", "description": "..."}, ... ]
    }
    """
    print(f"🎯 Starting model selection for: {filepath}")
    print(f"🎯 Target column: {target_column}")
    
    try:
        df = pd.read_csv(filepath)
        print(f"📊 Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        
        if target_column not in df.columns:
            available_columns = list(df.columns)
            raise ValueError(f"Target column '{target_column}' not found in the dataset. Available columns: {available_columns}")

        # Basic data info
        target_info = {
            "unique_values": df[target_column].nunique(),
            "data_type": str(df[target_column].dtype),
            "missing_values": df[target_column].isnull().sum(),
            "sample_values": df[target_column].value_counts().head(5).to_dict()
        }
        print(f"🎯 Target column info: {target_info}")

        # Take a sample for the LLM input (first 5 rows)
        sample_df = df.head(5)

        # Try LLM-based model suggestion first
        llm_suggestions = call_llm_model_selector(sample_df, target_column)

        if llm_suggestions and "best_model" in llm_suggestions and "other_options" in llm_suggestions:
            print("✅ Using LLM model suggestions")
            return llm_suggestions
        
        # Fallback: Rule-based model selection
        print("⚠️  LLM failed or unavailable, using rule-based model selection")
        return get_fallback_model_suggestions(df, target_column)
        
    except FileNotFoundError as e:
        error_msg = f"Dataset file not found: {filepath}"
        logging.error(error_msg)
        raise FileNotFoundError(error_msg)
    except Exception as e:
        error_msg = f"Error in model selection: {str(e)}"
        logging.error(error_msg)
        raise Exception(error_msg)

if __name__ == "__main__":
    import pprint

    # Example usage:
    dataset_path = dataset_path = r"D:\AutoMLL\backend\uploads\diabetes_cleaned.csv"

    target_col = "Outcome"

    try:
        model_info = select_model(dataset_path, target_col)
        print("\n🎯 Model Selection Results:")
        pprint.pprint(model_info)
    except Exception as e:
        print(f"❌ Error: {e}")
