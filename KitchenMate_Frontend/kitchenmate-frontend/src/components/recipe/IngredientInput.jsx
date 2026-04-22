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
