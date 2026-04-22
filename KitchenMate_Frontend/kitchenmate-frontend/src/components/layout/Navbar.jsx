import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useState, useRef, useEffect } from 'react';
import { BiSearch, BiUser, BiBookAlt, BiLogOut, BiChevronDown } from 'react-bootstrap-icons';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">KM</span>
          </div>
          <span className="text-xl font-bold text-orange-500 hidden sm:block">KitchenMate</span>
        </Link>

        {/* Search bar - hidden on mobile, visible on md+ */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-xl items-center bg-gray-100 rounded-full px-4 py-2"
        >
          <BiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Tìm kiếm công thức..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none w-full text-sm"
          />
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Create button - desktop */}
              <Link
                to="/recipes/create"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                <span>+ Tạo công thức</span>
              </Link>

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <BiChevronDown className="text-gray-400 text-xs hidden sm:block" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-sm text-gray-900">{user?.username}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      to={`/profile/${user?.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowDropdown(false)}
                    >
                      <BiUser className="text-gray-400" />
                      Hồ sơ
                    </Link>
                    <Link
                      to="/collections"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowDropdown(false)}
                    >
                      <BiBookAlt className="text-gray-400" />
                      Bộ sưu tập
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 w-full text-left"
                    >
                      <BiLogOut className="text-red-400" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile search - visible on mobile */}
      <form
        onSubmit={handleSearch}
        className="md:hidden px-4 pb-3"
      >
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <BiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Tìm kiếm công thức..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>
      </form>
    </header>
  );
}