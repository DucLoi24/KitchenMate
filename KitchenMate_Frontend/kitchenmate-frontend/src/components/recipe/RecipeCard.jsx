import { Link } from 'react-router-dom';
import { FaClock, FaStar, FaBookmark } from 'react-icons/fa';
import toast from 'react-hot-toast';

const difficultyLabels = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

const difficultyColors = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HARD: 'bg-red-100 text-red-700',
};

export default function RecipeCard({ recipe, onSave }) {
  const {
    id,
    title,
    thumbnail_url: thumbnailUrl,
    user_name: authorName,
    prep_time: prepTime,
    avg_rating: avgRating,
    difficulty,
    is_saved: isSaved,
  } = recipe;

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) {
      onSave(id);
    } else {
      toast.success(isSaved ? 'Đã xóa khỏi bộ sưu tập' : 'Đã lưu vào bộ sưu tập');
    }
  };

  return (
    <Link
      to={`/recipes/${id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
    >
      {/* Ảnh vuông 1:1 */}
      <div className="aspect-square w-full bg-gray-200 overflow-hidden relative">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-orange-100">
            <span className="text-orange-300 text-4xl">🍽️</span>
          </div>
        )}
        {/* Difficulty badge */}
        {difficulty && (
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[difficulty] || 'bg-gray-100 text-gray-600'}`}>
            {difficultyLabels[difficulty] || difficulty}
          </span>
        )}
        {/* Save button */}
        <button
          onClick={handleSaveClick}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isSaved
              ? 'bg-orange-500 text-white'
              : 'bg-white/80 text-gray-500 hover:bg-white hover:text-orange-500'
          }`}
        >
          <FaBookmark size={14} />
        </button>
      </div>

      {/* Thông tin bên dưới */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-2">
          {authorName || 'Ẩn danh'}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-600">
            <FaClock className="text-orange-500" />
            {prepTime || 30}p
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            <FaStar className="text-yellow-400" />
            {avgRating ? avgRating.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
    </Link>
  );
}