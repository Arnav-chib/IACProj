import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const FileInput = ({ id, label, value, onChange, required, error, accept }) => {
  const [fileName, setFileName] = useState(value?.name || '');
  const [previewUrl, setPreviewUrl] = useState(value?.url || '');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    
    // Create a preview URL for image files
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
    
    // Store file metadata to pass to parent
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      file, // Include the actual file object for upload
    };
    
    onChange(fileData);
  };

  const handleRemove = () => {
    setFileName('');
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange('');
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex flex-col">
        <div className="flex items-center justify-between border border-gray-300 rounded-md p-2">
          <input
            type="file"
            id={id}
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={accept}
            required={required && !fileName}
          />
          
          <div className="flex-grow mr-2 truncate">
            {fileName ? (
              <div className="text-sm">{fileName}</div>
            ) : (
              <div className="text-sm text-gray-500">No file selected</div>
            )}
          </div>
          
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm mr-2"
            >
              Browse
            </button>
            
            {fileName && (
              <button
                type="button"
                onClick={handleRemove}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        
        {previewUrl && (
          <div className="mt-2">
            <img src={previewUrl} alt="Preview" className="max-h-32 max-w-full rounded-md" />
          </div>
        )}
      </div>
      
      {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
    </div>
  );
};

FileInput.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string,
  accept: PropTypes.string
};

FileInput.defaultProps = {
  value: null,
  required: false,
  error: null,
  accept: 'image/*,.pdf,.doc,.docx'
};

export default FileInput; 