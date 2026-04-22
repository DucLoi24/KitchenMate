import { Outlet } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import { House, ForkKnife, Leaf, People, Gear } from 'react-bootstrap-icons';

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: House },
  { path: '/admin/recipes/pending', label: 'Duyệt công thức', icon: ForkKnife },
  { path: '/admin/ingredients/pending', label: 'Duyệt nguyên liệu', icon: Leaf },
  { path: '/admin/users', label: 'Quản lý người dùng', icon: People },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shrink-0 hidden md:block">
        <div className="p-4 border-b border-gray-200">
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">KM</span>
            </div>
            <span className="text-xl font-bold text-orange-500">KitchenMate</span>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {adminNavItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="text-base" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4">
          <Link
            to="/home"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <Gear />
            Quay về trang chủ
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}