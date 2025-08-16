import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { UploadedFile } from '../App';

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
  onNext: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, onNext }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      setUploadedFile(result);
      onFileUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onFileUploaded]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Your Dataset</h2>
          <p className="text-slate-600">
            Upload a CSV file to begin the AutoML pipeline. We'll analyze your data and suggest the best models.
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : uploading
              ? 'border-yellow-400 bg-yellow-50'
              : uploadedFile
              ? 'border-green-400 bg-green-50'
              : error
              ? 'border-red-400 bg-red-50'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4" />
          ) : uploadedFile ? (
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          ) : error ? (
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          ) : (
            <Upload className={`w-12 h-12 mx-auto mb-4 ${
              dragActive ? 'text-blue-500' : 'text-slate-400'
            }`} />
          )}

          <div className="mb-4">
            {uploading ? (
              <p className="text-lg font-medium text-yellow-600">Uploading...</p>
            ) : uploadedFile ? (
              <>
                <p className="text-lg font-medium text-green-600 mb-2">File uploaded successfully!</p>
                <div className="inline-flex items-center bg-white rounded-lg px-4 py-2 shadow-sm">
                  <FileText className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-slate-700 font-medium">{uploadedFile.filename}</span>
                </div>
              </>
            ) : error ? (
              <p className="text-lg font-medium text-red-600">{error}</p>
            ) : (
              <>
                <p className="text-lg font-medium text-slate-700 mb-2">
                  {dragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
                </p>
                <p className="text-slate-500">or click to browse files</p>
              </>
            )}
          </div>

          {!uploading && !uploadedFile && (
            <label className="inline-block">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300 cursor-pointer inline-block">
                Choose File
              </span>
            </label>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {uploadedFile && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={onNext}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Continue to Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;