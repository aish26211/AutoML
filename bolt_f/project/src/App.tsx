import React, { useState } from 'react';
import { Upload, BarChart3, Settings, Brain, Target, Download } from 'lucide-react';
import FileUpload from './components/FileUpload';
import DatasetAnalysis from './components/DatasetAnalysis';
import ModelSelection from './components/ModelSelection';
import ModelTraining from './components/ModelTraining';
import ResultsDashboard from './components/ResultsDashboard';
import Navigation from './components/Navigation';

export interface UploadedFile {
  filename: string;
  filepath: string;
}

export interface AnalysisResult {
  analysis: {
    shape: [number, number];
    dtypes: Record<string, string>;
    nulls: Record<string, number>;
    unique: Record<string, number>;
    suggested_target: string;
  };
  plotly_graphs: Record<string, string>;
}

export interface ModelSuggestion {
  best_model: {
    name: string;
    description: string;
  };
  other_options: Array<{
    name: string;
    description: string;
  }>;
}

export interface TrainingResult {
  message: string;
  metrics: any;
  model_path: string;
  model_filename: string;
  model_name: string;
  target_column: string;
}

export type Step = 'upload' | 'analysis' | 'selection' | 'training' | 'results';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [modelSuggestions, setModelSuggestions] = useState<ModelSuggestion | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [cleanedFile, setCleanedFile] = useState<string | null>(null);

  const steps = [
    { id: 'upload', label: 'Upload Data', icon: Upload, completed: !!uploadedFile },
    { id: 'analysis', label: 'Analyze', icon: BarChart3, completed: !!analysisResult },
    { id: 'selection', label: 'Select Model', icon: Settings, completed: !!selectedModel },
    { id: 'training', label: 'Train', icon: Brain, completed: !!trainingResult },
    { id: 'results', label: 'Results', icon: Target, completed: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AutoML Pipeline
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Build powerful machine learning models with ease. Upload your data, select the best algorithm, and get production-ready models in minutes.
          </p>
        </header>

        {/* Navigation */}
        <Navigation 
          steps={steps} 
          currentStep={currentStep} 
          onStepClick={setCurrentStep}
        />

        {/* Main Content */}
        <main className="mt-12">
          {currentStep === 'upload' && (
            <FileUpload 
              onFileUploaded={setUploadedFile}
              onNext={() => setCurrentStep('analysis')}
            />
          )}

          {currentStep === 'analysis' && uploadedFile && (
            <DatasetAnalysis
              file={uploadedFile}
              onAnalysisComplete={(result) => {
                setAnalysisResult(result);
                setSelectedTarget(result.analysis.suggested_target);
              }}
              onCleaningComplete={setCleanedFile}
              onNext={() => setCurrentStep('selection')}
              analysisResult={analysisResult}
              cleanedFile={cleanedFile}
            />
          )}

          {currentStep === 'selection' && uploadedFile && analysisResult && (
            <ModelSelection
              file={cleanedFile || uploadedFile.filepath}
              targetColumn={selectedTarget}
              onTargetChange={setSelectedTarget}
              analysisResult={analysisResult}
              onModelSelected={(suggestions) => {
                setModelSuggestions(suggestions);
                setSelectedModel(suggestions.best_model.name);
              }}
              onNext={() => setCurrentStep('training')}
              modelSuggestions={modelSuggestions}
              selectedModel={selectedModel}
              onSelectedModelChange={setSelectedModel}
            />
          )}

          {currentStep === 'training' && (
            <ModelTraining
              filepath={cleanedFile || uploadedFile?.filepath || ''}
              targetColumn={selectedTarget}
              modelName={selectedModel}
              onTrainingComplete={(result) => {
                setTrainingResult(result);
                setCurrentStep('results');
              }}
            />
          )}

          {currentStep === 'results' && trainingResult && (
            <ResultsDashboard
              trainingResult={trainingResult}
              testDataPath={cleanedFile || uploadedFile?.filepath || ''}
              onStartOver={() => {
                setCurrentStep('upload');
                setUploadedFile(null);
                setAnalysisResult(null);
                setModelSuggestions(null);
                setSelectedTarget('');
                setSelectedModel('');
                setTrainingResult(null);
                setCleanedFile(null);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;