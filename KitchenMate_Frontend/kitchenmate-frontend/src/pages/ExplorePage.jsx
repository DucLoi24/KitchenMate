// KitchenMate_Frontend/kitchenmate-frontend/src/pages/ExplorePage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaFilter, FaSpinner, FaChevronLeft, FaChevronRight, FaExclamationCircle, FaSearch } from 'react-icons/fa';
import SearchBar from '../components/explore/SearchBar';
import FilterSidebar from '../components/explore/FilterSidebar';
import FilterBottomSheet from '../components/explore/FilterBottomSheet';
import RecipeCard from '../components/recipe/RecipeCard';
import RecipeCardSkeleton from '../components/recipe/RecipeCardSkeleton';
import { useRecipesFiltered } from '../hooks/useRecipesFiltered';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Parse filters from URL - ingredient stored as array of {id, name} objects for IngredientAutocomplete display
  const filters = {
    search: searchParams.get('q') || '',
    difficulty: searchParams.get('difficulty') || null,
    prep_time_max: searchParams.get('prep_time_max') ? parseInt(searchParams.get('prep_time_max')) : null,
    ingredient: searchParams.get('ingredient')?.split(',').filter(Boolean).map(id => ({ id: parseInt(id), name: '' })) || [],
  };
  const page = parseInt(searchParams.get('page') || '1');

  const { data, isLoading, error, refetch } = useRecipesFiltered({ ...filters, page });

  const updateFilter = (newFilters) => {
    setSearchParams(prev => {
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          prev.delete(key);
        } else if (Array.isArray(value) && value.length === 0) {
          prev.delete(key);
        } else if (key === 'ingredient') {
          // ingredient is array of {id, name} - store ids only in URL
          prev.set(key, value.map(i => i.id).join(','));
        } else {
          prev.set(key, value);
        }
      });
      return prev;
    }, { replace: false });
  };

  const handleSearchChange = (value) => {
    setSearchParams(prev => {
      if (value) {
        prev.set('q', value);
      } else {
        prev.delete('q');
      }
      prev.delete('page');
      return prev;
    }, { replace: true });
  };

  const handlePageChange = (newPage) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    }, { replace: false });
  };

  const results = data?.data?.results || data?.data || [];
  const totalPages = data?.data?.total_pages || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="bg-white border-b border-gray-100 sticky top-[64px] z-30 px-4 py-3">
        <div className="max-w-6xl mx-auto flex gap-3 items-center">
          <div className="flex-1">
            <SearchBar value={filters.search} onChange={handleSearchChange} />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FaFilter size={16} />
            <span className="text-sm font-medium">Bộ lọc</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop FilterSidebar */}
          <FilterSidebar filters={filters} onChange={updateFilter} />

          {/* Main content */}
          <main className="flex-1">
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <RecipeCardSkeleton key={i} />
                ))}
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FaExclamationCircle className="text-red-400 mb-3" size={40} />
                <p className="text-gray-600 mb-3">Không thể tải công thức</p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            )}

            {!isLoading && !error && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
                <FaSearch className="text-gray-300 mb-3" size={48} />
                <p className="text-lg font-medium text-gray-700">Không tìm thấy kết quả</p>
                <p className="text-gray-500 mt-1">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            )}

            {!isLoading && !error && results.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-medium">
                      Trang {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile FilterBottomSheet */}
      <FilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onChange={updateFilter}
      />
    </div>
  );
}
