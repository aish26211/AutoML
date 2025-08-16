# Interactive AutoML Data Pipeline

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=flat&logo=streamlit&logoColor=white)](https://streamlit.io/)
[![Scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/stable/)
[![Plotly](https://img.shields.io/badge/Plotly-27338C?style=flat&logo=plotly&logoColor=white)](https://plotly.com/)
[![ydata-profiling](https://img.shields.io/badge/ydata--profiling-007bff?style=flat&logo=python&logoColor=white)](https://github.com/ydataai/ydata-profiling)


## 🚀 Project Overview

This project is an interactive, end-to-end Automated Machine Learning (AutoML) web application with a modern React frontend and Python FastAPI backend, designed to streamline the entire data science workflow for tabular data. From data upload and comprehensive exploration to advanced cleaning, model training, evaluation, and interpretability, this app empowers users to build and understand machine learning models without writing a single line of code.

It serves as a powerful tool for quick data insights, rapid prototyping, and understanding model behavior, making machine learning accessible to both data professionals and enthusiasts.

## 🏗️ Architecture

The application follows a modern full-stack architecture:

- **Frontend**: React 18 with TypeScript, Tailwind CSS, and modern UI components
- **Backend**: Python FastAPI with async support and automatic API documentation
- **Data Processing**: Pandas, Scikit-learn, and custom ML agents
- **Visualization**: Recharts for interactive charts and data visualization
- **File Handling**: Support for CSV and Excel files with drag-and-drop upload

## ✨ Key Features & Workflow

The application guides users through an intuitive, no-code data science pipeline:

### 📊 1. Data Upload
* **Flexible File Support:** Users can easily upload their tabular datasets in popular formats like `.csv` and `.xlsx`.
* **Secure Storage:** Uploaded files are securely processed, laying the groundwork for the analytical pipeline.

### 🔍 2. Exploratory Data Analysis (EDA)
Dive deep into your data with automated and interactive insights:
* **Dataset Preview & Information:** Instantly view the first few rows, dataset shape, and detailed column information (data types, non-null counts).
* **Missing Values Report:** Comprehensive summary of missing data percentages and counts per column.
* **Automated Detailed Report:** Generate a full, downloadable HTML report using `ydata-profiling` (formerly `pandas-profiling`), offering an exhaustive statistical overview and visualization.
* **Interactive Visualizations (Powered by Plotly):**
    * **Distributions:** Interactive histograms and box plots for numerical features.
    * **Relationships:** Scatter plots with customizable axes and color-encoding for identifying correlations.
    * **Categorical Counts:** Bar charts for understanding the distribution of categorical variables.
* **Summary Statistics:** Descriptive statistics for numerical columns and value counts for categorical columns.
* **Correlation Heatmap:** Visual representation of feature correlations for numerical columns.

### 🧹 3. Data Cleaning & Preprocessing
Transform raw data into a clean, model-ready format:
* **Missing Value Handling:** Intuitive options to drop rows/columns with missing values or impute them using mean, median, or mode strategies.
* **Duplicate Removal:** One-click removal of duplicate rows.
* **Numerical Scaling:** Apply `StandardScaler`, `MinMaxScaler`, or `RobustScaler` to normalize or standardize numerical features, essential for many ML algorithms.
* **Categorical Encoding:** Convert categorical features into numerical representations using `OneHotEncoder` or `LabelEncoder`.
* **Download Cleaned Data:** Option to download the processed dataset for external use.

### 🧠 4. Model Selection & Training
Empower your predictions with robust model building:
* **Target Column Specification:** Users easily select the target variable for prediction.
* **Automatic Problem Type Detection:** The app intelligently identifies whether the task is Classification or Regression based on the target variable.
* **Diverse Model Pool:** Choose from a selection of suitable machine learning models (e.g., Logistic Regression, Random Forest for classification; Linear Regression, Random Forest for regression).
* **Model Training & Evaluation:** Selected models are trained, and key performance metrics (Accuracy, Classification Report, Regression Metrics like MSE, R2) are displayed for instant comparison.

### 💡 5. Model Interpretability (XAI)
Understand the "why" behind your model's predictions:
* **Feature Importance:** Visualize which features are most influential in the model's decisions (available for compatible models).

### ⚙️ Efficiency & Robustness
* **Caching:** Intelligent caching of data loading and cleaning steps for faster iterative development and reruns.
* **Progress Feedback:** Clear success messages and loading indicators enhance the user experience.
* **Error Handling:** Robust checks for common issues (e.g., incorrect file formats, missing target columns) with user-friendly error messages.

## 🛠️ Technologies Used

### Frontend
* **React 18 + TypeScript:** Modern frontend framework with type safety
* **Tailwind CSS:** Utility-first CSS framework for rapid UI development
* **Recharts:** Interactive charts and data visualization
* **React Dropzone:** Drag-and-drop file upload interface
* **Axios:** HTTP client for API communication
* **Lucide React:** Beautiful, customizable icons

### Backend
* **FastAPI:** Modern, fast web framework for building APIs with Python
* **Uvicorn:** Lightning-fast ASGI server
* **Python:** The core programming language.
* **Pandas & NumPy:** For efficient data manipulation and numerical operations.
* **Scikit-learn:** For machine learning models, preprocessing, and evaluation.
* **Pydantic:** Data validation and settings management using Python type annotations.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (3.9 or higher)
- **npm** or **yarn**

### Quick Start

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YourGitHubUsername/AutoML.git
    cd automl-data-pipeline
    ```
2.  **Install all dependencies:**
    ```bash
    npm run install:all
    ```

3.  **Start the development servers:**
    ```bash
    npm run dev
    ```

    This will start both the React frontend (http://localhost:5173) and FastAPI backend (http://localhost:8000)

### Manual Setup

If you prefer to run the frontend and backend separately:

1.  **Backend Setup:**
    ```bash
    cd backend
    pip install -r requirements.txt
    python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
    ```

2.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### API Documentation

Once the backend is running, you can access the interactive API documentation at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📱 Usage

1. **Upload Data**: Drag and drop your CSV or Excel file onto the upload area
2. **Explore Data**: View dataset overview, column information, and data preview
3. **Clean Data**: Configure data cleaning options including missing value handling, scaling, and encoding
4. **Train Models**: Select target column and train various machine learning models
5. **Analyze Results**: View model performance metrics and feature importance
6. **Download**: Export cleaned datasets for further use

## 🔧 Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the React frontend
- `npm run dev:backend` - Start only the FastAPI backend
- `npm run build` - Build the frontend for production
- `npm run install:all` - Install dependencies for both frontend and backend

## 🤝 Contributing

We welcome contributions! If you have suggestions for improvements, bug reports, or want to add new features, please feel free to:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add new feature'`).
5.  Push to the branch (`git push origin feature/YourFeature`).
6.  Open a Pull Request.

### Development Guidelines

- Follow TypeScript best practices for frontend development
- Use FastAPI's automatic validation and documentation features
- Maintain consistent code formatting with Prettier (frontend) and Black (backend)
- Write meaningful commit messages
- Update documentation when adding new features


## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by the need for accessible machine learning tools
- Thanks to the open-source community for the amazing libraries and frameworks

---
