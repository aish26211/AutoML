import streamlit as st
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import os
from agents.cleaner import clean_data
from agents.analyzer import analyze_file
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
    st.subheader("🔍 Exploratory Data Analysis (EDA)")
    if st.checkbox("Show dataset preview"):
        st.dataframe(df.head())

    if st.checkbox("Show dataset shape"):
        st.write(f"Rows: {df.shape[0]} | Columns: {df.shape[1]}")

    if st.checkbox("Show data types and missing values"):
        info_df = pd.DataFrame({
            "Data Type": df.dtypes,
            "Missing Values": df.isnull().sum(),
            "Missing %": (df.isnull().mean() * 100).round(2)
        })
        st.dataframe(info_df)

    if st.checkbox("Show descriptive statistics"):
        st.dataframe(df.describe(include='all').transpose())

    if st.checkbox("Show value counts for categorical columns"):
        cat_cols = df.select_dtypes(include='object').columns
        for col in cat_cols:
            st.markdown(f"**{col}**")
            st.dataframe(df[col].value_counts())

    if st.checkbox("Show correlation heatmap"):
        num_df = df.select_dtypes(include=['number'])
        if not num_df.empty:
            fig, ax = plt.subplots(figsize=(10, 6))
            sns.heatmap(num_df.corr(), annot=True, cmap="coolwarm", ax=ax)
            st.pyplot(fig)
        else:
            st.warning("No numeric columns found for correlation heatmap.")

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
