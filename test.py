import streamlit as st
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import os
from agents.cleaner import clean_data
from agents.analyzer import analyze_file
from agents.model_selector import select_models
from agents.trainer import train_model_and_report
from agents.tester import test_model_on_data
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

st.set_page_config(page_title="AutoML Data Pipeline", layout="wide")
st.title("📊 AutoML Data Pipeline")

@st.cache_data
def load_data(filepath):
    return pd.read_csv(filepath)

@st.cache_data
def clean_and_save(filepath):
    return clean_data(filepath)

# ========== DATA PREPROCESSING FUNCTION ==========
def preprocess_data(df, scaler_option, encoder_option, target):
    X = df.drop(columns=[target])
    y = df[target]
    num_cols = X.select_dtypes(include='number').columns
    if scaler_option == "StandardScaler":
        scaler = StandardScaler()
        X[num_cols] = scaler.fit_transform(X[num_cols])
    elif scaler_option == "MinMaxScaler":
        scaler = MinMaxScaler()
        X[num_cols] = scaler.fit_transform(X[num_cols])
    cat_cols = X.select_dtypes(include='object').columns
    if encoder_option == "OneHotEncoder" and len(cat_cols) > 0:
        X = pd.get_dummies(X, columns=cat_cols)
    return X, y

# ========== GRID SEARCH FUNCTION ==========
def grid_search_train(X, y):
    param_grid = {
        "n_estimators": [50, 100],
        "max_depth": [None, 10, 20]
    }
    grid = GridSearchCV(RandomForestClassifier(), param_grid, cv=3, n_jobs=-1)
    grid.fit(X, y)
    return grid.best_estimator_, grid.best_params_, grid.best_score_

# ========== FILE UPLOAD ==========
uploaded_file = st.file_uploader("Upload CSV File", type=["csv"])
if uploaded_file:
    filepath = os.path.join("data", uploaded_file.name)
    os.makedirs("data", exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(uploaded_file.getbuffer())
    st.success("✅ File uploaded successfully.")

    # Use cached data loading
    df = load_data(filepath)

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

    # ========== DATA PROFILING ==========
    st.subheader("📊 Data Profiling")
    if st.button("Generate Data Profile Report"):
        from ydata_profiling import ProfileReport
        profile = ProfileReport(df, title="Data Profiling Report", explorative=True)
        st.components.v1.html(profile.to_html(), height=800, scrolling=True)

    st.markdown("---")

    # ========== DATA CLEANING ==========
    st.subheader("🧼 Data Cleaning")
    if st.button("Clean Data (fill missing values)"):
        cleaned_path = clean_and_save(filepath)
        st.success("✅ Data cleaned and saved.")
        with open(cleaned_path, "rb") as f:
            st.download_button("Download Cleaned Data", data=f.read(), file_name="cleaned_data.csv")

    st.markdown("---")

    # ========== DATA PREPROCESSING OPTIONS ==========
    st.subheader("⚙️ Data Preprocessing Options")
    scaler_option = st.selectbox("Select numerical scaler", ["None", "StandardScaler", "MinMaxScaler"])
    encoder_option = st.selectbox("Select categorical encoder", ["None", "OneHotEncoder"])

    st.markdown("---")

    # ========== MODEL TRAINING ==========
    st.subheader("🎯 Target Column (for training):")
    target = st.text_input("Enter target column name")

    if target:
        if target not in df.columns:
            st.error(f"Column '{target}' not found in dataset.")
        else:
            try:
                model_list = select_models(filepath, target)
                selected_models = st.multiselect("Select models to train", model_list, default=model_list)

                if selected_models:
                    results_list = []
                    for model_name in selected_models:
                        X, y = preprocess_data(df, scaler_option, encoder_option, target)
                        metrics = train_model_and_report(filepath, target, model_name)
                        metrics['model'] = model_name
                        results_list.append(metrics)
                        # Feature importances for tree-based models
                        if "RandomForest" in model_name:
                            if "Classifier" in model_name:
                                model = RandomForestClassifier()
                            else:
                                model = RandomForestRegressor()
                            model.fit(X, y)
                            importances = model.feature_importances_
                            feat_imp_df = pd.DataFrame({"feature": X.columns, "importance": importances}).sort_values("importance", ascending=False)
                            st.subheader(f"🌟 Feature Importances for {model_name}")
                            st.dataframe(feat_imp_df)
                    st.subheader("📈 Model Performance Comparison")
                    st.dataframe(pd.DataFrame(results_list))
            except Exception as e:
                st.error(f"❌ Error: {e}")

    st.markdown("---")

    # ========== GRID SEARCH TRAINING ==========
    st.subheader("🔍 Hyperparameter Tuning (Grid Search)")
    if st.button("Run Grid Search (RandomForestClassifier)"):
        if target and target in df.columns:
            X, y = preprocess_data(df, scaler_option, encoder_option, target)
            best_model, best_params, best_score = grid_search_train(X, y)
            st.write("Best Params:", best_params)
            st.write("Best CV Score:", best_score)
