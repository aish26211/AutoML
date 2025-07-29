from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pandas as pd
import os
import shutil
from typing import List, Optional, Dict, Any
import json

# Import your existing agents
from agents.analyzer import analyze_file
from agents.cleaner import clean_data
from agents.model_selector import select_models
from agents.trainer import train_model_and_report
from agents.tester import test_model_on_data

# Sklearn imports for preprocessing
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
import numpy as np

app = FastAPI(title="AutoML Data Pipeline API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# Pydantic models
class AnalyzeRequest(BaseModel):
    filename: str

class PreviewRequest(BaseModel):
    filename: str
    rows: int = 10

class CleaningOptions(BaseModel):
    handleMissing: str  # 'drop' or 'fill'
    fillStrategy: Optional[str] = 'mean'  # 'mean', 'median', 'mode'
    removeDuplicates: bool = True
    scaler: Optional[str] = None  # 'standard', 'minmax', 'robust'
    encoder: Optional[str] = None  # 'onehot', 'label'

class CleanRequest(BaseModel):
    filename: str
    options: CleaningOptions

class ModelSelectRequest(BaseModel):
    filename: str
    target_column: str

class TrainRequest(BaseModel):
    filename: str
    target_column: str
    model_name: str

class FeatureImportanceRequest(BaseModel):
    filename: str
    target_column: str
    model_name: str

@app.get("/")
async def root():
    return {"message": "AutoML Data Pipeline API"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV or Excel file"""
    try:
        # Validate file type
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Save file
        file_path = os.path.join("data", file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {"message": "File uploaded successfully", "filename": file.filename}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/api/analyze")
async def analyze_data(request: AnalyzeRequest):
    """Analyze dataset structure and missing values"""
    try:
        file_path = os.path.join("data", request.filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        analysis = analyze_file(file_path)
        return analysis
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/preview")
async def preview_data(request: PreviewRequest):
    """Get data preview"""
    try:
        file_path = os.path.join("data", request.filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Read file based on extension
        if request.filename.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
        
        # Return first N rows as JSON
        preview_data = df.head(request.rows).to_dict('records')
        return preview_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")

@app.post("/api/clean")
async def clean_dataset(request: CleanRequest):
    """Clean dataset with specified options"""
    try:
        file_path = os.path.join("data", request.filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Read data
        if request.filename.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
        
        # Apply cleaning options
        options = request.options
        
        # Handle missing values
        if options.handleMissing == 'drop':
            df = df.dropna()
        elif options.handleMissing == 'fill':
            if options.fillStrategy == 'mean':
                df = df.fillna(df.mean(numeric_only=True))
            elif options.fillStrategy == 'median':
                df = df.fillna(df.median(numeric_only=True))
            elif options.fillStrategy == 'mode':
                for col in df.columns:
                    if df[col].dtype == 'object':
                        df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown')
        
        # Remove duplicates
        if options.removeDuplicates:
            df = df.drop_duplicates()
        
        # Apply scaling
        if options.scaler:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                if options.scaler == 'standard':
                    scaler = StandardScaler()
                elif options.scaler == 'minmax':
                    scaler = MinMaxScaler()
                elif options.scaler == 'robust':
                    scaler = RobustScaler()
                
                df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
        
        # Apply encoding
        if options.encoder:
            categorical_cols = df.select_dtypes(include=['object']).columns
            if len(categorical_cols) > 0:
                if options.encoder == 'onehot':
                    df = pd.get_dummies(df, columns=categorical_cols)
                elif options.encoder == 'label':
                    le = LabelEncoder()
                    for col in categorical_cols:
                        df[col] = le.fit_transform(df[col].astype(str))
        
        # Save cleaned data
        cleaned_filename = f"cleaned_{request.filename}"
        cleaned_path = os.path.join("data", cleaned_filename)
        df.to_csv(cleaned_path, index=False)
        
        return {"message": "Data cleaned successfully", "cleaned_filename": cleaned_filename}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleaning failed: {str(e)}")

@app.post("/api/models/select")
async def select_model_types(request: ModelSelectRequest):
    """Select appropriate models for the target column"""
    try:
        file_path = os.path.join("data", request.filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        models = select_models(file_path, request.target_column)
        return {"models": models}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model selection failed: {str(e)}")

@app.post("/api/models/train")
async def train_model(request: TrainRequest):
    """Train a specific model"""
    try:
        file_path = os.path.join("data", request.filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        result = train_model_and_report(file_path, request.target_column, request.model_name)
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/api/models/feature-importance")
async def get_feature_importance(request: FeatureImportanceRequest):
    """Get feature importance for tree-based models"""
    try:
        file_path = os.path.join("data", request.filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Read data
        df = pd.read_csv(file_path)
        
        if request.target_column not in df.columns:
            raise HTTPException(status_code=400, detail="Target column not found")
        
        # Prepare data
        X = df.drop(columns=[request.target_column])
        y = df[request.target_column]
        
        # Handle missing values and encode categoricals
        X = X.fillna(0)
        X = pd.get_dummies(X)
        
        # Train model to get feature importance
        if "Classifier" in request.model_name:
            model = RandomForestClassifier(n_estimators=100, random_state=42)
        else:
            model = RandomForestRegressor(n_estimators=100, random_state=42)
        
        model.fit(X, y)
        
        # Get feature importance
        importance_data = [
            {"feature": feature, "importance": float(importance)}
            for feature, importance in zip(X.columns, model.feature_importances_)
        ]
        
        # Sort by importance
        importance_data.sort(key=lambda x: x["importance"], reverse=True)
        
        return importance_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature importance calculation failed: {str(e)}")

@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """Download a file"""
    try:
        file_path = os.path.join("data", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)