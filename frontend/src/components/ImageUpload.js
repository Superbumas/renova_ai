import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const ImageUpload = ({ onImageUpload }) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('upload.alertFileType'));
      return;
    }

    // Validate file size (max 16MB)
    if (file.size > 16 * 1024 * 1024) {
      alert(t('upload.alertFileSize'));
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      setPreview(result);
      onImageUpload(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setPreview(null);
    onImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                     transition-all duration-300 hover-lift
                     ${dragActive 
                       ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                       : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                     }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileSelector}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            
            <div>
              <p className="text-gray-700 text-lg font-medium">
                {t('upload.dropText')}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {t('upload.supportText')}
              </p>
            </div>
            
            <button
              type="button"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-soft hover-lift"
            >
              {t('upload.chooseFile')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden group">
            <img 
              src={preview} 
              alt="Uploaded preview" 
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={clearImage}
                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors shadow-soft hover-scale"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={openFileSelector}
              className="flex-1 btn-secondary py-3 px-4 rounded-xl transition-all hover-lift"
            >
              {t('upload.changeImage')}
            </button>
            <button
              onClick={clearImage}
              className="bg-red-50 text-red-600 border border-red-200 py-3 px-4 rounded-xl hover:bg-red-100 transition-colors font-medium"
            >
              {t('upload.remove')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 