import { useRecipesNewest } from '../../hooks/useRecipesNewest';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import RecipeCard from '../recipe/RecipeCard';
import RecipeCardSkeleton from '../recipe/RecipeCardSkeleton';

export default function NewestSection() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useRecipesNewest();

  const recipes = data?.pages.flatMap((page) => page.data) || [];

  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, { enabled: hasNextPage && !isFetchingNextPage });

  return (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Công thức mới nhất
        </h2>

        {/* Grid 4 columns desktop, 2 tablet, 1 mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            // Skeleton loading - 8 items
            Array.from({ length: 8 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))
          ) : isError ? (
            <p className="col-span-full text-center text-red-500 py-8">
              Đã xảy ra lỗi khi tải công thức
            </p>
          ) : recipes.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-8">
              Chưa có công thức nào
            </p>
          ) : (
            <>
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
              {/* Sentinel element for infinite scroll */}
              <div ref={sentinelRef} className="h-4" />
            </>
          )}
        </div>

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải thêm...</span>
            </div>
          </div>
        )}

        {/* End of list */}
        {!hasNextPage && recipes.length > 0 && (
          <p className="text-center text-gray-400 py-4">
            Không còn công thức nào
          </p>
        )}
      </div>
    </section>
  );
}