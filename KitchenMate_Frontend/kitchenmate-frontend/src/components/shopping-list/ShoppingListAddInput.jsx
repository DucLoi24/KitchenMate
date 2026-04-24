// KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListAddInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

export function ShoppingListAddInput({ onAdd, isAdding }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/ingredients/search/?q=${encodeURIComponent(query)}`);
        setSuggestions(res.data?.data?.results || res.data?.data || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (ingredient) => {
    setSelectedIngredient(ingredient);
    setQuery(ingredient.name);
    setShowSuggestions(false);
    setUnit(ingredient.default_unit || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedIngredient || !quantity || !unit) return;
    onAdd({
      ingredient: selectedIngredient.id,
      quantity: parseFloat(quantity),
      unit,
    });
    setQuery('');
    setSelectedIngredient(null);
    setQuantity('');
    setUnit('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 bg-white rounded-lg shadow-sm">
      {/* Autocomplete input */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIngredient(null);
          }}
          onFocus={() => query && setShowSuggestions(true)}
          placeholder="Tìm nguyên liệu..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
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

      {/* Số lượng */}
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="SL"
        min="0"
        step="any"
        className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        required
      />

      {/* Đơn vị */}
      <input
        type="text"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        placeholder="Đơn vị"
        className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        required
      />

      {/* Nút thêm */}
      <button
        type="submit"
        disabled={isAdding || !selectedIngredient}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {isAdding ? '...' : '+'}
      </button>
    </form>
  );
}
