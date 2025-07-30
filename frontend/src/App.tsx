import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataPreview } from './components/DataPreview';
import { DataCleaning } from './components/DataCleaning';
import { ModelTraining } from './components/ModelTraining';
import { apiService } from './services/api';
import type { DatasetInfo, ModelResult, FeatureImportance, CleaningOptions } from './types';
import { AlertCircle, CheckCircle, Database } from 'lucide-react';

function App() {
  // State management
  const [currentFile, setCurrentFile] = useState<string>('');
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelResults, setModelResults] = useState<ModelResult[]>([]);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'upload' | 'preview' | 'clean' | 'train'>('upload');
  const [isCleaningComplete, setIsCleaningComplete] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await apiService.uploadFile(file);
      setCurrentFile(response.filename);
      
      // Get data preview and info
      const [preview, info] = await Promise.all([
        apiService.getDataPreview(response.filename),
        apiService.analyzeData(response.filename)
      ]);
      
      setDataPreview(preview);
      setDatasetInfo(info);
      setActiveTab('preview');
      showNotification('success', 'File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('error', 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Data analysis handler
  const handleAnalyze = async () => {
    if (!currentFile) return;
    
    setIsAnalyzing(true);
    try {
      const info = await apiService.analyzeData(currentFile);
      setDatasetInfo(info);
      showNotification('success', 'Data analysis completed!');
    } catch (error) {
      console.error('Analysis error:', error);
      showNotification('error', 'Failed to analyze data.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Data cleaning handler
  const handleCleanData = async (options: CleaningOptions) => {
    if (!currentFile) return;
    
    setIsCleaning(true);
    try {
      const response = await apiService.cleanData(currentFile, options);
      setCurrentFile(response.cleaned_filename);
      setIsCleaningComplete(true);
      
      // Refresh data preview and info
      const [preview, info] = await Promise.all([
        apiService.getDataPreview(response.cleaned_filename),
        apiService.analyzeData(response.cleaned_filename)
      ]);
      
      setDataPreview(preview);
      setDatasetInfo(info);
      showNotification('success', 'Data cleaned successfully!');
    } catch (error) {
      console.error('Cleaning error:', error);
      showNotification('error', 'Failed to clean data.');
    } finally {
      setIsCleaning(false);
    }
  };

  // Download cleaned data
  const handleDownloadCleaned = async () => {
    if (!currentFile) return;
    
    try {
      const blob = await apiService.downloadCleanedData(currentFile);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaned_${currentFile}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      showNotification('error', 'Failed to download cleaned data.');
    }
  };

  // Model training handler
  const handleTrainModel = async (targetColumn: string, modelName: string) => {
    if (!currentFile) return;
    
    setIsTraining(true);
    try {
      // Get available models if not already loaded
      if (availableModels.length === 0) {
        const models = await apiService.selectModels(currentFile, targetColumn);
        setAvailableModels(models);
      }
      
      // Train the model
      const result = await apiService.trainModel(currentFile, targetColumn, modelName);
      setModelResults(prev => [...prev, result]);
      
      // Get feature importance for tree-based models
      if (modelName.includes('RandomForest')) {
        try {
          const importance = await apiService.getFeatureImportance(currentFile, targetColumn, modelName);
          setFeatureImportance(importance);
        } catch (error) {
          console.warn('Could not get feature importance:', error);
        }
      }
      
      showNotification('success', `Model ${modelName} trained successfully!`);
    } catch (error) {
      console.error('Training error:', error);
      showNotification('error', 'Failed to train model.');
    } finally {
      setIsTraining(false);
    }
  };

  // Load available models when target column changes
  const handleTargetColumnChange = async (targetColumn: string) => {
    if (!currentFile || !targetColumn) return;
    
    try {
      const models = await apiService.selectModels(currentFile, targetColumn);
      setAvailableModels(models);
    } catch (error) {
      console.error('Model selection error:', error);
    }
  };

  const tabs = [
    { id: 'upload', label: 'Upload', icon: Database },
    { id: 'preview', label: 'Preview', icon: Database },
    { id: 'clean', label: 'Clean', icon: Database },
    { id: 'train', label: 'Train', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">AutoML Data Pipeline</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = tab.id !== 'upload' && !currentFile;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id as any)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : isDisabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
        )}

        {activeTab === 'preview' && datasetInfo && (
          <DataPreview
            data={dataPreview}
            datasetInfo={datasetInfo}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        )}

        {activeTab === 'clean' && (
          <DataCleaning
            onCleanData={handleCleanData}
            onDownloadCleaned={handleDownloadCleaned}
            isCleaning={isCleaning}
            isCleaningComplete={isCleaningComplete}
          />
        )}

        {activeTab === 'train' && datasetInfo && (
          <ModelTraining
            availableModels={availableModels}
            onTrainModel={handleTrainModel}
            modelResults={modelResults}
            featureImportance={featureImportance}
            isTraining={isTraining}
            columns={Object.keys(datasetInfo.structure)}
          />
        )}
      </main>
    </div>
  );
}

export default App;