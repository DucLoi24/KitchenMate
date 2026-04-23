// KitchenMate_Frontend/kitchenmate-frontend/src/components/explore/SearchBar.jsx
import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';

export default function SearchBar({ value, onChange }) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  return (
    <div className="relative">
      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        aria-label="Tìm kiếm công thức"
        placeholder="Tìm kiếm công thức..."
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
      />
    </div>
  );
}