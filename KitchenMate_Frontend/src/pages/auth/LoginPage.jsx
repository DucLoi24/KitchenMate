import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '@/components/auth/useAuth'
import { GoogleOAuthButton } from '@/components/auth/GoogleOAuthButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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

export function LoginPage() {
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  if (isAuthenticated) {
    const intended = location.state?.from || '/'
    return <Navigate to={intended} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      // Extract error message from various formats
      const data = err.response?.data
      let serverMsg = null

      if (typeof data?.message === 'string') {
        serverMsg = data.message
      } else if (typeof data?.error === 'string') {
        serverMsg = data.error
      } else if (typeof data?.error?.message === 'string') {
        // Handle {error: {message: "..."}} format
        serverMsg = data.error.message
      }

      const errorMsg = serverMsg || err.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding/Decoration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] relative overflow-hidden">
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="8" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circles)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="font-display text-5xl xl:text-6xl font-semibold leading-tight mb-6">
              Chào mừng<br />trở lại
            </h1>
            <p className="text-lg text-white/80 mb-12 max-w-md leading-relaxed">
              Khám phá hàng ngàn công thức nấu ăn ngon, quản lý tủ lạnh thông minh và chia sẻ đam mê ẩm thực của bạn.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4">
              {[
                { icon: '🍳', text: 'Gợi ý món ăn thông minh' },
                { icon: '📦', text: 'Quản lý nguyên liệu tủ lạnh' },
                { icon: '👨‍🍳', text: 'Công thức từ cộng đồng' }
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-white/90">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Decorative circles */}
        <motion.div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-white/10"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-12 bg-[var(--color-background)]">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-[28rem]"
        >
          {/* Mobile logo */}
          <motion.div variants={itemVariants} className="lg:hidden text-center mb-8">
            <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] mb-2">
              KitchenMate
            </h1>
            <p className="text-[var(--color-text-secondary)]">Đăng nhập để tiếp tục</p>
          </motion.div>

          {/* Form card */}
          <motion.div
            variants={itemVariants}
            className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] p-8 sm:p-10 shadow-[var(--shadow-xl)] border border-[var(--color-border)]"
          >
            <div className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-2">
                Đăng nhập
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Chưa có tài khoản?{' '}
                <Link
                  to="/register"
                  className="text-[var(--color-primary)] font-medium hover:underline"
                >
                  Đăng ký ngay
                </Link>
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

              <Input
                label="Mật khẩu"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-5 h-5" />}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />

              {/* Forgot password link */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

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
                rightIcon={!isLoading && <ArrowRight className="w-5 h-5" />}
              >
                Đăng nhập
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)]">
                  hoặc tiếp tục với
                </span>
              </div>
            </div>

            {/* Google OAuth */}
            <GoogleOAuthButton />
          </motion.div>

          {/* Footer note */}
          <motion.p
            variants={itemVariants}
            className="text-center text-sm text-[var(--color-text-muted)] mt-6"
          >
            Bằng việc đăng nhập, bạn đồng ý với{' '}
            <Link to="/terms" className="text-[var(--color-primary)] hover:underline">
              Điều khoản sử dụng
            </Link>{' '}
            và{' '}
            <Link to="/privacy" className="text-[var(--color-primary)] hover:underline">
              Chính sách bảo mật
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage