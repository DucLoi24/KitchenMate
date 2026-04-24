import React, { useState } from 'react';
import { useShoppingList } from '../hooks/useShoppingList';
import { ShoppingListItem } from '../components/shopping-list/ShoppingListItem';
import { ShoppingListAddInput } from '../components/shopping-list/ShoppingListAddInput';
import { ShoppingListAddBottomSheet } from '../components/shopping-list/ShoppingListAddBottomSheet';
import { ShoppingListEmptyState } from '../components/shopping-list/ShoppingListEmptyState';
import { ShoppingListSkeleton } from '../components/shopping-list/ShoppingListSkeleton';

export default function ShoppingListPage() {
  const {
    groupedItems,
    isLoading,
    addItem,
    deleteItem,
    markPurchased,
    markUnpurchased,
    isAdding,
    isDeleting,
    isMarkingPurchased,
    isUnmarking,
  } = useShoppingList();

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isPurchasedCollapsed, setIsPurchasedCollapsed] = useState(false);

  const hasItems = groupedItems.unpurchased.length > 0 || groupedItems.purchased.length > 0;

  const handleClearPurchased = () => {
    groupedItems.purchased.forEach((item) => deleteItem(item.id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Danh sách đi chợ</h1>
          <ShoppingListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Danh sách đi chợ</h1>

        {/* Desktop: Inline add form */}
        <div className="hidden md:block mb-4">
          <ShoppingListAddInput onAdd={addItem} isAdding={isAdding} />
        </div>

        {/* Mobile: Bottom sheet trigger */}
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="md:hidden w-full py-3 mb-4 bg-primary-600 text-white rounded-lg font-medium"
        >
          + Thêm nguyên liệu
        </button>

        {!hasItems ? (
          <ShoppingListEmptyState />
        ) : (
          <>
            {/* Cần mua */}
            {groupedItems.unpurchased.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Cần mua ({groupedItems.unpurchased.length})
                </h2>
                <div className="space-y-2">
                  {groupedItems.unpurchased.map((item) => (
                    <ShoppingListItem
                      key={item.id}
                      item={item}
                      onMarkPurchased={markPurchased}
                      onMarkUnpurchased={markUnpurchased}
                      onDelete={deleteItem}
                      isMarkingPurchased={isMarkingPurchased}
                      isUnmarking={isUnmarking}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Đã mua */}
            {groupedItems.purchased.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setIsPurchasedCollapsed(!isPurchasedCollapsed)}
                    className="flex items-center gap-1 text-sm font-semibold text-gray-500 uppercase"
                  >
                    <span>Đã mua ({groupedItems.purchased.length})</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isPurchasedCollapsed ? '-rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleClearPurchased}
                    disabled={isDeleting}
                    className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    Xóa tất cả
                  </button>
                </div>

                {!isPurchasedCollapsed && (
                  <div className="space-y-2">
                    {groupedItems.purchased.map((item) => (
                      <ShoppingListItem
                        key={item.id}
                        item={item}
                        onMarkPurchased={markPurchased}
                        onMarkUnpurchased={markUnpurchased}
                        onDelete={deleteItem}
                        isMarkingPurchased={isMarkingPurchased}
                        isUnmarking={isUnmarking}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile bottom sheet */}
      <ShoppingListAddBottomSheet
        onAdd={addItem}
        isAdding={isAdding}
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      />
    </div>
  );
}