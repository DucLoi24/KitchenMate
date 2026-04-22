import { Link } from 'react-router-dom';
import { Clock, Star } from 'react-bootstrap-icons';

export default function RecipeCard({ recipe }) {
  const {
    id,
    title,
    thumbnail,
    author,
    cooking_time: cookingTime,
    avg_rating: avgRating,
  } = recipe;

  return (
    <Link
      to={`/recipes/${id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
    >
      {/* Ảnh vuông 1:1 */}
      <div className="aspect-square w-full bg-gray-200 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-orange-100">
            <span className="text-orange-300 text-4xl">🍽️</span>
          </div>
        )}
      </div>

      {/* Thông tin bên dưới */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-2">
          {author?.username || 'Ẩn danh'}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-600">
            <Clock className="text-orange-500" />
            {cookingTime || 30}p
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            <Star className="text-yellow-400" />
            {avgRating ? avgRating.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
    </Link>
  );
}