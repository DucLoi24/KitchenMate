# Phase 6.1: Create Recipe Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo trang `/recipes/create` cho phép user tạo công thức nấu ăn mới với form đầy đủ: title, description, difficulty, prep_time, visibility, ingredients (search + contribute), steps (với optional media), thumbnail upload.

**Architecture:** React functional components với controlled state. Ingredient search dùng debounced custom hook. Form submission qua `recipeApi.createRecipe()`. Step media upload sau khi recipe tạo thành công.

**Tech Stack:** React 19, Tailwind CSS v4, Zustand, React Router DOM v7, Axios, React Query (TanStack Query v5), react-hot-toast, react-icons

---

## File Structure

```
src/
├── api/
│   └── recipeApi.js              # recipe CRUD + searchIngredients + uploadStepMedia + contributeIngredient
├── hooks/
│   └── useIngredientSearch.js    # debounced search hook
├── components/recipe/
│   ├── IngredientSearch.jsx      # search dropdown + contribute inline form + status badges
│   ├── IngredientInput.jsx       # single ingredient row
│   ├── StepInput.jsx             # single step row + optional media toggle
│   ├── ThumbnailUpload.jsx       # file input + preview
│   └── CreateRecipeForm.jsx      # main form container + visibility + step media upload
└── pages/
    └── CreateRecipePage.jsx      # route page
```

**Modify (from Phase 6.1 v1):**
- `src/routes/index.jsx` — `/recipes/create` route đã wire với `<CreateRecipePage />`
- `src/api/recipeApi.js` — đã có createRecipe, searchIngredients, uploadThumbnail
- `src/hooks/useIngredientSearch.js` — đã tạo
- `src/components/recipe/IngredientSearch.jsx` — đã tạo, cần update
- `src/components/recipe/IngredientInput.jsx` — đã tạo
- `src/components/recipe/StepInput.jsx` — đã tạo, cần update
- `src/components/recipe/ThumbnailUpload.jsx` — đã tạo
- `src/components/recipe/CreateRecipeForm.jsx` — đã tạo, cần update

---

## Task Decomposition

### Task 1: Setup — recipeApi.js + useIngredientSearch.js

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/api/recipeApi.js`
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/hooks/useIngredientSearch.js`

- [ ] **Step 1: Write recipeApi.js**

```javascript
// KitchenMate_Frontend/kitchenmate-frontend/src/api/recipeApi.js
import axiosInstance from './axiosInstance';

export const recipeApi = {
  createRecipe: async (data) => {
    const response = await axiosInstance.post('/recipes/', data);
    return response.data;
  },

  searchIngredients: async (query) => {
    const response = await axiosInstance.get('/ingredients/search/', {
      params: { q: query },
    });
    return response.data.data || response.data;
  },

  uploadThumbnail: async (recipeId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post(
      `/recipes/${recipeId}/thumbnail/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },
};
```

- [ ] **Step 2: Write useIngredientSearch.js**

```javascript
// KitchenMate_Frontend/kitchenmate-frontend/src/hooks/useIngredientSearch.js
import { useState, useEffect } from 'react';
import { recipeApi } from '../api/recipeApi';

export function useIngredientSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await recipeApi.searchIngredients(query);
        setResults(data);
      } catch (err) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, isLoading };
}
```

- [ ] **Step 3: Commit**

```bash
cd KitchenMate_Frontend/kitchenmate-frontend
git add src/api/recipeApi.js src/hooks/useIngredientSearch.js
git commit -m "feat(frontend): add recipeApi and useIngredientSearch hook"
```

---

### Task 2: IngredientSearch Component

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/IngredientSearch.jsx`

- [ ] **Step 1: Write IngredientSearch.jsx**

```javascript
// KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/IngredientSearch.jsx
import { useState, useRef, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';

const categoryColors = {
  PROTEIN: 'bg-red-100 text-red-700',
  CARB: 'bg-yellow-100 text-yellow-700',
  VEG: 'bg-green-100 text-green-700',
  SPICE: 'bg-orange-100 text-orange-700',
  STAPLE: 'bg-blue-100 text-blue-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function IngredientSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { recipeApi } = await import('../api/recipeApi');
        const data = await recipeApi.searchIngredients(query);
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (ingredient) => {
    onSelect(ingredient);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

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
            <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy nguyên liệu</div>
          ) : (
            results.map((ing) => (
              <button
                key={ing.id}
                onClick={() => handleSelect(ing)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <span className="text-sm font-medium text-gray-900">{ing.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColors[ing.category] || categoryColors.OTHER}`}>
                  {ing.category}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/recipe/IngredientSearch.jsx
git commit -m "feat(frontend): add IngredientSearch component with debounced search"
```

---

### Task 3: IngredientInput Component

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/IngredientInput.jsx`

- [ ] **Step 1: Write IngredientInput.jsx**

```javascript
// KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/IngredientInput.jsx
import { FaTrash } from 'react-icons/fa';

const UNITS = ['gram', 'kg', 'ml', 'l', 'cái', 'quả', 'gói', 'muỗng'];

export default function IngredientInput({ ingredient, onUpdate, onRemove }) {
  const handleQuantityChange = (e) => {
    onUpdate({ ...ingredient, quantity: e.target.value });
  };

  const handleUnitChange = (e) => {
    onUpdate({ ...ingredient, unit: e.target.value });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-700 truncate block">
          {ingredient.name}
        </span>
      </div>
      <input
        type="number"
        value={ingredient.quantity}
        onChange={handleQuantityChange}
        min="0"
        step="any"
        placeholder="Số lượng"
        className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      />
      <select
        value={ingredient.unit}
        onChange={handleUnitChange}
        className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      >
        {UNITS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
      >
        <FaTrash size={14} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/recipe/IngredientInput.jsx
git commit -m "feat(frontend): add IngredientInput component"
```

---

### Task 4: StepInput Component

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/StepInput.jsx`

- [ ] **Step 1: Write StepInput.jsx**

```javascript
// KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/StepInput.jsx
import { FaTrash } from 'react-icons/fa';

export default function StepInput({ step, onUpdate, onRemove }) {
  const handleInstructionChange = (e) => {
    onUpdate({ ...step, instruction: e.target.value });
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold shrink-0 mt-1">
        {step.step_number}
      </div>
      <div className="flex-1">
        <textarea
          value={step.instruction}
          onChange={handleInstructionChange}
          rows={2}
          placeholder="Mô tả bước này..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors mt-1"
      >
        <FaTrash size={14} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/recipe/StepInput.jsx
git commit -m "feat(frontend): add StepInput component"
```

---

### Task 5: ThumbnailUpload Component

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/ThumbnailUpload.jsx`

- [ ] **Step 1: Write ThumbnailUpload.jsx**

```javascript
// KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/ThumbnailUpload.jsx
import { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaImage } from 'react-icons/fa';

const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ThumbnailUpload({ onFileSelect }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Chỉ chấp nhận file JPG, PNG hoặc WebP';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File quá lớn (tối đa ${MAX_SIZE_MB}MB)`;
    }
    return null;
  };

  const handleFile = (file) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    onFileSelect(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-orange-500 bg-orange-50'
            : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FaCloudUploadAlt className="text-4xl text-gray-400" />
            <p className="text-sm text-gray-500">Kéo thả ảnh hoặc click để chọn</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP • Tối đa {MAX_SIZE_MB}MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/recipe/ThumbnailUpload.jsx
git commit -m "feat(frontend): add ThumbnailUpload component with drag & drop"
```

---

### Task 6: CreateRecipeForm Component

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/CreateRecipeForm.jsx`

- [ ] **Step 1: Write CreateRecipeForm.jsx**

```javascript
// KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/CreateRecipeForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaPlus, FaArrowLeft } from 'react-icons/fa';
import IngredientSearch from './IngredientSearch';
import IngredientInput from './IngredientInput';
import StepInput from './StepInput';
import ThumbnailUpload from './ThumbnailUpload';
import { recipeApi } from '../../api/recipeApi';

const DIFFICULTIES = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
];

const emptyIngredient = () => ({ id: null, name: '', quantity: '', unit: 'gram' });
const emptyStep = (num) => ({ step_number: num, instruction: '' });

export default function CreateRecipeForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('EASY');
  const [prepTime, setPrepTime] = useState('');

  const [ingredients, setIngredients] = useState([emptyIngredient()]);
  const [steps, setSteps] = useState([emptyStep(1)]);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const addIngredient = () => setIngredients([...ingredients, emptyIngredient()]);
  const removeIngredient = (idx) => {
    if (ingredients.length === 1) return;
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };
  const updateIngredient = (idx, updated) => {
    const next = [...ingredients];
    next[idx] = updated;
    setIngredients(next);
  };
  const handleIngredientSelect = (ing) => {
    setIngredients([...ingredients, { id: ing.id, name: ing.name, quantity: '', unit: 'gram' }]);
  };

  const addStep = () => setSteps([...steps, emptyStep(steps.length + 1)]);
  const removeStep = (idx) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1 })));
  };
  const updateStep = (idx, updated) => {
    const next = [...steps];
    next[idx] = { ...updated, step_number: idx + 1 };
    setSteps(next);
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Tiêu đề là bắt buộc';
    if (title.length > 200) errs.title = 'Tiêu đề tối đa 200 ký tự';
    if (!prepTime || prepTime < 1) errs.prepTime = 'Thời gian chuẩn bị phải >= 1 phút';
    if (ingredients.filter(i => i.id).length === 0) errs.ingredients = 'Cần ít nhất 1 nguyên liệu';
    if (steps.filter(s => s.instruction.trim()).length === 0) errs.steps = 'Cần ít nhất 1 bước';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        prep_time: Number(prepTime),
        ingredients: ingredients
          .filter(i => i.id && i.quantity)
          .map(i => ({ ingredient: i.id, quantity: Number(i.quantity), unit: i.unit })),
        steps: steps
          .filter(s => s.instruction.trim())
          .map((s, i) => ({ step_number: i + 1, instruction: s.instruction.trim() })),
      };

      const res = await recipeApi.createRecipe(payload);

      if (res.success) {
        const recipeId = res.data?.id;
        toast.success('Tạo công thức thành công!');

        if (thumbnailFile && recipeId) {
          try {
            await recipeApi.uploadThumbnail(recipeId, thumbnailFile);
          } catch (uploadErr) {
            // Upload failure is non-fatal — recipe already created
            console.warn('Thumbnail upload failed:', uploadErr);
          }
        }

        navigate(`/recipes/${recipeId}`);
      } else {
        toast.error(res.error?.message || 'Tạo công thức thất bại');
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Đã xảy ra lỗi khi tạo công thức';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
      >
        <FaArrowLeft size={18} />
        <span className="text-sm">Quay lại</span>
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Tạo công thức mới</h1>

      {/* Basic Info */}
      <div className="bg-white rounded-xl p-5 space-y-4 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900">Thông tin cơ bản</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Ví dụ: Phở bò truyền thống"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Mô tả ngắn về công thức của bạn..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Độ khó</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút) *</label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              min={1}
              placeholder="Ví dụ: 60"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                errors.prepTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-xl p-5 space-y-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Nguyên liệu *</h2>
          <button
            type="button"
            onClick={addIngredient}
            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            <FaPlus size={14} />
            Thêm nguyên liệu
          </button>
        </div>

        <div className="space-y-3">
          {ingredients.map((ing, idx) => (
            ing.id ? (
              <IngredientInput
                key={idx}
                ingredient={ing}
                onUpdate={(updated) => updateIngredient(idx, updated)}
                onRemove={() => removeIngredient(idx)}
              />
            ) : (
              <div key={idx}>
                <IngredientSearch onSelect={handleIngredientSelect} />
              </div>
            )
          ))}
        </div>

        {errors.ingredients && <p className="text-sm text-red-500">{errors.ingredients}</p>}
        {ingredients.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">Chưa có nguyên liệu nào</p>
        )}
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl p-5 space-y-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Các bước *</h2>
          <button
            type="button"
            onClick={addStep}
            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            <FaPlus size={14} />
            Thêm bước
          </button>
        </div>

        <div className="space-y-4">
          {steps.map((step, idx) => (
            <StepInput
              key={idx}
              step={step}
              onUpdate={(updated) => updateStep(idx, updated)}
              onRemove={() => removeStep(idx)}
            />
          ))}
        </div>

        {errors.steps && <p className="text-sm text-red-500">{errors.steps}</p>}
      </div>

      {/* Thumbnail */}
      <div className="bg-white rounded-xl p-5 space-y-4 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900">Ảnh minh họa</h2>
        <ThumbnailUpload onFileSelect={setThumbnailFile} />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {loading ? 'Đang tạo...' : 'Tạo công thức'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/recipe/CreateRecipeForm.jsx
git commit -m "feat(frontend): add CreateRecipeForm main component"
```

---

### Task 7: CreateRecipePage + Route Update

**Files:**
- Create: `KitchenMate_Frontend/kitchenmate-frontend/src/pages/CreateRecipePage.jsx`
- Modify: `KitchenMate_Frontend/kitchenmate-frontend/src/routes/index.jsx:39-47`

- [ ] **Step 1: Write CreateRecipePage.jsx**

```javascript
// KitchenMate_Frontend/kitchenmate-frontend/src/pages/CreateRecipePage.jsx
import CreateRecipeForm from '../components/recipe/CreateRecipeForm';

export default function CreateRecipePage() {
  return <CreateRecipeForm />;
}
```

- [ ] **Step 2: Update routes/index.jsx**

Thay đoạn placeholder ở path `/recipes/create`:

```javascript
// TRƯỚC (dòng 89-97):
{
  path: '/recipes/create',
  element: (
    <ProtectedRoute>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900">Tạo công thức</h1>
      </div>
    </ProtectedRoute>
  ),
},

// SAU:
{
  path: '/recipes/create',
  element: (
    <ProtectedRoute>
      <CreateRecipePage />
    </ProtectedRoute>
  ),
},
```

Cần thêm import:
```javascript
import CreateRecipePage from '../pages/CreateRecipePage';
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/CreateRecipePage.jsx src/routes/index.jsx
git commit -m "feat(frontend): add CreateRecipePage and wire up /recipes/create route"
```

---

## Plan Review Checklist

1. **Spec coverage:** Tất cả spec sections đều có task tương ứng:
   - Basic Info (title, description, difficulty, prep_time) → Task 6
   - Ingredients search + dynamic list → Task 2, 3, 6
   - Steps dynamic list → Task 4, 6
   - Thumbnail upload → Task 5, 6
   - Submission flow + redirect → Task 6
   - Route protection → Task 7

2. **Placeholder scan:** Không có TBD, TODO, hoặc "implement later"

3. **Type consistency:** Ingredient object có `{id, name, quantity, unit}` — match với API payload spec

4. **Files match structure:** File paths chính xác, không có orphan files

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-04-22-create-recipe-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
