import React, { useState, useEffect } from 'react';
import { Brain, Target, ChevronRight, RefreshCw, Award, Zap } from 'lucide-react';
import { AnalysisResult, ModelSuggestion } from '../App';

interface ModelSelectionProps {
  file: string;
  targetColumn: string;
  onTargetChange: (target: string) => void;
  analysisResult: AnalysisResult;
  onModelSelected: (suggestions: ModelSuggestion) => void;
  onNext: () => void;
  modelSuggestions: ModelSuggestion | null;
  selectedModel: string;
  onSelectedModelChange: (model: string) => void;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({
  file,
  targetColumn,
  onTargetChange,
  analysisResult,
  onModelSelected,
  onNext,
  modelSuggestions,
  selectedModel,
  onSelectedModelChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getModelSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/select-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filepath: file,
          target_column: targetColumn,
        }),
      });

      if (!response.ok) {
        throw new Error(`Model selection failed: ${response.status}`);
      }

      const result = await response.json();
      onModelSelected(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Model selection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!modelSuggestions && targetColumn) {
      getModelSuggestions();
    }
  }, [targetColumn]);

  const availableColumns = Object.keys(analysisResult.analysis.dtypes).filter(
    col => analysisResult.analysis.unique[col] > 1 && analysisResult.analysis.unique[col] < analysisResult.analysis.shape[0] / 2
  );

  const getModelIcon = (modelName: string) => {
    if (modelName.includes('RandomForest')) return '🌲';
    if (modelName.includes('GradientBoosting')) return '⚡';
    if (modelName.includes('Logistic')) return '📈';
    if (modelName.includes('SVM')) return '🎯';
    return '🤖';
  };

  const getModelDescription = (modelName: string) => {
    const descriptions: Record<string, string> = {
      'RandomForestClassifier': 'Ensemble of decision trees with voting for robust classification',
      'RandomForestRegressor': 'Ensemble of decision trees with averaging for robust regression',
      'GradientBoostingClassifier': 'Sequential tree building for high-accuracy classification',
      'GradientBoostingRegressor': 'Sequential tree building for high-accuracy regression',
      'LogisticRegression': 'Linear model with sigmoid function for interpretable classification',
    };
    return descriptions[modelName] || 'Advanced machine learning algorithm';
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Target Column Selection */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center mb-6">
          <Target className="w-6 h-6 text-purple-500 mr-2" />
          <h3 className="text-lg font-bold text-slate-800">Select Target Column</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableColumns.map((column) => (
            <button
              key={column}
              onClick={() => {
                onTargetChange(column);
                if (modelSuggestions) {
                  // Reset model suggestions when target changes
                  onModelSelected(null as any);
                }
              }}
              className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                column === targetColumn
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold text-slate-800 mb-2">{column}</div>
              <div className="text-sm text-slate-600">
                {analysisResult.analysis.dtypes[column]} • {analysisResult.analysis.unique[column]} unique values
              </div>
              {column === analysisResult.analysis.suggested_target && (
                <div className="mt-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    AI Suggested
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Model Suggestions */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">AI is Selecting Best Models</h3>
          <p className="text-slate-600">
            Analyzing your data characteristics to recommend the most suitable algorithms...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Model Selection Failed</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={getModelSuggestions}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      ) : modelSuggestions ? (
        <div className="space-y-6">
          {/* Best Model */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Award className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-bold text-slate-800">AI Recommended Model</h3>
            </div>
            
            <div 
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedModel === modelSuggestions.best_model.name
                  ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50'
                  : 'border-slate-200 hover:border-yellow-300 hover:bg-yellow-50'
              }`}
              onClick={() => onSelectedModelChange(modelSuggestions.best_model.name)}
            >
              <div className="flex items-start">
                <div className="text-3xl mr-4">{getModelIcon(modelSuggestions.best_model.name)}</div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="text-xl font-bold text-slate-800 mr-3">
                      {modelSuggestions.best_model.name}
                    </h4>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                      Best Choice
                    </span>
                  </div>
                  <p className="text-slate-600 mb-3">{modelSuggestions.best_model.description}</p>
                  <p className="text-sm text-slate-500">{getModelDescription(modelSuggestions.best_model.name)}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedModel === modelSuggestions.best_model.name
                    ? 'border-yellow-400 bg-yellow-400'
                    : 'border-slate-300'
                }`}>
                  {selectedModel === modelSuggestions.best_model.name && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Alternative Models */}
          {modelSuggestions.other_options && modelSuggestions.other_options.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <Zap className="w-6 h-6 text-blue-500 mr-2" />
                <h3 className="text-lg font-bold text-slate-800">Alternative Models</h3>
              </div>
              
              <div className="space-y-4">
                {modelSuggestions.other_options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                      selectedModel === option.name
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                    onClick={() => onSelectedModelChange(option.name)}
                  >
                    <div className="flex items-start">
                      <div className="text-2xl mr-3">{getModelIcon(option.name)}</div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-slate-800 mb-1">{option.name}</h5>
                        <p className="text-sm text-slate-600 mb-2">{option.description}</p>
                        <p className="text-xs text-slate-500">{getModelDescription(option.name)}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedModel === option.name
                          ? 'border-blue-400 bg-blue-400'
                          : 'border-slate-300'
                      }`}>
                        {selectedModel === option.name && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Continue Button */}
      {modelSuggestions && selectedModel && (
        <div className="flex justify-end mt-8">
          <button
            onClick={onNext}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center"
          >
            Start Training
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ModelSelection;