import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';
import PasswordField from '../components/ui/PasswordField';

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  newPasswordConfirm: z.string(),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['newPasswordConfirm'],
});

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetSchema),
  });

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-500">Token không hợp lệ hoặc đã hết hạn.</p>
      </div>
    );
  }

  const onSubmit = async (data) => {
    try {
      await authApi.resetPassword(token, data.newPassword, data.newPasswordConfirm);
      toast.success('Đặt lại mật khẩu thành công!');
      navigate('/login');
    } catch (error) {
      toast.error('Không thể đặt lại mật khẩu. Token có thể đã hết hạn.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">
        Đặt lại mật khẩu
      </h2>
      <p className="text-[--color-text-secondary] mb-6">
        Nhập mật khẩu mới cho tài khoản của bạn
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <PasswordField
          label="Mật khẩu mới"
          placeholder="Tối thiểu 8 ký tự"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />

        <PasswordField
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          error={errors.newPasswordConfirm?.message}
          {...register('newPasswordConfirm')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-[--color-primary] text-white font-semibold
            rounded-lg hover:bg-[--color-primary-dark] transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </div>
  );
}
