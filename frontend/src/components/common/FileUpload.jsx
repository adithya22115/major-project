import React, { useRef, useState } from 'react';
import { UploadCloud, X, FileText, Image as ImageIcon } from 'lucide-react';

const FileUpload = ({ onFileSelect, accept = 'image/*', maxSize = 5, multiple = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFiles = (files) => {
    const validFiles = Array.from(files).filter(file => {
      const sizeMB = file.size / (1024 * 1024);
      return sizeMB <= maxSize;
    });

    if (validFiles.length < files.length) {
      alert(`Some files were skipped because they exceed the ${maxSize}MB limit.`);
    }

    let newFiles;
    if (multiple) {
      newFiles = [...selectedFiles, ...validFiles];
    } else {
      newFiles = validFiles.slice(0, 1);
    }

    setSelectedFiles(newFiles);
    onFileSelect(multiple ? newFiles : newFiles[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (indexToRemove) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(newFiles);
    onFileSelect(multiple ? newFiles : newFiles[0]);
  };

  return (
    <div className="w-full">
      <div 
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-theme hover:bg-surface2/30'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-blue-500/15 rounded-full">
            <UploadCloud className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-sm text-primary">
            <span className="font-semibold text-blue-500">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-subtle">
            {accept.includes('image') ? 'SVG, PNG, JPG or GIF' : 'PDF, DOCX'} (Max. {maxSize}MB)
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <ul className="mt-4 space-y-2">
          {selectedFiles.map((file, index) => (
            <li key={index} className="flex items-center justify-between p-3 bg-surface2/50 rounded-md border border-theme">
              <div className="flex items-center space-x-3 overflow-hidden">
                {file.type.includes('image') ? (
                  <ImageIcon className="h-5 w-5 text-muted shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-muted shrink-0" />
                )}
                <span className="text-sm font-medium text-primary truncate">{file.name}</span>
                <span className="text-xs text-subtle shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="text-muted hover:text-red-500 p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileUpload;
