import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/authApi';
import InputField from '../components/ui/InputField';
import PasswordField from '../components/ui/PasswordField';

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  full_name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['password_confirm'],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await authApi.register(data);
      const { user, tokens } = response.data;
      login(user, tokens.access, tokens.refresh);
      toast.success('Đăng ký thành công!');
      navigate('/home');
    } catch (error) {
      const errorData = error.response?.data?.error?.details;
      if (errorData) {
        Object.keys(errorData).forEach((field) => {
          setError(field, { message: errorData[field][0]?.message || errorData[field][0] });
        });
      } else {
        toast.error(error.response?.data?.error?.message || 'Đăng ký thất bại');
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        Tạo tài khoản mới
      </h2>
      <p className="text-slate-500 mb-6">
        Tham gia KitchenMate để bắt đầu hành trình ẩm thực của bạn
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <InputField
          label="Email"
          type="email"
          placeholder="email@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <InputField
          label="Họ và tên"
          type="text"
          placeholder="Nguyễn Văn A"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <PasswordField
          label="Mật khẩu"
          placeholder="Tối thiểu 8 ký tự"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordField
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          error={errors.password_confirm?.message}
          {...register('password_confirm')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-orange-500 text-white font-semibold
            rounded-lg hover:bg-orange-600 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-slate-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-orange-500 font-medium hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}