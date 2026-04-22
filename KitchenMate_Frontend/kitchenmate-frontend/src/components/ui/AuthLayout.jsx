import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-500">KitchenMate</h1>
          <p className="text-slate-500 mt-2">
            Nấu ăn thông minh, sống khỏe mỗi ngày
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
