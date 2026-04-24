// KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListAddBottomSheet.jsx
import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

export function ShoppingListAddBottomSheet({ onAdd, isAdding, isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query || !isOpen) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/ingredients/search/?q=${encodeURIComponent(query)}`);
        setSuggestions(res.data?.data?.results || res.data?.data || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, isOpen]);

  const handleSelect = (ingredient) => {
    setSelectedIngredient(ingredient);
    setQuery(ingredient.name);
    setUnit(ingredient.default_unit || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedIngredient || !quantity || !unit) return;
    onAdd({ ingredient: selectedIngredient.id, quantity: parseFloat(quantity), unit });
    setQuery('');
    setSelectedIngredient(null);
    setQuantity('');
    setUnit('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-4 pb-6 max-h-[80vh] overflow-auto">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thêm nguyên liệu</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Autocomplete */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIngredient(null); }}
              placeholder="Tìm nguyên liệu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-auto">
                {suggestions.map((ing) => (
                  <li
                    key={ing.id}
                    onClick={() => handleSelect(ing)}
                    className="px-3 py-2 hover:bg-primary-50 cursor-pointer text-gray-900"
                  >
                    {ing.name}
                    <span className="ml-2 text-xs text-gray-500">{ing.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Số lượng"
              min="0"
              step="any"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Đơn vị"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isAdding || !selectedIngredient}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
          >
            {isAdding ? 'Đang thêm...' : 'Thêm'}
          </button>
        </form>
      </div>
    </div>
  );
}