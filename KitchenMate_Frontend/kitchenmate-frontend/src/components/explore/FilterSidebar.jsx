import { useState } from 'react';
import { FaChevronDown, FaClock, FaFire } from 'react-icons/fa';
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

function FilterSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="flex items-center gap-2 font-medium text-gray-700 text-sm">
          {Icon && <Icon className="text-orange-500" size={14} />}
          {title}
        </span>
        <FaChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={12} />
      </button>
      {isOpen && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  );
}

export default function FilterSidebar({ filters, onChange }) {
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
    <aside className="w-64 flex-shrink-0 hidden md:block">
      <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-4">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaFire className="text-orange-500" />
          Bộ lọc
        </h2>

        <FilterSection title="Độ khó" icon={FaFire}>
          {DIFFICULTIES.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={difficulty === opt.value}
                onChange={() => handleDifficultyChange(opt.value)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-600">{opt.label}</span>
            </label>
          ))}
        </FilterSection>

        <FilterSection title="Thời gian" icon={FaClock}>
          {TIME_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={prep_time_max === opt.value}
                onChange={() => handleTimeChange(opt.value)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-600">{opt.label}</span>
            </label>
          ))}
        </FilterSection>

        <FilterSection title="Nguyên liệu">
          <IngredientAutocomplete
            selectedIngredients={ingredient || []}
            onChange={handleIngredientsChange}
          />
        </FilterSection>
      </div>
    </aside>
  );
}