from fastapi import FastAPI, File, UploadFile, HTTPException, Body,APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
import pandas as pd
from pathlib import Path
import numpy as np
from typing import Optional
import joblib

# Import your existing services
from services.analyzer import analyze_dataset
from services.cleaner import clean_data
from services.model_selector import select_model
from services.trainer import train_model
from services.tester import evaluate_model

app = FastAPI(title="AutoML API", version="1.0.0")

# CORS middleware for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Request models
class AnalyzeRequest(BaseModel):
    filepath: str

class CleanRequest(BaseModel):
    filepath: str

class ModelSelectionRequest(BaseModel):
    filepath: str
    target_column: str
class TrainingRequest(BaseModel):
    filepath: str
    target_column: str
    model_name: str
    test_size: Optional[float] = 0.2
    
    class Config:
        schema_extra = {
            "example": {
                "filepath": "diabetes_cleaned.csv",
                "target_column": "Outcome",
                "model_name": "RandomForestClassifier",
                "test_size": 0.2
            }
        }
class EvaluationRequest(BaseModel):
    model_path: str
    test_data_path: str
    target_column: str
    task_type: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "model_path": "trained_model_RandomForestClassifier_Outcome.joblib",
                "test_data_path": "diabetes_cleaned.csv",
                "target_column": "Outcome",
                "task_type": "classification"
            }
        }



@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload CSV file for analysis"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    file_path = UPLOAD_DIR / file.filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {
        "filename": file.filename,
        "filepath": str(file_path),
        "message": "File uploaded successfully"
    }

@app.post("/analyze")
async def analyze_data(request: AnalyzeRequest):
    """Analyze the uploaded dataset"""
    try:
        # Convert relative path to absolute path
        absolute_path = UPLOAD_DIR / Path(request.filepath).name
        
        # Check if file exists
        if not absolute_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {absolute_path}")
        
        results = analyze_dataset(str(absolute_path))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/clean")
async def clean_dataset(request: CleanRequest):
    """Clean the dataset"""
    try:
        cleaned_path = clean_data(request.filepath)
        return {
            "cleaned_filepath": cleaned_path,
            "message": "Data cleaned successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/select-model")
async def select_best_model(request: ModelSelectionRequest):
    """Select the best model for the dataset"""
    try:
        print(f"Received model selection request for: {request.filepath}, target: {request.target_column}")
        
        # Normalize the filepath to avoid double uploads folder
        filepath = request.filepath
        
        # Handle different filepath formats from frontend
        if filepath.startswith("uploads/uploads/"):
            # Fix double uploads path
            filepath = filepath.replace("uploads/uploads/", "uploads/", 1)
        elif not filepath.startswith("uploads/"):
            # Add uploads prefix if missing
            filepath = f"uploads/{filepath}"
        
        # Build absolute path
        input_file_path = Path(filepath)
        if not input_file_path.is_absolute():
            input_file_path = UPLOAD_DIR / input_file_path.name
        
        print(f"Normalized filepath: {filepath}")
        print(f"Looking for file at: {input_file_path.absolute()}")
        
        # Check if file exists
        if not input_file_path.exists():
            # Try alternative path construction
            alternative_path = UPLOAD_DIR / Path(request.filepath).name
            print(f"Trying alternative path: {alternative_path.absolute()}")
            
            if alternative_path.exists():
                input_file_path = alternative_path
                print(f"Found file at alternative path: {input_file_path.absolute()}")
            else:
                raise HTTPException(
                    status_code=404, 
                    detail=f"File not found at: {input_file_path.absolute()} or {alternative_path.absolute()}"
                )
        
        print("File found, calling select_model...")
        model_suggestions = select_model(str(input_file_path), request.target_column)
        
        if not model_suggestions:
            raise HTTPException(status_code=500, detail="Model selection failed - no suggestions returned")
        
        print(f"Model selection completed: {model_suggestions.get('best_model', {}).get('name', 'Unknown')}")
        return model_suggestions
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as e:
        print(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
    except FileNotFoundError as e:
        print(f"File not found error: {str(e)}")
        raise HTTPException(status_code=404, detail=f"File not found: {str(e)}")
    except Exception as e:
        print(f"Error in select_best_model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")



import numpy as np

@app.post("/train")
async def train_selected_model(request: TrainingRequest):
    """Train the selected model"""
    try:
        # --- KEY CHANGE: Unify path logic using pathlib ---
        # No need to check if it starts with 'uploads/', this handles both cases.
        filename = Path(request.filepath).name
        input_file_path = UPLOAD_DIR / filename

        print(f"Looking for file at: {input_file_path}")

        if not input_file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"File not found: {input_file_path}"
            )

        print("File found, calling train_model...")
        metrics, trained_model = train_model(
            filepath=str(input_file_path),
            target_column=request.target_column,
            model_name=request.model_name,
            test_size=getattr(request, 'test_size', 0.2)
        )

        if trained_model is None:
            raise HTTPException(status_code=500, detail="Model training failed unexpectedly.")

        # --- KEY CHANGE: Simplified and robust model saving ---
        # Create a clear model filename
        model_filename = f"trained_{request.model_name}_{Path(filename).stem}_{request.target_column}.joblib"
        
        # Define the full, absolute path to save the model
        model_save_path = UPLOAD_DIR / model_filename
        
        # Save the model
        joblib.dump(trained_model, model_save_path)
        print(f"Model trained and saved to: {model_save_path}")

        # For the API response, return a simple relative path string that the frontend can use.
        relative_model_path = f"uploads/{model_filename}"

        return {
            "message": "Model trained successfully",
            "metrics": metrics,
            "model_path": relative_model_path, # Simple string path for frontend
            "model_filename": model_filename,
            "model_name": request.model_name,
            "target_column": request.target_column
        }

    except ValueError as e:
        # This will now catch ValueErrors from your trainer, like from train_test_split
        print(f"Validation error in training: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # General catch-all for other unexpected errors
        print(f"An unexpected error occurred in /train: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {e}")

@app.post("/evaluate")
async def evaluate_trained_model(request: EvaluationRequest):
    """Evaluate a trained model"""
    try:
        print(f"Received evaluation request for model: {request.model_path}")
        
        # Normalize model path to avoid double uploads folder
        model_path = request.model_path
        if model_path.startswith("uploads/uploads/"):
            model_path = model_path.replace("uploads/uploads/", "uploads/", 1)
        elif not model_path.startswith("uploads/"):
            model_path = f"uploads/{model_path}"
        
        # Normalize test data path
        test_data_path = request.test_data_path
        if test_data_path.startswith("uploads/uploads/"):
            test_data_path = test_data_path.replace("uploads/uploads/", "uploads/", 1)
        elif not test_data_path.startswith("uploads/"):
            test_data_path = f"uploads/{test_data_path}"
        
        # Build absolute paths
        model_file_path = Path(model_path)
        if not model_file_path.is_absolute():
            model_file_path = UPLOAD_DIR / model_file_path.name
        
        test_file_path = Path(test_data_path)
        if not test_file_path.is_absolute():
            test_file_path = UPLOAD_DIR / test_file_path.name
        
        print(f"Normalized model path: {model_path}")
        print(f"Normalized test data path: {test_data_path}")
        print(f"Looking for model at: {model_file_path.absolute()}")
        print(f"Looking for test data at: {test_file_path.absolute()}")
        
        # Check if model file exists with fallback
        if not model_file_path.exists():
            alternative_model_path = UPLOAD_DIR / Path(request.model_path).name
            print(f"Trying alternative model path: {alternative_model_path.absolute()}")
            
            if alternative_model_path.exists():
                model_file_path = alternative_model_path
                print(f"Found model at alternative path: {model_file_path.absolute()}")
            else:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Model file not found at: {model_file_path.absolute()} or {alternative_model_path.absolute()}"
                )
        
        # Check if test data file exists with fallback
        if not test_file_path.exists():
            alternative_test_path = UPLOAD_DIR / Path(request.test_data_path).name
            print(f"Trying alternative test data path: {alternative_test_path.absolute()}")
            
            if alternative_test_path.exists():
                test_file_path = alternative_test_path
                print(f"Found test data at alternative path: {test_file_path.absolute()}")
            else:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Test data file not found at: {test_file_path.absolute()} or {alternative_test_path.absolute()}"
                )
        
        # Load model
        import joblib
        model = joblib.load(model_file_path)
        print("Model loaded successfully")
        
        # Load test data
        df_test = pd.read_csv(test_file_path)
        print(f"Test data loaded: {df_test.shape}")
        
        if request.target_column not in df_test.columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Target column '{request.target_column}' not found in test data. Available columns: {list(df_test.columns)}"
            )
        
        # Prepare test data (same preprocessing as training)
        X_test = df_test.drop(columns=[request.target_column])
        y_test = df_test[request.target_column]
        
        # Apply same preprocessing as in training
        X_test = pd.get_dummies(X_test)
        X_test.replace([np.inf, -np.inf], np.nan, inplace=True)
        
        # Handle missing values by dropping or filling
        valid_idx = X_test.dropna().index
        X_test = X_test.loc[valid_idx]
        y_test = y_test.loc[valid_idx]
        
        if len(X_test) == 0:
            raise HTTPException(status_code=400, detail="No valid test samples after preprocessing")
        
        print(f"Evaluating model on {len(X_test)} test samples...")
        results = evaluate_model(model, X_test, y_test, task_type=request.task_type, plot=False)
        
        print("Model evaluation completed successfully")
        
        return {
            "evaluation_results": results,
            "test_samples": len(X_test),
            "model_used": str(model_file_path.name),
            "test_data_used": str(test_file_path.name),
            "message": "Model evaluation completed successfully"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as e:
        print(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
    except FileNotFoundError as e:
        print(f"File not found error: {str(e)}")
        raise HTTPException(status_code=404, detail=f"File not found: {str(e)}")
    except Exception as e:
        print(f"Error in evaluate_trained_model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")







@app.get("/health")
async def health_check():
    return {"status": "AutoML API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
