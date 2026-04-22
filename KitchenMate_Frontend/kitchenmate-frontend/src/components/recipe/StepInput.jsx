// KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/StepInput.jsx
import { useState } from 'react';
import { FaTrash, FaImage } from 'react-icons/fa';

function StepMediaUpload({ onFileSelect, currentFile }) {
  const [preview, setPreview] = useState(currentFile ? URL.createObjectURL(currentFile) : null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onFileSelect(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setPreview(null);
    onFileSelect(null);
  };

  if (preview) {
    return (
      <div className="mt-2">
        <img src={preview} alt="Step media preview" className="w-full h-24 object-cover rounded-lg" />
        <button
          type="button"
          onClick={clearMedia}
          className="mt-1 text-xs text-red-500 hover:text-red-700"
        >
          Xóa ảnh
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-orange-600 transition-colors">
        <FaImage size={14} />
        <span>Thêm ảnh minh họa</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
        />
      </label>
    </div>
  );
}

export default function StepInput({ step, onUpdate, onRemove, stepNumber }) {
  const [showMedia, setShowMedia] = useState(!!step.mediaFile);

  const handleInstructionChange = (e) => {
    onUpdate({ ...step, instruction: e.target.value });
  };

  const handleMediaSelect = (file) => {
    onUpdate({ ...step, mediaFile: file });
  };

  const toggleMedia = () => {
    if (showMedia) {
      // Clear media when hiding
      onUpdate({ ...step, mediaFile: null });
    }
    setShowMedia(!showMedia);
  };

  const displayedStepNumber = stepNumber || step.step_number;

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold shrink-0 mt-1">
        {displayedStepNumber}
      </div>
      <div className="flex-1">
        <textarea
          value={step.instruction}
          onChange={handleInstructionChange}
          rows={2}
          placeholder="Mô tả bước này..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
        />

        {/* Media toggle */}
        <div className="mt-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showMedia}
              onChange={toggleMedia}
              className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
            />
            <FaImage size={14} />
            Thêm ảnh/video minh họa
          </label>

          {showMedia && (
            <StepMediaUpload
              onFileSelect={handleMediaSelect}
              currentFile={step.mediaFile}
            />
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Xóa bước"
        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors mt-1"
      >
        <FaTrash size={14} />
      </button>
    </div>
  );
}