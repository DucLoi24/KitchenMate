// KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/ThumbnailUpload.jsx
import { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaImage } from 'react-icons/fa';

const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ThumbnailUpload({ onFileSelect }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Chỉ chấp nhận file JPG, PNG hoặc WebP';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File quá lớn (tối đa ${MAX_SIZE_MB}MB)`;
    }
    return null;
  };

  const handleFile = (file) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    onFileSelect(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-orange-500 bg-orange-50'
            : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FaCloudUploadAlt className="text-4xl text-gray-400" />
            <p className="text-sm text-gray-500">Kéo thả ảnh hoặc click để chọn</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP • Tối đa {MAX_SIZE_MB}MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}