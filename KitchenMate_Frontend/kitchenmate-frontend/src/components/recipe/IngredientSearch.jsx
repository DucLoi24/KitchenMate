// KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/IngredientSearch.jsx
import { useState, useRef, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
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

const statusColors = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const CATEGORIES = [
  { value: 'PROTEIN', label: 'Đạm' },
  { value: 'CARB', label: 'Tinh bột' },
  { value: 'VEG', label: 'Rau củ' },
  { value: 'SPICE', label: 'Gia vị' },
  { value: 'STAPLE', label: 'Gia vị cơ bản' },
  { value: 'OTHER', label: 'Khác' },
];

export default function IngredientSearch({ onSelect }) {
  const { query, setQuery, results, isLoading } = useIngredientSearch();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showContribute, setShowContribute] = useState(false);
  const [contributeName, setContributeName] = useState('');
  const [contributeCategory, setContributeCategory] = useState('OTHER');
  const [contributeLoading, setContributeLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        setShowContribute(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (ingredient) => {
    // Don't allow selecting REJECTED ingredients
    if (ingredient.status === 'REJECTED') {
      return;
    }
    onSelect(ingredient);
    setQuery('');
    setShowDropdown(false);
    setShowContribute(false);
  };

  const handleContribute = async () => {
    if (!contributeName.trim()) return;
    setContributeLoading(true);
    try {
      await recipeApi.contributeIngredient(contributeName.trim(), contributeCategory);
      toast.success('Đã gửi nguyên liệu để duyệt. Cảm ơn bạn!');
      setShowContribute(false);
      setContributeName('');
      setContributeCategory('OTHER');
      setQuery('');
    } catch (err) {
      toast.error('Không thể gửi đóng góp. Thử lại sau.');
    } finally {
      setContributeLoading(false);
    }
  };

  const showEmpty = query.length >= 2 && results.length === 0 && !isLoading;

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
            <div className="px-4 py-3">
              <p className="text-sm text-gray-500 mb-2">Không tìm thấy nguyên liệu</p>
              {!showContribute && (
                <button
                  onClick={() => setShowContribute(true)}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  + Đóng góp nguyên liệu mới
                </button>
              )}
              {showContribute && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">✨ Đóng góp nguyên liệu mới</p>
                  <input
                    type="text"
                    value={contributeName}
                    onChange={(e) => setContributeName(e.target.value)}
                    placeholder="Tên nguyên liệu"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  />
                  <select
                    value={contributeCategory}
                    onChange={(e) => setContributeCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowContribute(false)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={handleContribute}
                      disabled={contributeLoading || !contributeName.trim()}
                      className="flex-1 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                      {contributeLoading ? 'Đang gửi...' : 'Gửi đóng góp'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            results.map((ing) => (
              <button
                key={ing.id}
                onClick={() => handleSelect(ing)}
                disabled={ing.status === 'REJECTED'}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between gap-2 ${
                  ing.status === 'REJECTED' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span className="text-sm font-medium text-gray-900 truncate">{ing.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {ing.status === 'PENDING' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[ing.status]}`}>
                      ⏳ Chờ duyệt
                    </span>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColors[ing.category] || categoryColors.OTHER}`}>
                    {ing.category}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}