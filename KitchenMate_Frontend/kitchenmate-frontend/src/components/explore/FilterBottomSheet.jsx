// KitchenMate_Frontend/kitchenmate-frontend/src/components/explore/FilterBottomSheet.jsx
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { FaFilter, FaTimes, FaClock, FaFire } from 'react-icons/fa';
import IngredientAutocomplete from './IngredientAutocomplete';

const DIFFICULTIES = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
];

const TIME_OPTIONS = [
  { value: 15, label: 'Dưới 15 phút' },
  { value: 30, label: '15-30 phút' },
  { value: 60, label: '30-60 phút' },
  { value: 120, label: 'Trên 60 phút' },
];

export default function FilterBottomSheet({ isOpen, onClose, filters, onChange }) {
  const { difficulty, prep_time_max, ingredient } = filters;

  const handleDifficultyChange = (value) => {
    onChange({ ...filters, difficulty: difficulty === value ? null : value });
  };

  const handleTimeChange = (value) => {
    onChange({ ...filters, prep_time_max: prep_time_max === value ? null : value });
  };

  const handleIngredientsChange = (newIngredients) => {
    onChange({ ...filters, ingredient: newIngredients });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="md:hidden relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-end">
        <DialogPanel className="w-full rounded-t-2xl bg-white p-5 pb-8 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaFilter className="text-orange-500" />
              Bộ lọc
            </DialogTitle>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <FaTimes className="text-gray-500" size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaFire className="text-orange-500" size={14} />
                Độ khó
              </h3>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleDifficultyChange(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      difficulty === opt.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaClock className="text-orange-500" size={14} />
                Thời gian
              </h3>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleTimeChange(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      prep_time_max === opt.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Nguyên liệu</h3>
              <IngredientAutocomplete
                selectedIngredients={ingredient || []}
                onChange={handleIngredientsChange}
              />
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
