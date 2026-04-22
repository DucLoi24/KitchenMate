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