import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
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

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Backend should handle sending reset email
      await authApi.forgotPassword(email)
      setIsSuccess(true)
    } catch (err) {
      const errorMsg = err.response?.data?.message ||
                       err.response?.data?.error ||
                       err.message ||
                       'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
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
            Đã gửi email!
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>.
            Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
          </p>
          <Link to="/login">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Quay lại đăng nhập
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
              Quên mật khẩu?
            </h1>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Không lo lắng! Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
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
                Khôi phục mật khẩu
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-5 h-5" />}
                required
                autoComplete="email"
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
                Gửi email khôi phục
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

export default ForgotPasswordPage