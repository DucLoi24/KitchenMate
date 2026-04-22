import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BiHome, BiCompass, BiLightbulb, BiSnow, BiUser } from 'bootstrap-icons';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

// Tabs cho guest (chua dang nhap)
const guestNavItems = [
  { path: '/home', label: 'Trang chủ', icon: BiHome },
  { path: '/explore', label: 'Khám phá', icon: BiCompass },
  { path: null, label: 'Gợi ý', icon: BiLightbulb, protected: true },
  { path: null, label: 'Tủ lạnh', icon: BiSnow, protected: true },
  { path: null, label: 'Hồ sơ', icon: BiUser, protected: true },
];

// Tabs cho logged in
const loggedInNavItems = [
  { path: '/home', label: 'Trang chủ', icon: BiHome },
  { path: '/explore', label: 'Khám phá', icon: BiCompass },
  { path: '/suggestions', label: 'Gợi ý', icon: BiLightbulb },
  { path: '/pantry', label: 'Tủ lạnh', icon: BiSnow },
  { path: '/profile', label: 'Hồ sơ', icon: BiUser, hasBadge: true },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // Placeholder notification count - will come from API later
  const notificationCount = user?.notification_count || 0;

  const navItems = isAuthenticated ? loggedInNavItems : guestNavItems;

  const handleProtectedClick = (e, item) => {
    if (item.protected) {
      e.preventDefault();
      toast.error('Cần đăng nhập để sử dụng tính năng này');
      navigate('/login', { state: { from: location.pathname } });
    }
  };

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path ||
      (path === '/home' && (location.pathname === '/' || location.pathname === ''));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          if (item.protected) {
            return (
              <button
                key={item.label}
                onClick={(e) => handleProtectedClick(e, item)}
                className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
              >
                <div className="relative">
                  <Icon className="text-lg mb-0.5" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors ${
                active
                  ? 'text-orange-500 bg-orange-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon className="text-lg mb-0.5" />
                {item.hasBadge && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}