import React, { useState } from 'react';
import { Brain, Target, TrendingUp } from 'lucide-react';
import type { ModelResult, FeatureImportance } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ModelTrainingProps {
  availableModels: string[];
  onTrainModel: (targetColumn: string, modelName: string) => void;
  modelResults: ModelResult[];
  featureImportance: FeatureImportance[];
  isTraining: boolean;
  columns: string[];
}

export const ModelTraining: React.FC<ModelTrainingProps> = ({
  availableModels,
  onTrainModel,
  modelResults,
  featureImportance,
  isTraining,
  columns,
}) => {
  const [targetColumn, setTargetColumn] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const handleTrain = () => {
    if (targetColumn && selectedModel) {
      onTrainModel(targetColumn, selectedModel);
    }
  };

  const formatMetric = (value: number) => {
    return typeof value === 'number' ? value.toFixed(4) : 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Model Configuration */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Model Training
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4 inline mr-1" />
              Target Column
            </label>
            <select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Select target column</option>
              {columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Type
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="input-field w-full"
              disabled={!targetColumn}
            >
              <option value="">Select model</option>
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTrain}
            disabled={!targetColumn || !selectedModel || isTraining}
            className="btn-primary w-full"
          >
            {isTraining ? 'Training Model...' : 'Train Model'}
          </button>
        </div>
      </div>

      {/* Model Results */}
      {modelResults.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Model Performance
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Model
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Task
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Primary Metric
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Train Size
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Test Size
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {modelResults.map((result, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 font-medium text-gray-900">{result.model}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.meta.task === 'classification'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {result.meta.task}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {result.meta.task === 'classification'
                        ? `Accuracy: ${formatMetric(result.accuracy || 0)}`
                        : `R²: ${formatMetric(result.r2_score || 0)}`
                      }
                    </td>
                    <td className="px-4 py-2 text-gray-600">{result.meta.train_size}</td>
                    <td className="px-4 py-2 text-gray-600">{result.meta.test_size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feature Importance */}
      {featureImportance.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Feature Importance</h2>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportance.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="feature" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="importance" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};