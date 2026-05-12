import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authApi } from '@/api/authApi'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  },
  exit: { opacity: 0, transition: { duration: 0.3 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }

    setIsLoading(true)

    try {
      await authApi.resetPassword({
        uid,
        token,
        password,
        password_confirm: confirmPassword
      })
      setIsSuccess(true)
    } catch (err) {
      const errorMsg = err.response?.data?.message ||
                       err.response?.data?.error ||
                       err.message ||
                       'Không thể đặt lại mật khẩu. Link có thể đã hết hạn.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!uid || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-background)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center"
          >
            <AlertCircle className="w-10 h-10 text-red-600" />
          </motion.div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-3">
            Link không hợp lệ
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email đặt lại mật khẩu.
          </p>
          <Link to="/forgot-password">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Yêu cầu link mới
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-background)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-3">
            Đặt lại mật khẩu thành công!
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Mật khẩu của bạn đã được thay đổi. Bây giờ bạn có thể đăng nhập với mật khẩu mới.
          </p>
          <Link to="/login">
            <Button variant="primary" leftIcon={<Lock className="w-4 h-4" />}>
              Đăng nhập ngay
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link to="/" className="inline-flex items-center gap-2 mb-8 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại trang chủ</span>
            </Link>
            <h1 className="font-display text-5xl xl:text-6xl font-semibold leading-tight mb-6">
              Đặt lại mật khẩu
            </h1>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Nhập mật khẩu mới cho tài khoản của bạn. Đảm bảo mật khẩu có ít nhất 8 ký tự.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-12 bg-[var(--color-background)]">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-md"
        >
          {/* Mobile back link */}
          <motion.div variants={itemVariants} className="lg:hidden mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại đăng nhập</span>
            </Link>
          </motion.div>

          {/* Form card */}
          <motion.div
            variants={itemVariants}
            className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] p-8 sm:p-10 shadow-[var(--shadow-xl)] border border-[var(--color-border)]"
          >
            <div className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-2">
                Tạo mật khẩu mới
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Mật khẩu mới"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-5 h-5" />}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />

              <Input
                label="Xác nhận mật khẩu"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-5 h-5" />}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                Đặt lại mật khẩu
              </Button>
            </form>

            <p className="text-center text-sm text-[var(--color-text-secondary)] mt-6">
              Nhớ mật khẩu?{' '}
              <Link
                to="/login"
                className="text-[var(--color-primary)] font-medium hover:underline"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
