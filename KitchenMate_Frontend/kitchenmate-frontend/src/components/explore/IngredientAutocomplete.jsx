// KitchenMate_Frontend/kitchenmate-frontend/src/components/explore/IngredientAutocomplete.jsx
import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes } from 'react-icons/io';
import { recipeApi } from '../../api/recipeApi';

export default function IngredientAutocomplete({ selectedIngredients, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await recipeApi.searchIngredients(query);
        setResults(Array.isArray(data) ? data : []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (ingredient) => {
    if (!selectedIngredients.find(i => i.id === ingredient.id)) {
      onChange([...selectedIngredients, { id: ingredient.id, name: ingredient.name }]);
    }
    setQuery('');
    setShowDropdown(false);
  };

  const handleRemove = (id) => {
    onChange(selectedIngredients.filter(i => i.id !== id));
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selectedIngredients.map(ing => (
          <span key={ing.id} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
            {ing.name}
            <button type="button" onClick={() => handleRemove(ing.id)} className="hover:text-orange-900">
              <FaTimes size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder="Tìm nguyên liệu..."
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
        />
      </div>
      {showDropdown && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map(ing => (
            <li key={ing.id}>
              <button
                type="button"
                onClick={() => handleSelect(ing)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors"
              >
                {ing.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
