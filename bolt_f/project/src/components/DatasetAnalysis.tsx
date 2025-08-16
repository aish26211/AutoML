import React, { useState, useEffect } from 'react';
import { BarChart3, Database, AlertTriangle, Sparkles, ChevronRight, RefreshCw } from 'lucide-react';
import { UploadedFile, AnalysisResult } from '../App';
import Plot from 'react-plotly.js';

interface DatasetAnalysisProps {
  file: UploadedFile;
  onAnalysisComplete: (result: AnalysisResult) => void;
  onCleaningComplete: (cleanedPath: string) => void;
  onNext: () => void;
  analysisResult: AnalysisResult | null;
  cleanedFile: string | null;
}

const DatasetAnalysis: React.FC<DatasetAnalysisProps> = ({
  file,
  onAnalysisComplete,
  onCleaningComplete,
  onNext,
  analysisResult,
  cleanedFile,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filepath: file.filepath,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      onAnalysisComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const runCleaning = async () => {
    setCleaning(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filepath: file.filepath,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cleaning failed: ${response.status}`);
      }

      const result = await response.json();
      onCleaningComplete(result.cleaned_filepath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleaning failed');
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    if (!analysisResult) {
      runAnalysis();
    }
  }, []);

  const getTotalNulls = (nulls: Record<string, number>) => {
    return Object.values(nulls).reduce((sum, count) => sum + count, 0);
  };

  const getDataQualityScore = (analysis: AnalysisResult['analysis']) => {
    const totalNulls = getTotalNulls(analysis.nulls);
    const totalCells = analysis.shape[0] * analysis.shape[1];
    const nullPercentage = (totalNulls / totalCells) * 100;
    
    if (nullPercentage < 5) return { score: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (nullPercentage < 15) return { score: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (nullPercentage < 30) return { score: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { score: 'Poor', color: 'text-red-600', bg: 'bg-red-50' };
  };

  if (analyzing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Analyzing Your Dataset</h2>
          <p className="text-slate-600">
            We're examining your data structure, detecting patterns, and preparing insights...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Analysis Failed</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={runAnalysis}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisResult) return null;

  const { analysis, plotly_graphs } = analysisResult;
  const qualityScore = getDataQualityScore(analysis);
  const totalNulls = getTotalNulls(analysis.nulls);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Dataset Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-bold text-slate-800">Dataset Overview</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Rows:</span>
              <span className="font-semibold text-slate-800">{analysis.shape[0].toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Columns:</span>
              <span className="font-semibold text-slate-800">{analysis.shape[1]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Missing Values:</span>
              <span className="font-semibold text-slate-800">{totalNulls.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Data Quality */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-6 h-6 text-green-500 mr-2" />
            <h3 className="text-lg font-bold text-slate-800">Data Quality</h3>
          </div>
          <div className={`${qualityScore.bg} rounded-lg p-4`}>
            <div className={`text-2xl font-bold ${qualityScore.color} mb-2`}>
              {qualityScore.score}
            </div>
            <p className="text-sm text-slate-600">
              {((1 - totalNulls / (analysis.shape[0] * analysis.shape[1])) * 100).toFixed(1)}% complete data
            </p>
          </div>
        </div>

        {/* Suggested Target */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Sparkles className="w-6 h-6 text-purple-500 mr-2" />
            <h3 className="text-lg font-bold text-slate-800">AI Suggestion</h3>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-2">Suggested target column:</p>
            <p className="font-bold text-slate-800">{analysis.suggested_target}</p>
          </div>
        </div>
      </div>

      {/* Data Visualizations */}
      {Object.keys(plotly_graphs).length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Data Visualizations</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(plotly_graphs).map(([key, graphJson]) => (
              <div key={key} className="border border-slate-200 rounded-lg p-4">
                <Plot
                  data={JSON.parse(graphJson).data}
                  layout={{
                    ...JSON.parse(graphJson).layout,
                    autosize: true,
                    height: 400,
                    margin: { t: 50, r: 20, b: 50, l: 50 },
                  }}
                  config={{ displayModeBar: false, responsive: true }}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Details */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Column Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Column</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Missing</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Unique</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysis.dtypes).map(([column, dtype]) => (
                <tr key={column} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {column}
                    {column === analysis.suggested_target && (
                      <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        Suggested Target
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{dtype}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      analysis.nulls[column] === 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {analysis.nulls[column]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{analysis.unique[column]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Cleaning */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Data Cleaning</h3>
            <p className="text-slate-600">Clean missing values and prepare your data for training</p>
          </div>
          {!cleanedFile && totalNulls > 0 && (
            <button
              onClick={runCleaning}
              disabled={cleaning}
              className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 flex items-center"
            >
              {cleaning ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {cleaning ? 'Cleaning...' : 'Clean Data'}
            </button>
          )}
        </div>

        {cleanedFile ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-700">
              <Sparkles className="w-5 h-5 mr-2" />
              <span className="font-medium">Data cleaned successfully!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Missing values have been filled using median for numeric columns and mode for categorical columns.
            </p>
          </div>
        ) : totalNulls === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center text-blue-700">
              <Database className="w-5 h-5 mr-2" />
              <span className="font-medium">Your data is already clean!</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">No missing values detected.</p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center text-yellow-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="font-medium">Missing values detected</span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              We recommend cleaning your data before proceeding to model training.
            </p>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center"
        >
          Continue to Model Selection
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default DatasetAnalysis;