import React from 'react';

export function ShoppingListEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Danh sách đi chợ trống</h3>
      <p className="text-gray-500 text-center">Thêm nguyên liệu cần mua từ trang công thức hoặc tủ lạnh số</p>
    </div>
  );
}
