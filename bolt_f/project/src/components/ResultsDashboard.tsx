import React, { useState, useEffect } from 'react';
import { Trophy, Download, BarChart3, RefreshCw, Play, Target, Award } from 'lucide-react';
import { TrainingResult } from '../App';

interface ResultsDashboardProps {
  trainingResult: TrainingResult;
  testDataPath: string;
  onStartOver: () => void;
}

interface EvaluationResult {
  evaluation_results: any;
  test_samples: number;
  model_used: string;
  test_data_used: string;
  message: string;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  trainingResult,
  testDataPath,
  onStartOver,
}) => {
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runEvaluation = async () => {
    setEvaluating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_path: trainingResult.model_path,
          test_data_path: testDataPath,
          target_column: trainingResult.target_column,
        }),
      });

      if (!response.ok) {
        throw new Error(`Evaluation failed: ${response.status}`);
      }

      const result = await response.json();
      setEvaluationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    runEvaluation();
  }, []);

  const getPerformanceLevel = (value: number, isClassification: boolean) => {
    const threshold = isClassification ? 0.8 : 0.7;
    if (value >= threshold) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (value >= threshold - 0.2) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (value >= threshold - 0.4) return { level: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const downloadModel = () => {
    // Create download link for model file
    const link = document.createElement('a');
    link.href = `http://localhost:8000/static/${trainingResult.model_filename}`;
    link.download = trainingResult.model_filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isClassification = trainingResult.metrics.accuracy !== undefined;
  const mainScore = isClassification 
    ? trainingResult.metrics.accuracy 
    : trainingResult.metrics.r2_score;
  const performance = getPerformanceLevel(mainScore, isClassification);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Model Results</h2>
        <p className="text-lg text-slate-600">
          Your <span className="font-semibold text-blue-600">{trainingResult.model_name}</span> model 
          is ready for production use!
        </p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Score */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-bold text-slate-800">Model Performance</h3>
          </div>
          <div className={`${performance.bg} rounded-lg p-4`}>
            <div className="text-3xl font-bold text-slate-800 mb-2">
              {(mainScore * 100).toFixed(1)}%
            </div>
            <div className={`font-medium ${performance.color} mb-1`}>
              {performance.level}
            </div>
            <div className="text-sm text-slate-600">
              {isClassification ? 'Accuracy' : 'R² Score'}
            </div>
          </div>
        </div>

        {/* Dataset Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-6 h-6 text-green-500 mr-2" />
            <h3 className="text-lg font-bold text-slate-800">Training Data</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Training Samples:</span>
              <span className="font-semibold text-slate-800">
                {trainingResult.metrics.meta?.train_size || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Test Samples:</span>
              <span className="font-semibold text-slate-800">
                {trainingResult.metrics.meta?.test_size || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Features:</span>
              <span className="font-semibold text-slate-800">
                {trainingResult.metrics.meta?.feature_count || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Model Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Award className="w-6 h-6 text-purple-500 mr-2" />
            <h3 className="text-lg font-bold text-slate-800">Model Details</h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-slate-600">Algorithm:</span>
              <div className="font-semibold text-slate-800 text-sm mt-1">
                {trainingResult.model_name}
              </div>
            </div>
            <div>
              <span className="text-slate-600">Target Column:</span>
              <div className="font-semibold text-slate-800">{trainingResult.target_column}</div>
            </div>
            <div>
              <span className="text-slate-600">Task Type:</span>
              <div className="font-semibold text-slate-800">
                {trainingResult.metrics.meta?.task || (isClassification ? 'Classification' : 'Regression')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {isClassification ? (
        /* Classification Metrics */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Classification Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-slate-700">Accuracy</span>
                <span className="font-bold text-blue-600">
                  {(trainingResult.metrics.accuracy * 100).toFixed(2)}%
                </span>
              </div>
              {trainingResult.metrics.f1_macro && (
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-slate-700">F1 Score (Macro)</span>
                  <span className="font-bold text-green-600">
                    {(trainingResult.metrics.f1_macro * 100).toFixed(2)}%
                  </span>
                </div>
              )}
              {trainingResult.metrics.precision_macro && (
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-slate-700">Precision (Macro)</span>
                  <span className="font-bold text-purple-600">
                    {(trainingResult.metrics.precision_macro * 100).toFixed(2)}%
                  </span>
                </div>
              )}
              {trainingResult.metrics.recall_macro && (
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-slate-700">Recall (Macro)</span>
                  <span className="font-bold text-orange-600">
                    {(trainingResult.metrics.recall_macro * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Class Distribution */}
          {trainingResult.metrics.meta?.classes && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Class Distribution</h3>
              <div className="space-y-3">
                {trainingResult.metrics.meta.classes.map((cls: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-slate-700">Class {cls}</span>
                    <span className="font-semibold text-slate-800">{cls}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Regression Metrics */
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Regression Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {trainingResult.metrics.r2_score?.toFixed(3) || 'N/A'}
              </div>
              <div className="text-sm text-slate-600">R² Score</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {trainingResult.metrics.rmse?.toFixed(3) || 'N/A'}
              </div>
              <div className="text-sm text-slate-600">RMSE</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {trainingResult.metrics.mse?.toFixed(3) || 'N/A'}
              </div>
              <div className="text-sm text-slate-600">MSE</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {trainingResult.metrics.mae?.toFixed(3) || 'N/A'}
              </div>
              <div className="text-sm text-slate-600">MAE</div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Evaluation */}
      {evaluating ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-8">
          <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Running Additional Evaluation</h3>
          <p className="text-slate-600">Testing model performance on additional data...</p>
        </div>
      ) : evaluationResult ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Additional Evaluation Results</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-medium mb-2">✅ {evaluationResult.message}</p>
            <p className="text-sm text-green-600">
              Evaluated on {evaluationResult.test_samples} test samples using {evaluationResult.model_used}
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">❌ Additional Evaluation Failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={downloadModel}
          className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-3 rounded-lg font-medium hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Trained Model
        </button>
        
        <button
          onClick={onStartOver}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
        >
          <Play className="w-5 h-5 mr-2" />
          Train Another Model
        </button>
      </div>
    </div>
  );
};

export default ResultsDashboard;