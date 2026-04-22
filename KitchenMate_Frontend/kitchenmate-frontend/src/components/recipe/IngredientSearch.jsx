// KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/IngredientSearch.jsx
import { useState, useRef, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useIngredientSearch } from '../../hooks/useIngredientSearch';
import { recipeApi } from '../../api/recipeApi';

const categoryColors = {
  PROTEIN: 'bg-red-100 text-red-700',
  CARB: 'bg-yellow-100 text-yellow-700',
  VEG: 'bg-green-100 text-green-700',
  SPICE: 'bg-orange-100 text-orange-700',
  STAPLE: 'bg-blue-100 text-blue-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function IngredientSearch({ onSelect }) {
  const { query, setQuery, results, isLoading } = useIngredientSearch();
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (ingredient) => {
    onSelect(ingredient);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder="Tìm nguyên liệu..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400 text-sm"
        />
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Đang tìm...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy nguyên liệu</div>
          ) : (
            results.map((ing) => (
              <button
                key={ing.id}
                onClick={() => handleSelect(ing)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <span className="text-sm font-medium text-gray-900">{ing.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColors[ing.category] || categoryColors.OTHER}`}>
                  {ing.category}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
