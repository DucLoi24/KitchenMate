import React from 'react';

export function ShoppingListSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm animate-pulse">
          <div className="w-5 h-5 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}
