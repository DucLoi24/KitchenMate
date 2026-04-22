import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/authApi';
import InputField from '../components/ui/InputField';
import PasswordField from '../components/ui/PasswordField';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const from = location.state?.from?.pathname || '/home';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await authApi.login(data);
      const { user, tokens } = response.data;
      login(user, tokens.access, tokens.refresh);
      toast.success('Đăng nhập thành công!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">
        Chào mừng trở lại
      </h2>
      <p className="text-[--color-text-secondary] mb-6">
        Đăng nhập để tiếp tục hành trình ẩm thực của bạn
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <InputField
          label="Email"
          type="email"
          placeholder="email@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordField
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-[--color-primary] hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-[--color-primary] text-white font-semibold
            rounded-lg hover:bg-[--color-primary-dark] transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-[--color-text-secondary]">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-[--color-primary] font-medium hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}