# Phase 6.1 v2: Create Recipe — Update Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bổ sung các tính năng còn thiếu vào Create Recipe page:
1. Visibility select (PRIVATE/PUBLIC)
2. Ingredient contribute inline form (khi search empty)
3. Step media upload (optional, per step)
4. PENDING ingredient validation khi submit PUBLIC

**Architecture:** Update các component đã tạo ở Phase 6.1 v1, thêm logic mới vào recipeApi.

**Tech Stack:** React 19, Tailwind CSS v4, Zustand, React Router DOM v7, Axios, react-hot-toast, react-icons

---

## Task Decomposition

### Task 1: Update recipeApi.js — Add new methods

**Files:**
- Modify: `KitchenMate_Frontend/kitchenmate-frontend/src/api/recipeApi.js`

- [ ] **Step 1: Add `uploadStepMedia` method**

```javascript
uploadStepMedia: async (recipeId, stepId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(
    `/recipes/${recipeId}/steps/${stepId}/media/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
},
```

- [ ] **Step 2: Add `contributeIngredient` method**

```javascript
contributeIngredient: async (name, category) => {
  const response = await axiosInstance.post('/ingredients/', { name, category });
  return response.data;
},
```

- [ ] **Step 3: Commit**

```bash
cd KitchenMate_Frontend/kitchenmate-frontend
git add src/api/recipeApi.js
git commit -m "feat(frontend): add uploadStepMedia and contributeIngredient to recipeApi"
```

---

### Task 2: Update IngredientSearch.jsx — Add contribute form + status badges

**Files:**
- Modify: `KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/IngredientSearch.jsx`

- [ ] **Step 1: Add state for contribute form**

```javascript
const [showContribute, setShowContribute] = useState(false);
const [contributeName, setContributeName] = useState('');
const [contributeCategory, setContributeCategory] = useState('OTHER');
const [contributeLoading, setContributeLoading] = useState(false);
```

- [ ] **Step 2: Add category colors for status badges**

```javascript
const statusColors = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
};
```

- [ ] **Step 3: Update empty state dropdown**

```javascript
{results.length === 0 && query.length >= 2 && !isLoading && (
  <div className="px-4 py-3">
    <p className="text-sm text-gray-500 mb-2">Không tìm thấy nguyên liệu nào</p>
    {!showContribute && (
      <button
        onClick={() => setShowContribute(true)}
        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
      >
        + Đóng góp nguyên liệu mới
      </button>
    )}
  </div>
)}
```

- [ ] **Step 4: Add contribute inline form (conditional)**

```javascript
{showContribute && (
  <div className="px-4 py-3 border-t border-gray-100">
    <p className="text-sm font-medium text-gray-700 mb-2">✨ Đóng góp nguyên liệu mới</p>
    <input
      type="text"
      value={contributeName}
      onChange={(e) => setContributeName(e.target.value)}
      placeholder="Tên nguyên liệu"
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
    />
    <select
      value={contributeCategory}
      onChange={(e) => setContributeCategory(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
    >
      <option value="PROTEIN">Đạm</option>
      <option value="CARB">Tinh bột</option>
      <option value="VEG">Rau củ</option>
      <option value="SPICE">Gia vị</option>
      <option value="STAPLE">Gia vị cơ bản</option>
      <option value="OTHER">Khác</option>
    </select>
    <div className="flex gap-2">
      <button
        onClick={() => setShowContribute(false)}
        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
      >
        Huỷ
      </button>
      <button
        onClick={handleContribute}
        disabled={contributeLoading || !contributeName.trim()}
        className="flex-1 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg disabled:opacity-50"
      >
        {contributeLoading ? 'Đang gửi...' : 'Gửi đóng góp'}
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 5: Add `handleContribute` function**

```javascript
const handleContribute = async () => {
  if (!contributeName.trim()) return;
  setContributeLoading(true);
  try {
    await recipeApi.contributeIngredient(contributeName.trim(), contributeCategory);
    toast.success('Đã gửi nguyên liệu để duyệt. Cảm ơn bạn!');
    setShowContribute(false);
    setContributeName('');
    setContributeCategory('OTHER');
    setQuery('');
    setResults([]);
  } catch (err) {
    toast.error('Không thể gửi đóng góp. Thử lại sau.');
  } finally {
    setContributeLoading(false);
  }
};
```

- [ ] **Step 6: Update result items to show status badges**

```javascript
results.map((ing) => (
  <button
    key={ing.id}
    onClick={() => handleSelect(ing)}
    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between gap-2"
  >
    <span className="text-sm font-medium text-gray-900 truncate">{ing.name}</span>
    <div className="flex items-center gap-1 shrink-0">
      {ing.status === 'PENDING' && (
        <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[ing.status]}`}>
          ⏳ Chờ duyệt
        </span>
      )}
      <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColors[ing.category] || categoryColors.OTHER}`}>
        {ing.category}
      </span>
    </div>
  </button>
))
```

- [ ] **Step 7: Commit**

```bash
git add src/components/recipe/IngredientSearch.jsx
git commit -m "feat(frontend): add ingredient contribute form and status badges to IngredientSearch"
```

---

### Task 3: Update StepInput.jsx — Add optional media toggle

**Files:**
- Modify: `KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/StepInput.jsx`

- [ ] **Step 1: Add imports + state**

```javascript
import { useState } from 'react';
import { FaTrash, FaImage } from 'react-icons/fa';
import ThumbnailUpload from './ThumbnailUpload';

// Inline mini upload component (simplified)
function StepMediaUpload({ onFileSelect, mediaUrl }) {
  const [preview, setPreview] = useState(mediaUrl || null);

  const handleFile = (file) => {
    onFileSelect(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  if (preview) {
    return (
      <div className="mt-2">
        <img src={preview} alt="Step media" className="w-full h-24 object-cover rounded-lg" />
        <button
          onClick={() => { setPreview(null); onFileSelect(null); }}
          className="mt-1 text-xs text-red-500 hover:text-red-700"
        >
          Xóa ảnh
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <label className="text-xs text-gray-500 cursor-pointer hover:text-orange-600">
        <FaImage className="inline mr-1" />
        Thêm ảnh minh họa
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Add media props + toggle**

```javascript
export default function StepInput({ step, onUpdate, onRemove, stepNumber }) {
  const [showMedia, setShowMedia] = useState(false);

  const handleInstructionChange = (e) => {
    onUpdate({ ...step, instruction: e.target.value });
  };

  const handleMediaSelect = (file) => {
    onUpdate({ ...step, mediaFile: file });
  };

  const toggleMedia = () => {
    setShowMedia(!showMedia);
    if (showMedia) {
      // Clear media when hiding
      onUpdate({ ...step, mediaFile: null });
    }
  };
```

- [ ] **Step 3: Update return JSX**

```javascript
return (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold shrink-0 mt-1">
      {stepNumber || step.step_number}
    </div>
    <div className="flex-1">
      <textarea
        value={step.instruction}
        onChange={handleInstructionChange}
        rows={2}
        placeholder="Mô tả bước này..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
      />

      {/* Media toggle */}
      <div className="mt-2">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showMedia}
            onChange={toggleMedia}
            className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
          />
          <FaImage size={14} />
          Thêm ảnh/video minh họa
        </label>

        {showMedia && (
          <StepMediaUpload
            onFileSelect={handleMediaSelect}
            mediaUrl={step.mediaUrl}
          />
        )}
      </div>
    </div>
    <button
      type="button"
      onClick={onRemove}
      aria-label="Xóa bước"
      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors mt-1"
    >
      <FaTrash size={14} />
    </button>
  </div>
);
```

- [ ] **Step 4: Commit**

```bash
git add src/components/recipe/StepInput.jsx
git commit -m "feat(frontend): add optional media toggle to StepInput"
```

---

### Task 4: Update CreateRecipeForm.jsx — Visibility + Step media upload + PENDING validation

**Files:**
- Modify: `KitchenMate_Frontend/kitchenmate-frontend/src/components/recipe/CreateRecipeForm.jsx`

- [ ] **Step 1: Add visibility state**

```javascript
const [visibility, setVisibility] = useState('PRIVATE');
```

- [ ] **Step 2: Add visibility select in Basic Info section**

```javascript
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">👁️ Hiển thị</label>
  <select
    value={visibility}
    onChange={(e) => setVisibility(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
  >
    <option value="PRIVATE">Riêng tư (chỉ tôi)</option>
    <option value="PUBLIC">Công khai (mọi người)</option>
  </select>
</div>
```

- [ ] **Step 3: Update `handleIngredientSelect` to preserve status**

```javascript
const handleIngredientSelect = (ing) => {
  setIngredients([...ingredients, {
    id: ing.id,
    name: ing.name,
    quantity: '',
    unit: 'gram',
    status: ing.status || 'APPROVED', // preserve status from search result
  }]);
};
```

- [ ] **Step 4: Update validation to check PENDING ingredients**

```javascript
const validate = () => {
  const errs = {};
  if (!title.trim()) errs.title = 'Tiêu đề là bắt buộc';
  if (title.length > 200) errs.title = 'Tiêu đề tối đa 200 ký tự';
  if (!prepTime || prepTime < 1) errs.prepTime = 'Thời gian chuẩn bị phải >= 1 phút';
  if (ingredients.filter(i => i.id).length === 0) errs.ingredients = 'Cần ít nhất 1 nguyên liệu';

  // Check PENDING ingredients for PUBLIC visibility
  const pendingIngredients = ingredients.filter(i => i.id && i.status === 'PENDING');
  if (pendingIngredients.length > 0 && visibility === 'PUBLIC') {
    errs.visibility = 'Công thức có nguyên liệu chờ duyệt, không thể gửi công khai';
  }

  if (steps.filter(s => s.instruction.trim()).length === 0) errs.steps = 'Cần ít nhất 1 bước';
  setErrors(errs);
  return Object.keys(errs).length === 0;
};
```

- [ ] **Step 5: Update step state to include stepNumber**

```javascript
// Change emptyStep to include stepNumber
const emptyStep = (num) => ({ step_number: num, instruction: '', mediaFile: null });
```

- [ ] **Step 6: Update `handleSubmit` to include visibility + upload step media**

```javascript
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
      visibility,
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

      // Upload thumbnail
      if (thumbnailFile && recipeId) {
        try {
          await recipeApi.uploadThumbnail(recipeId, thumbnailFile);
        } catch (uploadErr) {
          console.warn('Thumbnail upload failed:', uploadErr);
        }
      }

      // Upload step media
      const stepsWithMedia = steps.filter(s => s.mediaFile && s.instruction.trim());
      for (const step of stepsWithMedia) {
        try {
          // Find the step ID from the response
          const stepIndex = steps.indexOf(step);
          const stepId = res.data?.steps?.[stepIndex]?.id;
          if (stepId) {
            await recipeApi.uploadStepMedia(recipeId, stepId, step.mediaFile);
          }
        } catch (uploadErr) {
          console.warn(`Step media upload failed for step ${step.step_number}:`, uploadErr);
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
```

- [ ] **Step 7: Update `addStep` to pass stepNumber**

```javascript
const addStep = () => setSteps([...steps, emptyStep(steps.length + 1)]);
```

- [ ] **Step 8: Update StepInput call to pass stepNumber**

```javascript
<StepInput
  key={idx}
  step={step}
  stepNumber={idx + 1}
  onUpdate={(updated) => updateStep(idx, updated)}
  onRemove={() => removeStep(idx)}
/>
```

- [ ] **Step 9: Commit**

```bash
git add src/components/recipe/CreateRecipeForm.jsx
git commit -m "feat(frontend): add visibility select, PENDING validation, step media upload to CreateRecipeForm"
```

---

## Plan Review Checklist

1. **Spec coverage:** Tất cả new features đều có task tương ứng:
   - Visibility select → Task 4 (Step 1-2)
   - Ingredient contribute form → Task 2
   - Step media toggle → Task 3
   - PENDING validation → Task 4 (Step 4)
   - Step media upload post-creation → Task 4 (Step 6)

2. **Placeholder scan:** Không có TBD, TODO, hoặc "implement later"

3. **Type consistency:** Ingredient object có `{id, name, quantity, unit, status}`, Step object có `{step_number, instruction, mediaFile}`

4. **Files match structure:** Chỉ modify 4 file đã tồn tại từ Phase 6.1 v1

---

## Files Modified Summary

| File | Task |
|------|------|
| `src/api/recipeApi.js` | Task 1 |
| `src/components/recipe/IngredientSearch.jsx` | Task 2 |
| `src/components/recipe/StepInput.jsx` | Task 3 |
| `src/components/recipe/CreateRecipeForm.jsx` | Task 4 |
