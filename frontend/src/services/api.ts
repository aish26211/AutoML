import axios from 'axios';
import type { DatasetInfo, ModelResult, CleaningOptions } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // File upload
  uploadFile: async (file: File): Promise<{ message: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Data analysis
  analyzeData: async (filename: string): Promise<DatasetInfo> => {
    const response = await api.post('/analyze', { filename });
    return response.data;
  },

  // Data preview
  getDataPreview: async (filename: string, rows: number = 10): Promise<any[]> => {
    const response = await api.post('/preview', { filename, rows });
    return response.data;
  },

  // Data cleaning
  cleanData: async (filename: string, options: CleaningOptions): Promise<{ message: string; cleaned_filename: string }> => {
    const response = await api.post('/clean', { filename, options });
    return response.data;
  },

  // Model selection
  selectModels: async (filename: string, targetColumn: string): Promise<string[]> => {
    const response = await api.post('/models/select', { filename, target_column: targetColumn });
    return response.data.models;
  },

  // Model training
  trainModel: async (filename: string, targetColumn: string, modelName: string): Promise<ModelResult> => {
    const response = await api.post('/models/train', {
      filename,
      target_column: targetColumn,
      model_name: modelName,
    });
    return response.data;
  },

  // Feature importance
  getFeatureImportance: async (filename: string, targetColumn: string, modelName: string): Promise<any[]> => {
    const response = await api.post('/models/feature-importance', {
      filename,
      target_column: targetColumn,
      model_name: modelName,
    });
    return response.data;
  },

  // Download cleaned data
  downloadCleanedData: async (filename: string): Promise<Blob> => {
    const response = await api.get(`/download/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};