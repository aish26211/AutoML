import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isUploading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Upload Dataset
      </h2>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        
        {isUploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your dataset'}
            </p>
            <p className="text-gray-500">
              or <span className="text-primary-600 font-medium">click to browse</span>
            </p>
            <p className="text-sm text-gray-400">
              Supports CSV and Excel files
            </p>
          </div>
        )}
      </div>
    </div>
  );
};