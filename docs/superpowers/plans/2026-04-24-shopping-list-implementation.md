# Phase 7.2 — Shopping List Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng trang `/shopping-list` — danh sách nguyên liệu cần mua, mark purchased để sync vào pantry, hoàn tác mark để trừ khỏi pantry.

**Architecture:** Frontend mới hoàn toàn (không có shopping list code trước đó), theo pattern của Pantry. Backend cần thêm `mark-unpurchased` action. UI phân chia section "Cần mua" / "Đã mua", responsive desktop/mobile.

**Tech Stack:** React Query v5, React Hot Toast, Tailwind CSS, Django REST Framework (backend)

---

## File Structure

### Backend (modify)
```
KitchenMate_Backend/apps/kitchen/views.py     # Add mark-unpurchased action
KitchenMate_Backend/apps/kitchen/tests.py     # Add tests for mark-unpurchased
```

### Frontend (create)
```
KitchenMate_Frontend/kitchenmate-frontend/src/api/shoppingListApi.js
KitchenMate_Frontend/kitchenmate-frontend/src/hooks/useShoppingList.js
KitchenMate_Frontend/kitchenmate-frontend/src/pages/ShoppingListPage.jsx
KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListItem.jsx
KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListAddInput.jsx
KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListAddBottomSheet.jsx
KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListEmptyState.jsx
KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListSkeleton.jsx
```

### Frontend (modify)
```
KitchenMate_Frontend/kitchenmate-frontend/src/routes/index.jsx    # Add /shopping-list route
```

---

## Backend Tasks

### Task 1: Add `mark-unpurchased` action to `ShoppingListViewSet`

**Files:**
- Modify: `KitchenMate_Backend/apps/kitchen/views.py:159-203` (add after `mark_purchased`)

- [ ] **Step 1: Add `mark-unpurchased` action**

Insert after `mark_purchased` action (around line 203):

```python
@action(detail=True, methods=['post'], url_path='mark-unpurchased')
def mark_unpurchased(self, request, pk=None):
    """
    Bỏ đánh dấu đã mua — trừ quantity khỏi Pantry và đặt is_purchased=False.

    Endpoint: POST /api/kitchen/shopping-list/{id}/mark-unpurchased/
    Permission: IsOwner

    Atomic Transaction (3 bước):
        Bước 1: Đặt is_purchased=False cho ShoppingList item.
        Bước 2: Tìm Pantry item tương ứng (user + ingredient).
        Bước 3: Trừ quantity đã mua từ Pantry item.
                Nếu Pantry quantity ≤ 0 sau khi trừ → xóa Pantry item.

    Returns:
        200: Thành công — trả về dữ liệu Pantry item còn lại (hoặc null nếu đã xóa).
        403: Không phải owner của item.
        404: Item không tồn tại.
        500: Lỗi trong transaction.
    """
    item = self.get_object()
    try:
        with transaction.atomic():
            item.is_purchased = False
            item.save(update_fields=['is_purchased'])

            pantry_item = Pantry.objects.filter(
                user=request.user, ingredient=item.ingredient
            ).first()

            if pantry_item:
                pantry_item.quantity -= item.quantity
                if pantry_item.quantity <= 0:
                    pantry_item.delete()
                else:
                    pantry_item.save(update_fields=['quantity', 'updated_at'])
                from .serializers import PantrySerializer as PS
                return Response({
                    'success': True,
                    'message': 'Da bo danh dau da mua.',
                    'data': PS(pantry_item).data if pantry_item.quantity > 0 else None
                })
            else:
                return Response({
                    'success': True,
                    'message': 'Da bo danh dau da mua (khong co trong tu lanh).',
                    'data': None
                })
    except Exception as e:
        return Response(
            {'success': False, 'error': {'message': 'Co loi xay ra khi xu ly giao dich. Vui long thu lai.'}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

- [ ] **Step 2: Register IsOwner permission for mark-unpurchased**

In `get_permissions` method (around line 123), add `'mark_unpurchased'` to the destroy/mark_purchased condition:

```python
def get_permissions(self):
    if self.action in ('destroy', 'mark_purchased', 'mark_unpurchased'):
        return [IsOwner()]
    return [IsAuthenticated()]
```

- [ ] **Step 3: Commit**

```bash
git add KitchenMate_Backend/apps/kitchen/views.py
git commit -m "feat(backend): add mark-unpurchased action for shopping list"
```

---

### Task 2: Add tests for `mark-unpurchased`

**Files:**
- Modify: `KitchenMate_Backend/apps/kitchen/tests.py` (add new test class)

- [ ] **Step 1: Write failing tests**

Add at end of `tests.py`:

```python
class MarkUnpurchasedPropertyTest(HypothesisTestCase):
    """Property 14: mark_unpurchased dat is_purchased=False va tru quantity khoi Pantry."""

    @given(
        shopping_qty=st.floats(min_value=0.1, max_value=100.0, allow_nan=False, allow_infinity=False),
        existing_qty=st.floats(min_value=0.5, max_value=100.0, allow_nan=False, allow_infinity=False),
    )
    @settings(max_examples=20)
    def test_mark_unpurchased_subtracts_quantity(self, shopping_qty, existing_qty):
        """
        Sau mark_unpurchased:
        - ShoppingList item co is_purchased=False
        - Pantry item co quantity = existing_qty - shopping_qty (hoac da xoa neu <= 0)
        """
        user = make_user()
        ingredient = make_ingredient()
        client = APIClient()
        client.force_authenticate(user=user)

        # Tao pantry item truoc
        make_pantry(user, ingredient, quantity=existing_qty, unit='kg')

        # Tao va mark purchased shopping item
        shopping_item = make_shopping_item(user, ingredient, quantity=shopping_qty, unit='kg')
        client.post(f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-purchased/')

        # Unmark
        response = client.post(f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-unpurchased/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])

        # Kiem tra is_purchased
        shopping_item.refresh_from_db()
        self.assertFalse(shopping_item.is_purchased)

        # Kiem tra quantity trong Pantry
        remaining = existing_qty - shopping_qty
        if remaining > 0:
            pantry = Pantry.objects.get(user=user, ingredient=ingredient)
            self.assertAlmostEqual(pantry.quantity, remaining, places=5)
        else:
            self.assertFalse(Pantry.objects.filter(user=user, ingredient=ingredient).exists())

    @given(st.just(None))
    @settings(max_examples=10, deadline=None)
    def test_mark_unpurchased_deletes_pantry_if_quantity_zero(self, _):
        """Neu quantity sau khi tru <= 0, Pantry item phai bi xoa."""
        user = make_user()
        ingredient = make_ingredient()
        client = APIClient()
        client.force_authenticate(user=user)

        # Tao pantry = 2.0, shopping item = 2.0 → sau unmark quantity = 0
        make_pantry(user, ingredient, quantity=2.0, unit='kg')
        shopping_item = make_shopping_item(user, ingredient, quantity=2.0, unit='kg')
        client.post(f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-purchased/')

        response = client.post(f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-unpurchased/')
        self.assertEqual(response.status_code, 200)

        shopping_item.refresh_from_db()
        self.assertFalse(shopping_item.is_purchased)
        self.assertFalse(Pantry.objects.filter(user=user, ingredient=ingredient).exists())


class MarkUnpurchasedRollbackTest(TestCase):
    """Kiem tra rollback khi mark_unpurchased that bai."""

    def setUp(self):
        email = f'user_{uuid.uuid4().hex[:8]}@test.com'
        self.user = User.objects.create_user(
            username=email, email=email, full_name='Test', password='pass123'
        )
        self.ingredient = Ingredient.objects.create(
            name=f'ing_{uuid.uuid4().hex[:8]}', status='APPROVED', category='OTHER'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_rollback_on_pantry_error(self):
        """Neu Pantry operation that bai, ShoppingList.is_purchased phai van la True."""
        # Setup: tao pantry + shopping item da purchased
        pantry = Pantry.objects.create(
            user=self.user, ingredient=self.ingredient, quantity=5.0, unit='kg'
        )
        shopping_item = ShoppingList.objects.create(
            user=self.user, ingredient=self.ingredient, quantity=3.0, unit='kg',
            is_purchased=True
        )

        # Mock de subtract loi
        with patch.object(Pantry.objects, 'filter', side_effect=Exception('DB error')):
            response = self.client.post(
                f'/api/kitchen/shopping-list/{shopping_item.pk}/mark-unpurchased/'
            )

        self.assertEqual(response.status_code, 500)
        shopping_item.refresh_from_db()
        self.assertTrue(shopping_item.is_purchased)  # Rollback ve True
```

- [ ] **Step 2: Run tests**

```bash
cd KitchenMate_Backend && pytest apps/kitchen/tests.py::MarkUnpurchasedPropertyTest -v
cd KitchenMate_Backend && pytest apps/kitchen/tests.py::MarkUnpurchasedRollbackTest -v
```

- [ ] **Step 3: Commit**

```bash
git add KitchenMate_Backend/apps/kitchen/tests.py
git commit -m "test(backend): add tests for mark-unpurchased action"
```

---

## Frontend Tasks

### Task 3: Create `src/api/shoppingListApi.js`

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/api/shoppingListApi.js`

- [ ] **Step 1: Create API file**

```js
// KitchenMate_Frontend/kitchenmate-frontend/src/api/shoppingListApi.js
import axiosInstance from './axiosInstance';

export const shoppingListApi = {
  getShoppingList: async () => {
    const response = await axiosInstance.get('/kitchen/shopping-list/');
    return response.data;
  },

  addShoppingListItem: async (data) => {
    // data: { ingredient: int, quantity: float, unit: string }
    const response = await axiosInstance.post('/kitchen/shopping-list/', data);
    return response.data;
  },

  deleteShoppingListItem: async (id) => {
    const response = await axiosInstance.delete(`/kitchen/shopping-list/${id}/`);
    return response.data;
  },

  markPurchased: async (id) => {
    // POST /api/kitchen/shopping-list/{id}/mark-purchased/
    const response = await axiosInstance.post(`/kitchen/shopping-list/${id}/mark-purchased/`);
    return response.data;
  },

  markUnpurchased: async (id) => {
    // POST /api/kitchen/shopping-list/{id}/mark-unpurchased/
    const response = await axiosInstance.post(`/kitchen/shopping-list/${id}/mark-unpurchased/`);
    return response.data;
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add KitchenMate_Frontend/kitchenmate-frontend/src/api/shoppingListApi.js
git commit -m "feat(frontend): add shoppingListApi for Phase 7.2"
```

---

### Task 4: Create `src/hooks/useShoppingList.js`

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/hooks/useShoppingList.js`

- [ ] **Step 1: Create hook file**

```js
// KitchenMate_Frontend/kitchenmate-frontend/src/hooks/useShoppingList.js
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shoppingListApi } from '../api/shoppingListApi';
import toast from 'react-hot-toast';

export function useShoppingList() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shopping-list'],
    queryFn: shoppingListApi.getShoppingList,
  });

  // Group items into purchased / unpurchased
  const groupedItems = React.useMemo(() => {
    const items = data?.data?.results || data?.data || [];
    return {
      unpurchased: items.filter(item => !item.is_purchased),
      purchased: items.filter(item => item.is_purchased),
    };
  }, [data]);

  const addMutation = useMutation({
    mutationFn: shoppingListApi.addShoppingListItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      toast.success(data?.message || 'Đã thêm vào danh sách đi chợ');
    },
    onError: () => toast.error('Không thể thêm vào danh sách đi chợ'),
  });

  const deleteMutation = useMutation({
    mutationFn: shoppingListApi.deleteShoppingListItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      toast.success('Đã xóa khỏi danh sách');
    },
    onError: () => toast.error('Không thể xóa'),
  });

  const markPurchasedMutation = useMutation({
    mutationFn: shoppingListApi.markPurchased,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
      toast.success(data?.message || 'Đã thêm vào tủ lạnh');
    },
    onError: () => toast.error('Không thể đánh dấu đã mua'),
  });

  const markUnpurchasedMutation = useMutation({
    mutationFn: shoppingListApi.markUnpurchased,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
      toast.success(data?.message || 'Đã bỏ khỏi tủ lạnh');
    },
    onError: () => toast.error('Không thể hoàn tác'),
  });

  return {
    groupedItems,
    isLoading,
    error,
    refetch,
    addItem: addMutation.mutate,
    deleteItem: deleteMutation.mutate,
    markPurchased: markPurchasedMutation.mutate,
    markUnpurchased: markUnpurchasedMutation.mutate,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMarkingPurchased: markPurchasedMutation.isPending,
    isUnmarking: markUnpurchasedMutation.isPending,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add KitchenMate_Frontend/kitchenmate-frontend/src/hooks/useShoppingList.js
git commit -m "feat(frontend): add useShoppingList hook for Phase 7.2"
```

---

### Task 5: Create `src/components/shopping-list/ShoppingListItem.jsx`

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListItem.jsx`

- [ ] **Step 1: Create component**

```jsx
// KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListItem.jsx
import React, { useState } from 'react';

export function ShoppingListItem({
  item,
  onMarkPurchased,
  onMarkUnpurchased,
  onDelete,
  isMarkingPurchased,
  isUnmarking,
}) {
  const [showActions, setShowActions] = useState(false);
  const isPurchased = item.is_purchased;

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm transition-all duration-200 ${
        isPurchased ? 'opacity-70' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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

      {/* Actions - hiện trên desktop khi hover */}
      {showActions && !isPurchased && (
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
```

- [ ] **Step 2: Commit**

```bash
git add KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListItem.jsx
git commit -m "feat(frontend): add ShoppingListItem component for Phase 7.2"
```

---

### Task 6: Create `src/components/shopping-list/ShoppingListAddInput.jsx`

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListAddInput.jsx`

- [ ] **Step 1: Create component**

```jsx
// KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListAddInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

export function ShoppingListAddInput({ onAdd, isAdding }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/ingredients/search/?q=${encodeURIComponent(query)}`);
        setSuggestions(res.data?.data?.results || res.data?.data || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (ingredient) => {
    setSelectedIngredient(ingredient);
    setQuery(ingredient.name);
    setShowSuggestions(false);
    setUnit(ingredient.default_unit || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedIngredient || !quantity || !unit) return;
    onAdd({
      ingredient: selectedIngredient.id,
      quantity: parseFloat(quantity),
      unit,
    });
    setQuery('');
    setSelectedIngredient(null);
    setQuantity('');
    setUnit('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 bg-white rounded-lg shadow-sm">
      {/* Autocomplete input */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIngredient(null);
          }}
          onFocus={() => query && setShowSuggestions(true)}
          placeholder="Tìm nguyên liệu..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
            {suggestions.map((ing) => (
              <li
                key={ing.id}
                onClick={() => handleSelect(ing)}
                className="px-3 py-2 hover:bg-primary-50 cursor-pointer text-gray-900"
              >
                {ing.name}
                <span className="ml-2 text-xs text-gray-500">{ing.category}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Số lượng */}
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="SL"
        min="0"
        step="any"
        className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        required
      />

      {/* Đơn vị */}
      <input
        type="text"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        placeholder="Đơn vị"
        className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        required
      />

      {/* Nút thêm */}
      <button
        type="submit"
        disabled={isAdding || !selectedIngredient}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {isAdding ? '...' : '+'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListAddInput.jsx
git commit -m "feat(frontend): add ShoppingListAddInput component for Phase 7.2"
```

---

### Task 7: Create `src/components/shopping-list/ShoppingListAddBottomSheet.jsx`

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListAddBottomSheet.jsx`

- [ ] **Step 1: Create component**

```jsx
// KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListAddBottomSheet.jsx
import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

export function ShoppingListAddBottomSheet({ onAdd, isAdding, isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query || !isOpen) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/ingredients/search/?q=${encodeURIComponent(query)}`);
        setSuggestions(res.data?.data?.results || res.data?.data || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, isOpen]);

  const handleSelect = (ingredient) => {
    setSelectedIngredient(ingredient);
    setQuery(ingredient.name);
    setUnit(ingredient.default_unit || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedIngredient || !quantity || !unit) return;
    onAdd({ ingredient: selectedIngredient.id, quantity: parseFloat(quantity), unit });
    setQuery('');
    setSelectedIngredient(null);
    setQuantity('');
    setUnit('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-4 pb-6 max-h-[80vh] overflow-auto">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thêm nguyên liệu</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Autocomplete */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIngredient(null); }}
              placeholder="Tìm nguyên liệu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-auto">
                {suggestions.map((ing) => (
                  <li
                    key={ing.id}
                    onClick={() => handleSelect(ing)}
                    className="px-3 py-2 hover:bg-primary-50 cursor-pointer text-gray-900"
                  >
                    {ing.name}
                    <span className="ml-2 text-xs text-gray-500">{ing.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Số lượng"
              min="0"
              step="any"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Đơn vị"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isAdding || !selectedIngredient}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
          >
            {isAdding ? 'Đang thêm...' : 'Thêm'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListAddBottomSheet.jsx
git commit -m "feat(frontend): add ShoppingListAddBottomSheet for Phase 7.2"
```

---

### Task 8: Create `src/components/shopping-list/ShoppingListEmptyState.jsx`

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListEmptyState.jsx`

- [ ] **Step 1: Create component**

```jsx
// KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListEmptyState.jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListEmptyState.jsx
git commit -m "feat(frontend): add ShoppingListEmptyState for Phase 7.2"
```

---

### Task 9: Create `src/components/shopping-list/ShoppingListSkeleton.jsx`

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListSkeleton.jsx`

- [ ] **Step 1: Create component**

```jsx
// KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListSkeleton.jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add KitchenMate_Frontend/kitchenmate-frontend/src/components/shopping-list/ShoppingListSkeleton.jsx
git commit -m "feat(frontend): add ShoppingListSkeleton for Phase 7.2"
```

---

### Task 10: Create `src/pages/ShoppingListPage.jsx`

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/ShoppingListPage.jsx`

- [ ] **Step 1: Create page component**

```jsx
// KitchenMate_Frontend/kitchenmate-frontend/src/pages/ShoppingListPage.jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add KitchenMate_Frontend/kitchenmate-frontend/src/pages/ShoppingListPage.jsx
git commit -m "feat(frontend): add ShoppingListPage for Phase 7.2"
```

---

### Task 11: Add route to `src/routes/index.jsx`

**Files:**
- Modify: `KitchenMate_Frontend/kitchenmate-frontend/src/routes/index.jsx`

- [ ] **Step 1: Add import**

After line 23 (`import PantryPage from '../pages/PantryPage';`):

```jsx
import ShoppingListPage from '../pages/ShoppingListPage';
```

- [ ] **Step 2: Add route inside MainLayout children**

After the `/pantry` route block:

```jsx
{
  path: '/shopping-list',
  element: (
    <ProtectedRoute>
      <ShoppingListPage />
    </ProtectedRoute>
  ),
},
```

- [ ] **Step 3: Commit**

```bash
git add KitchenMate_Frontend/kitchenmate-frontend/src/routes/index.jsx
git commit -m "feat(frontend): add /shopping-list route for Phase 7.2"
```

---

## Verification

1. **Backend:** Run `pytest apps/kitchen/tests.py::MarkUnpurchasedPropertyTest -v` and `pytest apps/kitchen/tests.py::MarkUnpurchasedRollbackTest -v` — all pass
2. **Frontend:** `npm run dev` → navigate to `http://localhost:5173/shopping-list`
3. Verify empty state loads
4. Add item via desktop form → appears in "Cần mua"
5. Mobile: tap "+ Thêm nguyên liệu" → bottom sheet opens
6. Add item via bottom sheet → appears in list
7. Click checkbox "Đã mua" → item moves to "Đã mua" with strikethrough + toast
8. Check PantryPage → verify item was added
9. Click "Hoàn tác" → item moves back to "Cần mua"
10. Check PantryPage → verify item quantity was subtracted
11. Desktop: hover item → delete button appears
12. Mobile: swipe left on item → delete button revealed
13. Click "Xóa" → item removed from list
14. Click "Xóa tất cả" → all purchased items removed
15. Verify collapse toggle on "Đã mua" section
16. Test at 375px width (mobile)
