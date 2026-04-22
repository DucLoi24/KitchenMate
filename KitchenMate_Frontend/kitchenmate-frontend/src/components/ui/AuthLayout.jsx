import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[--color-background] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[--color-primary]">KitchenMate</h1>
          <p className="text-[--color-text-secondary] mt-2">
            Nấu ăn thông minh, sống khỏe mỗi ngày
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-[--color-border] p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
