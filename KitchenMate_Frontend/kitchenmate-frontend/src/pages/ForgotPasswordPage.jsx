import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';
import InputField from '../components/ui/InputField';

const forgotSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data) => {
    try {
      await authApi.forgotPassword(data.email);
      toast.success('Đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn');
    } catch (error) {
      toast.error('Không thể gửi email. Vui lòng thử lại sau.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        Quên mật khẩu
      </h2>
      <p className="text-slate-500 mb-6">
        Nhập email để nhận hướng dẫn đặt lại mật khẩu
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <InputField
          label="Email"
          type="email"
          placeholder="email@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-orange-500 text-white font-semibold
            rounded-lg hover:bg-orange-600 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi email đặt lại'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-slate-500">
        Nhớ mật khẩu rồi?{' '}
        <Link to="/login" className="text-orange-500 font-medium hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
