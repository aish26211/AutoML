import React, { useState, useEffect } from 'react';
import { Brain, Zap, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { TrainingResult } from '../App';

interface ModelTrainingProps {
  filepath: string;
  targetColumn: string;
  modelName: string;
  onTrainingComplete: (result: TrainingResult) => void;
}

const ModelTraining: React.FC<ModelTrainingProps> = ({
  filepath,
  targetColumn,
  modelName,
  onTrainingComplete,
}) => {
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrainingResult | null>(null);

  const steps = [
    'Preparing data...',
    'Splitting train/test sets...',
    'Training model...',
    'Evaluating performance...',
    'Saving model...',
  ];

  const trainModel = async () => {
    setTraining(true);
    setError(null);
    setProgress(0);

    // Simulate progressive steps
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i]);
      setProgress((i / steps.length) * 80); // Leave 20% for actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      const response = await fetch('http://localhost:8000/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filepath: filepath,
          target_column: targetColumn,
          model_name: modelName,
          test_size: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Training failed: ${response.status}`);
      }

      const trainingResult = await response.json();
      setProgress(100);
      setCurrentStep('Training completed!');
      setResult(trainingResult);
      onTrainingComplete(trainingResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  useEffect(() => {
    trainModel();
  }, []);

  const getMetricValue = (metrics: any) => {
    if (metrics.accuracy !== undefined) return metrics.accuracy.toFixed(3);
    if (metrics.r2_score !== undefined) return metrics.r2_score.toFixed(3);
    return 'N/A';
  };

  const getMetricLabel = (metrics: any) => {
    if (metrics.accuracy !== undefined) return 'Accuracy';
    if (metrics.r2_score !== undefined) return 'R² Score';
    return 'Score';
  };

  const getModelIcon = (modelName: string) => {
    if (modelName.includes('RandomForest')) return '🌲';
    if (modelName.includes('GradientBoosting')) return '⚡';
    if (modelName.includes('Logistic')) return '📈';
    return '🤖';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{getModelIcon(modelName)}</div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Training Your Model</h2>
          <p className="text-lg text-slate-600">
            Training <span className="font-semibold text-blue-600">{modelName}</span> on{' '}
            <span className="font-semibold text-purple-600">{targetColumn}</span>
          </p>
        </div>

        {error ? (
          /* Error State */
          <div className="text-center py-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-600 mb-2">Training Failed</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={trainModel}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        ) : result ? (
          /* Success State */
          <div className="space-y-6">
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-600 mb-2">Training Completed!</h3>
              <p className="text-slate-600">Your model has been successfully trained and saved.</p>
            </div>

            {/* Training Metrics */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
                <h4 className="text-lg font-bold text-slate-800">Training Results</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {getMetricValue(result.metrics)}
                  </div>
                  <div className="text-sm text-slate-600">{getMetricLabel(result.metrics)}</div>
                </div>
                
                {result.metrics.meta && (
                  <>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {result.metrics.meta.train_size}
                      </div>
                      <div className="text-sm text-slate-600">Training Samples</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {result.metrics.meta.test_size}
                      </div>
                      <div className="text-sm text-slate-600">Test Samples</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Model Info */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h4 className="font-bold text-slate-800 mb-4">Model Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Model:</span>
                  <span className="ml-2 font-semibold text-slate-800">{result.model_name}</span>
                </div>
                <div>
                  <span className="text-slate-600">Target:</span>
                  <span className="ml-2 font-semibold text-slate-800">{result.target_column}</span>
                </div>
                <div>
                  <span className="text-slate-600">Filename:</span>
                  <span className="ml-2 font-semibold text-slate-800 text-xs">{result.model_filename}</span>
                </div>
                <div>
                  <span className="text-slate-600">Task:</span>
                  <span className="ml-2 font-semibold text-slate-800">
                    {result.metrics.meta?.task || 'ML Task'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Training State */
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">{currentStep}</span>
                <span className="text-slate-500">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Training Animation */}
            <div className="flex justify-center py-8">
              <div className="relative">
                <Brain className="w-24 h-24 text-blue-500 animate-pulse" />
                <div className="absolute -top-2 -right-2">
                  <Zap className="w-8 h-8 text-yellow-500 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Training Steps */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h4 className="font-bold text-slate-800 mb-4">Training Pipeline</h4>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const isActive = index === Math.floor(progress / 20);
                  const isCompleted = index < Math.floor(progress / 20);
                  
                  return (
                    <div key={index} className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-500 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                      <span className={`${
                        isActive ? 'text-blue-600 font-medium' : isCompleted ? 'text-green-600' : 'text-slate-500'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelTraining;