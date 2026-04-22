export default function RecipeCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* Ảnh skeleton */}
      <div className="aspect-square w-full bg-gray-200 animate-pulse" />

      {/* Thông tin skeleton */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="flex justify-between pt-1">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
        </div>
      </div>
    </div>
  );
}