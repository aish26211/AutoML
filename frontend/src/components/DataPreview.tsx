import React from 'react';
import { Eye, Info, BarChart3 } from 'lucide-react';
import type { DatasetInfo } from '../types';

interface DataPreviewProps {
  data: any[];
  datasetInfo: DatasetInfo;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  datasetInfo,
  onAnalyze,
  isAnalyzing,
}) => {
  return (
    <div className="space-y-6">
      {/* Dataset Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Info className="w-5 h-5" />
            Dataset Overview
          </h2>
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="btn-primary flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Data'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900">Rows</h3>
            <p className="text-2xl font-bold text-blue-700">{datasetInfo.shape[0]}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900">Columns</h3>
            <p className="text-2xl font-bold text-green-700">{datasetInfo.shape[1]}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-medium text-orange-900">Missing Values</h3>
            <p className="text-2xl font-bold text-orange-700">
              {Object.values(datasetInfo.missing).reduce((sum, val) => sum + val, 0)}
            </p>
          </div>
        </div>

        {/* Column Information */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Column Information</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Column
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Data Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Missing Values
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Missing %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(datasetInfo.structure).map(([column, dtype]) => (
                  <tr key={column}>
                    <td className="px-4 py-2 font-medium text-gray-900">{column}</td>
                    <td className="px-4 py-2 text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dtype.includes('int') || dtype.includes('float')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {dtype}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{datasetInfo.missing[column]}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {((datasetInfo.missing[column] / datasetInfo.shape[0]) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Data Preview */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Data Preview
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {data.length > 0 && Object.keys(data[0]).map((column) => (
                  <th
                    key={column}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value: any, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900">
                      {value === null || value === undefined ? (
                        <span className="text-gray-400 italic">null</span>
                      ) : (
                        String(value)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};