// KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/StepInput.jsx
import { FaTrash } from 'react-icons/fa';

export default function StepInput({ step, onUpdate, onRemove }) {
  const handleInstructionChange = (e) => {
    onUpdate({ ...step, instruction: e.target.value });
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold shrink-0 mt-1">
        {step.step_number}
      </div>
      <div className="flex-1">
        <textarea
          value={step.instruction}
          onChange={handleInstructionChange}
          rows={2}
          placeholder="Mô tả bước này..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
        />
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
