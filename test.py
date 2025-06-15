import streamlit as st
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import os
from agents.cleaner import clean_data
from agents.analyzer import analyze_dataset
from agents.model_selector import select_model
from agents.trainer import train_model_and_report
from agents.tester import test_model_on_data

st.set_page_config(page_title="AutoML Data Pipeline", layout="wide")
st.title("📊 AutoML Data Pipeline")

# ========== FILE UPLOAD ==========
uploaded_file = st.file_uploader("Upload CSV File", type=["csv"])
if uploaded_file:
    filepath = os.path.join("data", uploaded_file.name)
    os.makedirs("data", exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(uploaded_file.getbuffer())
    st.success("✅ File uploaded successfully.")

    # Load Data
    df = pd.read_csv(filepath)

    # ========== EDA ==========

    # Call analyzer and show summary
    analysis_result = analyze_dataset(filepath)
    analysis = analysis_result["analysis"]
    target = analysis_result["target_column"]

    st.subheader("🔍 Exploratory Data Analysis (EDA)")
    if st.checkbox("Show dataset preview"):
        st.dataframe(analysis_result["df"].head())

    if st.checkbox("Show dataset shape"):
        st.write(f"Rows: {analysis['shape'][0]} | Columns: {analysis['shape'][1]}")

    if st.checkbox("Show data types and missing values"):
        info_df = pd.DataFrame({
            "Data Type": analysis['dtypes'],
            "Missing Values": analysis['nulls'],
            "Unique Values": analysis['unique']
        })
        st.dataframe(info_df)

    if st.checkbox("Show descriptive statistics"):
        st.text(analysis['llm_summary'])

    if st.checkbox("Show value counts for categorical columns"):
        cat_cols = [col for col, dtype in analysis['dtypes'].items() if dtype == 'object']
        for col in cat_cols:
            st.markdown(f"**{col}**")
            st.dataframe(analysis_result["df"][col].value_counts())

    if st.checkbox("Show correlation heatmap"):
        if "correlation_heatmap" in analysis_result["visuals"]:
            st.pyplot(analysis_result["visuals"]["correlation_heatmap"])
        else:
            st.warning("No numeric columns found for correlation heatmap.")

    if st.checkbox("Show target distribution"):
        if "target_distribution" in analysis_result["visuals"]:
            st.pyplot(analysis_result["visuals"]["target_distribution"])
        else:
            st.warning("No target column or distribution plot available.")

    st.markdown("---")

    # ========== DATA CLEANING ==========
    st.subheader("🧼 Data Cleaning")
    if st.button("Clean Data (fill missing values)"):
        cleaned_path = clean_data(filepath)
        st.success("✅ Data cleaned and saved.")
        st.download_button("Download Cleaned Data", data=open(cleaned_path, "rb"), file_name="cleaned_data.csv")

    st.markdown("---")

    # ========== MODEL TRAINING ==========
    st.subheader("🎯 Target Column (for training):")
    target = st.text_input("Enter target column name")

    if target:
        try:
            model_name = select_model(filepath, target)
            st.success(f"✅ Best model selected: {model_name}")

            # Train Model
            metrics = train_model_and_report(filepath, target)
            st.subheader("📈 Model Performance")
            st.json(metrics)

            # Test Model
            test_result = test_model_on_data(filepath, target)
            st.subheader("🧪 Test Results")
            st.json(test_result)

        except Exception as e:
            st.error(f"❌ Error: {e}")
