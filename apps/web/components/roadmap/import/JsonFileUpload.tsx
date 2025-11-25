'use client';

/**
 * JsonFileUpload Component
 *
 * Drag-and-drop file upload for JSON files
 * - Visual feedback on drag
 * - Click to browse
 * - Max file size: 1MB
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, FileJson, AlertCircle } from 'lucide-react';

interface JsonFileUploadProps {
  onFileSelect: (content: string) => void;
  isDisabled: boolean;
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export function JsonFileUpload({ onFileSelect, isDisabled }: JsonFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      setFileName(null);

      // Validate file type
      if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        setError('Please upload a JSON file (.json)');
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError('File size exceeds 1MB limit');
        return;
      }

      // Read file
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileName(file.name);
        onFileSelect(content);
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (isDisabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]!);
      }
    },
    [isDisabled, processFile]
  );

  const handleClick = useCallback(() => {
    if (!isDisabled) {
      fileInputRef.current?.click();
    }
  }, [isDisabled]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]!);
      }
    },
    [processFile]
  );

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative p-12 rounded-2xl border-2 border-dashed
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-coral bg-coral/10'
            : 'border-slate/30 hover:border-coral/50 hover:bg-dark-pressed/50'
          }
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
          disabled={isDisabled}
        />

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={`
              w-16 h-16 rounded-2xl flex items-center justify-center mb-4
              ${isDragging ? 'bg-coral/20' : 'neu-pressed'}
            `}
          >
            {fileName ? (
              <FileJson className="h-8 w-8 text-coral" />
            ) : (
              <Upload className={`h-8 w-8 ${isDragging ? 'text-coral' : 'text-slate'}`} />
            )}
          </div>

          {/* Text */}
          {fileName ? (
            <>
              <p className="text-white font-medium mb-1">{fileName}</p>
              <p className="text-sm text-slate">Click or drop to replace</p>
            </>
          ) : (
            <>
              <p className="text-white font-medium mb-1">
                {isDragging ? 'Drop your file here' : 'Drag & drop your JSON file'}
              </p>
              <p className="text-sm text-slate">or click to browse</p>
              <p className="text-xs text-slate/50 mt-2">Maximum file size: 1MB</p>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
