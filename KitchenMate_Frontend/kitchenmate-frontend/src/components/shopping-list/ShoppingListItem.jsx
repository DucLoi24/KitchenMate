// KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListItem.jsx
import React, { useState, useEffect } from 'react';

export function ShoppingListItem({
  item,
  onMarkPurchased,
  onMarkUnpurchased,
  onDelete,
  isMarkingPurchased,
  isUnmarking,
}) {
  const [showActions, setShowActions] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const isPurchased = item.is_purchased;

  // Detect if device supports touch
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
  }, []);

  // Touch handlers for swipe-to-delete on mobile
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStartX - currentX;
    // Swipe left more than 80px reveals delete button
    if (diff > 80) {
      setShowActions(true);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  // On mobile (touch device), show delete button always for unpurchased items
  // On desktop, show on hover (showActions)
  const showDeleteButton = isTouchDevice ? true : showActions;

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm transition-all duration-200 ${
        isPurchased ? 'opacity-70' : ''
      }`}
      onMouseEnter={() => !isTouchDevice && setShowActions(true)}
      onMouseLeave={() => !isTouchDevice && setShowActions(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isPurchased}
        onChange={() =>
          isPurchased
            ? onMarkUnpurchased(item.id)
            : onMarkPurchased(item.id)
        }
        disabled={isMarkingPurchased || isUnmarking}
        className="w-5 h-5 text-primary-600 rounded-full border-gray-300 focus:ring-primary-500 flex-shrink-0"
      />

      {/* Thông tin */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-gray-900 font-medium truncate transition-all duration-200 ${
            isPurchased ? 'line-through text-gray-500' : ''
          }`}
        >
          {item.ingredient_name}
        </p>
        <p className="text-sm text-gray-500">
          {item.quantity} {item.unit}
        </p>
      </div>

      {/* Actions - hiện trên desktop khi hover, trên mobile luôn hiển thị */}
      {showDeleteButton && !isPurchased && (
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Xóa"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {/* Purchased actions - always show for purchased items */}
      {isPurchased && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMarkUnpurchased(item.id)}
            disabled={isUnmarking}
            className="px-2 py-1 text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {isUnmarking ? '...' : 'Hoàn tác'}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Xóa"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
