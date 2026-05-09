This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **KitchenMate** (3569 symbols, 5982 relationships, 104 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/KitchenMate/context` | Codebase overview, check index freshness |
| `gitnexus://repo/KitchenMate/clusters` | All functional areas |
| `gitnexus://repo/KitchenMate/processes` | All execution flows |
| `gitnexus://repo/KitchenMate/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

## Project Overview

KitchenMate là ứng dụng Web hỗ trợ quản lý nguyên liệu tủ lạnh và gợi ý món ăn thông minh tích hợp chia sẻ công thức nấu ăn.

**Backend**: Django 5.2 + Django REST Framework 3.16 + PostgreSQL + JWT + Ollama (local LLM gemma4:e2b)
**Frontend**: React + Tailwind CSS v4 + Framer Motion + GSAP + Lenis

---

## Backend Commands (KitchenMate_Backend/)

```bash
# Setup
cd KitchenMate_Backend
python -m venv venv && source venv/bin/activate  # hoặc venv\Scripts\activate trên Windows
pip install -r requirements.txt
cp .env.example .env  # rồi edit .env với SECRET_KEY, DB credentials

# Database
python manage.py migrate
python manage.py createsuperuser

# Run dev server
python manage.py runserver  # http://127.0.0.1:8000/

# Tests
pytest                          # toàn bộ test suite
pytest -m unit                  # chỉ unit tests
pytest -m integration            # chỉ integration tests
pytest -m performance            # chỉ performance tests

# API Docs (khi server đang chạy)
# Swagger UI: http://127.0.0.1:8000/api/docs/
# ReDoc: http://127.0.0.1:8000/api/redoc/
```

---

## Frontend Commands (KitchenMate_Frontend/)

```bash
# Setup (khi đã initialize)
cd KitchenMate_Frontend
npm install
npm run dev          # Vite dev server
npm run build         # Production build
npm run lint          # ESLint
npm run test          # Vitest
```

---

## Architecture

### Backend Structure (KitchenMate_Backend/)

```
apps/
├── accounts/          # User auth, JWT, profile, avatar upload
├── ingredients/       # Nguyên liệu + AI moderation (Ollama)
├── recipes/           # Công thức nấu ăn, steps, thumbnails
├── kitchen/           # Tủ lạnh số (pantry) + danh sách đi chợ (shopping-list)
├── social/            # Reviews, collections, cooksnap uploads
├── admin_panel/       # Content moderation API (approve/reject)
└── recommendations/   # Gợi ý món ăn (Tier-3 Scoring)
core/
├── settings.py        # Django settings (database, JWT, CORS, Ollama)
├── urls.py           # Root URL routing
└── exceptions.py     # Custom exception handler
```

### Frontend Structure (KitchenMate_Frontend/)

```
src/
├── api/              # axiosInstance, authApi, recipeApi, ingredientApi, kitchenApi, socialApi
├── components/       # ui/, auth/, recipe/, pantry/, shopping/, social/, admin/, layout/
├── pages/            # auth/, home/, explore/, recipe/, pantry/, shopping/, suggestion/, profile/, collections/, admin/
├── hooks/            # useAuth, useRecipes, usePantry, etc.
└── stores/           # Zustand/Jotai stores
```

---

## Critical Business Logic

### AI Content Moderation
- User tạo công thức PUBLIC → text được gửi lên Ollama local LLM (gemma4:e2b)
- Kết quả: YES (auto-approve) / NO (auto-reject) / SUSPECT (chờ manual review)
- Frontend hiển thị moderation status badge trên recipe

### Check-to-Pantry Transaction
- Khi shopping item được mark `is_purchased=True`
- Backend dùng `transaction.atomic()` để đảm bảo:
  1. ShoppingList được cập nhật
  2. Pantry item được thêm/cập nhật
- Nếu bất kỳ bước nào thất bại → toàn bộ rollback

### Food Suggestion Algorithm
1. Ignore STAPLE spices (salt, sugar, fish sauce)
2. 3-tier scoring:
   - Match Points: 20pts per matching ingredient
   - Risk Penalty: Protein -100, Carb -80, Vegetable -50, Other -25, Spice -10
   - Affinity Bonus: 50pts cho recipes đã like trước đó
3. Filter: "Nấu Ngay" = 0 missing | "Thêm Chút Nữa" = ≤2 missing + score ≥0

---

## Key Technical Constraints

- **Database**: PostgreSQL 14+ bắt buộc (không dùng SQLite)
- **Custom User Model**: `AUTH_USER_MODEL = 'accounts.User'` — không dùng default User
- **AI Moderation**: Cần Ollama đang chạy local (http://localhost:11434); nếu không có, endpoint tạo ingredient/recipe sẽ trả lỗi
- **.env**: Never commit — chứa SECRET_KEY, DB credentials, email password
- **Media files**: Development dùng local storage (MEDIA_ROOT); production nên dùng S3 (USE_S3=True)

---

## Code Quality Principles

### Extensibility (Tính mở rộng)
- Thiết kế module có thể mở rộng: các app Django nên được tách biệt theo domain (accounts, recipes, kitchen, etc.)
- Sử dụng abstract base classes và inheritance khi hợp lý
- Tránh hardcoded values — dùng constants hoặc settings

### Maintainability (Tính bảo trì)
- Viết code có thể đọc hiểu: đặt tên biến/hàm rõ ràng, không viết tắt
- Tuân thủ Django/DRF conventions đã có trong codebase
- Viết docstrings cho các hàm phức tạp, đặc biệt là business logic (recommendation algorithm, AI moderation, transaction flows)
- Frontend: component phải có prop types rõ ràng, tách logic ra hooks

### Flexibility (Tính linh hoạt)
- Tách business logic khỏi presentation layer
- Frontend: state management rõ ràng, tránh prop drilling sâu
- Backend: dùng serializers để tách data transformation khỏi models
- Migration-safe: không assume data structure cố định

---

## Workflow Requirements

### Backend API Exploration
- **BẮT BUỘC explore backend API trước khi làm bất cứ điều gì liên quan ở phía frontend**
- Trước khi bắt đầu feature frontend mới:
  1. Đọc backend API endpoint
  2. Kiểm tra API docs (Swagger UI: http://127.0.0.1:8000/api/docs/)
  3. Hiểu request/response shape, authentication requirements, error codes
  4. Nếu endpoint chưa có → implement backend trước, hoặc báo cho user để coordinate

### Frontend Development

- **BẮT BUỘC đọc `FRONTEND_DESIGN.md` TRƯỚC KHI viết bất kỳ UI/UX code nào** — File này chứa design tokens, typography, spacing, color palette, và animation patterns. Không được phép viết UI mà không tuân theo design guide này.
- **Sử dụng frontend-design skill MỖI KHI động vào frontend** — invoke skill này trước khi viết bất kỳ component nào
- Thiết kế UI/UX phải follow frontend-design skill và design spec đã có trong TODO.md và FRONTEND_DESIGN.md
- Dùng tiếng Việt cho tất cả UI text, labels, messages, errors
- Responsive-first: mobile trước, desktop sau
- **KHÔNG dùng `max-w-sm`, `max-w-xs`, `max-w-md`, `max-w-lg` cho bất kỳ điều gì** — vì text bị ép chen lại

### Testing Requirements
- **Sau khi viết xong feature hoặc fix bug, PHẢI tự test bằng một trong các cách sau:**
  1. Viết unit tests cho backend logic mới
  2. Viết integration tests cho API flows mới
  3. Chạy Playwright E2E tests cho frontend flows
    - Tài khoản cho AI Test (Chưa phải tài khoản admin):
      - Email: `aitesterkm@kitchenmate.vn`
      - Password: `Tester1234@`
  4. Nếu không có test infrastructure sẵn có → tạo minimal test script để verify
- Test phải pass trước khi mark task là completed
- Không được commit code mới nếu test infrastructure không setup — phải setup trước

---

## Localization

- **App cho người Việt**: tất cả UI text, error messages, labels, buttons đều bằng tiếng Việt
- Backend error messages: tiếng Việt (đã set `LANGUAGE_CODE = 'vi'`)
- Frontend text: hardcoded tiếng Việt trong components (không i18n library vì scope nhỏ)
- ví dụ: "Đăng nhập" thay vì "Login", "Tủ lạnh" thay vì "Pantry", "Công thức" thay vì "Recipe"

## Một số lưu ý

- Luôn update MEMORY khi có sự thay đổi, và luôn verify lại những thông tin mà bạn định đưa vào MEMORY. (Hoặc CLAUDE.md, AGENTS.md khi cần thiết)
- Không được dùng Icon dạng text khi design, phải dùng của thư viện.

---

## Django DRF Pitfalls

### ViewSet Base Class
**Context**: Khi tạo/chỉnh sửa DRF ViewSet dùng mixins
**Rule**: PHẢI include `viewsets.GenericViewSet` làm base class đầu tiên nếu dùng custom mixins combination. Nếu thiếu, router sẽ lỗi `AttributeError: type object 'X' has no attribute 'get_extra_actions'`
```python
# ĐÚNG
class CollectionViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin,
                        mixins.RetrieveModelMixin,
                        mixins.CreateModelMixin):
    pass

# SAI - sẽ crash khi router duyệt
class CollectionViewSet(mixins.ListModelMixin,
                        mixins.CreateModelMixin,
                        mixins.RetrieveModelMixin):
    pass
```

### Serializer Class Order
**Context**: Khi một serializer reference another serializer trong body
**Rule**: Class được reference phải được define TRƯỚC class reference nó. Nếu không sẽ gây `NameError: name 'X' is not defined`
```python
# ĐÚNG - CollectionRecipeSerializer define trước
class CollectionRecipeSerializer(serializers.ModelSerializer):
    ...

class CollectionSerializer(serializers.ModelSerializer):
    collection_recipes = CollectionRecipeSerializer(...)  # OK

# SAI - CollectionSerializer define trước khi CollectionRecipeSerializer tồn tại
class CollectionSerializer(serializers.ModelSerializer):
    collection_recipes = CollectionRecipeSerializer(...)  # NameError
```

### Pagination Response Format
**Context**: Backend DRF pagination wrap response thành `{success, data: {count, next, previous, results}}`
**Pattern**: Frontend phải handle cả paginated và non-paginated:
```javascript
const list = res.data?.results || res.data?.data || res.data || res || []
```

---

## Frontend Patterns

### Flattened Serializer Fields
**Context**: Khi backend serializer flatten nested objects (VD: `recipe_thumbnail`, `recipe_title` thay vì nested `recipe.thumbnail_url`)
**Rule**: Frontend mapping phải dùng flattened field names, KHÔNG dùng nested path
```javascript
// ĐÚNG
thumbnails.map(cr => cr.recipe_thumbnail)

// SAI - backend không return nested object
cr.recipe?.thumbnail
```

### Tailwind max-w Constraints
**Context**: Dialogs/confirmation modals với error messages
**Rule**: KHÔNG dùng `max-w-sm`, `max-w-xs`, `max-w-md`, `max-w-lg` cho text content — gây text bị ép chen lại.

### Multi-Step Form State Management
**Context**: Khi implement multi-step form (VD: recipe editor) với các step components
**Pattern**: Components nhận `data` (formData object) thay vì props riêng biệt. Dùng `data.steps`/`data.ingredients` trực tiếp thay vì nhận `steps`/`ingredients` như separate props
```javascript
// IngredientList - CORRECT
export function IngredientList({ onChange, data, errors = {} }) {
  const steps = data?.steps || []
  const handleAddIngredient = (ingredient) => {
    onChange({ ...data, ingredients: [...(data.ingredients || []), newIngredient] })
  }
}

// IngredientList - WRONG (state inconsistency)
export function IngredientList({ ingredients = [], onChange, errors = {} }) {
  // ingredients prop có thể không đồng bộ với formData
}
```
**Why**: Khi component nhận `ingredients` prop riêng, nó có thể không đồng bộ với formData gốc nếu parent re-render với state cũ. Nhận `data` và dùng `data.ingredients` đảm bảo luôn đọc từ nguồn đúng.

### Framer Motion Reorder State Conflict
**Context**: Khi dùng `Reorder.Group`/`Reorder.Item` trong multi-step form với React state management
**Pattern**: Thay `Reorder.Group`/`Reorder.Item` bằng `motion.div` để tránh conflict
```javascript
// WRONG - Reorder quản lý state nội bộ, gây conflict
<Reorder.Group values={ingredients} onReorder={(newOrder) => onChange(newOrder)}>
  <Reorder.Item key={item.id} value={item}>...</Reorder.Item>
</Reorder.Group>

// CORRECT - motion.div không quản lý state
<div className="space-y-2">
  <AnimatePresence>
    {ingredients.map((item) => (
      <motion.div key={item.id} ...>...</motion.div>
    ))}
  </AnimatePresence>
</div>
```
**Why**: `Reorder.Group` dùng internal state tracking không tương thích với React's external state management.

---

## Backend Model-DB Consistency

### Model Fields Must Match Database Schema
**Context**: Khi PostgreSQL báo `null value in column "X" violates not-null constraint`
**Root Cause**: Model thiếu định nghĩa trường mà database đã có sẵn
**Pattern**: Kiểm tra database schema khi lỗi xảy ra
```bash
# Check all columns in table
SELECT column_name FROM information_schema.columns WHERE table_name='recipes'
```
**Fix**: Thêm các trường thiếu vào model, generate migration, và apply. Nếu columns đã tồn tại trong DB, dùng `--fake` để tránh lỗi duplicate column.
```bash
python manage.py migrate recipes --fake
```
