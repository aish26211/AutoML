import React, { useState } from 'react';
import { Trash2, Download, Settings } from 'lucide-react';
import { CleaningOptions } from '../types';

interface DataCleaningProps {
  onCleanData: (options: CleaningOptions) => void;
  onDownloadCleaned: () => void;
  isCleaning: boolean;
  isCleaningComplete: boolean;
}

export const DataCleaning: React.FC<DataCleaningProps> = ({
  onCleanData,
  onDownloadCleaned,
  isCleaning,
  isCleaningComplete,
}) => {
  const [options, setOptions] = useState<CleaningOptions>({
    handleMissing: 'fill',
    fillStrategy: 'mean',
    removeDuplicates: true,
    scaler: 'standard',
    encoder: 'onehot',
  });

  const handleClean = () => {
    onCleanData(options);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Data Cleaning & Preprocessing
      </h2>

      <div className="space-y-6">
        {/* Missing Values */}
        <div>
          <h3 className="font-medium mb-3">Missing Values</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="handleMissing"
                  value="drop"
                  checked={options.handleMissing === 'drop'}
                  onChange={(e) => setOptions({ ...options, handleMissing: e.target.value as 'drop' | 'fill' })}
                  className="mr-2"
                />
                Drop rows with missing values
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="handleMissing"
                  value="fill"
                  checked={options.handleMissing === 'fill'}
                  onChange={(e) => setOptions({ ...options, handleMissing: e.target.value as 'drop' | 'fill' })}
                  className="mr-2"
                />
                Fill missing values
              </label>
            </div>
            
            {options.handleMissing === 'fill' && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fill Strategy
                </label>
                <select
                  value={options.fillStrategy}
                  onChange={(e) => setOptions({ ...options, fillStrategy: e.target.value as 'mean' | 'median' | 'mode' })}
                  className="input-field w-48"
                >
                  <option value="mean">Mean (numerical)</option>
                  <option value="median">Median (numerical)</option>
                  <option value="mode">Mode (categorical)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Duplicates */}
        <div>
          <h3 className="font-medium mb-3">Duplicates</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.removeDuplicates}
              onChange={(e) => setOptions({ ...options, removeDuplicates: e.target.checked })}
              className="mr-2"
            />
            Remove duplicate rows
          </label>
        </div>

        {/* Scaling */}
        <div>
          <h3 className="font-medium mb-3">Numerical Scaling</h3>
          <select
            value={options.scaler || ''}
            onChange={(e) => setOptions({ ...options, scaler: e.target.value as 'standard' | 'minmax' | 'robust' | undefined })}
            className="input-field w-48"
          >
            <option value="">No scaling</option>
            <option value="standard">Standard Scaler</option>
            <option value="minmax">Min-Max Scaler</option>
            <option value="robust">Robust Scaler</option>
          </select>
        </div>

        {/* Encoding */}
        <div>
          <h3 className="font-medium mb-3">Categorical Encoding</h3>
          <select
            value={options.encoder || ''}
            onChange={(e) => setOptions({ ...options, encoder: e.target.value as 'onehot' | 'label' | undefined })}
            className="input-field w-48"
          >
            <option value="">No encoding</option>
            <option value="onehot">One-Hot Encoding</option>
            <option value="label">Label Encoding</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <button
            onClick={handleClean}
            disabled={isCleaning}
            className="btn-primary flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isCleaning ? 'Cleaning...' : 'Clean Data'}
          </button>

          {isCleaningComplete && (
            <button
              onClick={onDownloadCleaned}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Cleaned Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
};