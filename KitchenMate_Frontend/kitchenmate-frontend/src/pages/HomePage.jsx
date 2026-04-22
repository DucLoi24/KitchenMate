import { Link } from 'react-router-dom';
import { FaUtensils, FaHeart, FaClock, FaBook, FaPlus } from 'react-icons/fa';
import { useAuthStore } from '../stores/authStore';

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - khác nhau cho guest vs logged in */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              {isAuthenticated ? (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    Chào {user?.username || 'bạn'}! 👋
                  </h1>
                  <p className="text-orange-100 text-lg mb-6">
                    Hôm nay bạn muốn nấu món gì? Chúng tôi sẽ gợi ý cho bạn!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <Link
                      to="/suggestions"
                      className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Gợi ý món ăn
                    </Link>
                    <Link
                      to="/pantry"
                      className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg border border-orange-400 hover:bg-orange-500 transition-colors"
                    >
                      Quản lý tủ lạnh
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    Nấu ăn thông minh,<br />sống khỏe mỗi ngày
                  </h1>
                  <p className="text-orange-100 text-lg mb-6">
                    Khám phá hàng ngàn công thức nấu ăn ngon, gợi ý món ăn từ nguyên liệu có sẵn trong tủ lạnh.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <Link
                      to="/register"
                      className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Bắt đầu ngay
                    </Link>
                    <Link
                      to="/explore"
                      className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg border border-orange-400 hover:bg-orange-500 transition-colors"
                    >
                      Khám phá công thức
                    </Link>
                  </div>
                </>
              )}
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 bg-orange-400 rounded-full opacity-50 absolute -top-4 -left-4" />
                <img
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400"
                  alt="Nấu ăn"
                  className="w-64 h-64 object-cover rounded-2xl shadow-xl relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUtensils className="text-orange-500 text-xl" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Công thức đa dạng</h3>
              <p className="text-gray-500 text-sm">Hàng ngàn công thức từ món Việt đến món quốc tế</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeart className="text-green-500 text-xl" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gợi ý thông minh</h3>
              <p className="text-gray-500 text-sm">Tìm món ăn phù hợp với nguyên liệu trong tủ lạnh</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaClock className="text-blue-500 text-xl" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Tiết kiệm thời gian</h3>
              <p className="text-gray-500 text-sm">Lên kế hoạch, đi chợ và nấu ăn hiệu quả</p>
            </div>
          </div>
        </div>
      </section>

      
      {/* CTA Section - khác nhau cho guest vs logged in */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {isAuthenticated ? (
            /* Logged in: Quick actions */
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Bắt đầu nấu ăn ngay!</h2>
              <p className="text-orange-100 mb-6 max-w-lg">
                Khám phá công thức mới, quản lý tủ lạnh và tạo bộ sưu tập của riêng bạn.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  to="/recipes/create"
                  className="flex items-center gap-3 p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                >
                  <FaPlus className="text-2xl" />
                  <div>
                    <p className="font-semibold">Tạo công thức</p>
                    <p className="text-sm text-orange-100">Chia sẻ món của bạn</p>
                  </div>
                </Link>
                <Link
                  to="/collections"
                  className="flex items-center gap-3 p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                >
                  <FaBook className="text-2xl" />
                  <div>
                    <p className="font-semibold">Bộ sưu tập</p>
                    <p className="text-sm text-orange-100">Lưu công thức yêu thích</p>
                  </div>
                </Link>
                <Link
                  to="/pantry"
                  className="flex items-center gap-3 p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                >
                  <FaClock className="text-2xl" />
                  <div>
                    <p className="font-semibold">Tủ lạnh số</p>
                    <p className="text-sm text-orange-100">Quản lý nguyên liệu</p>
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            /* Guest: Sign up CTA */
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-4">Bạn chưa có tài khoản?</h2>
              <p className="text-green-100 mb-6 max-w-lg mx-auto">
                Đăng ký ngay để lưu công thức yêu thích, tạo bộ sưu tập riêng và nhận gợi ý món ăn phù hợp với bạn.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors"
                >
                  Đăng ký miễn phí
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg border border-green-400 hover:bg-green-500 transition-colors"
                >
                  Đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}