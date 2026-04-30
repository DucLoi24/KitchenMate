import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Check, X } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthContext'
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

// Password strength criteria
const passwordCriteria = [
  { id: 'length', label: 'Ít nhất 8 ký tự', test: (pwd) => pwd.length >= 8 },
  { id: 'uppercase', label: 'Chữ hoa (A-Z)', test: (pwd) => /[A-Z]/.test(pwd) },
  { id: 'lowercase', label: 'Chữ thường (a-z)', test: (pwd) => /[a-z]/.test(pwd) },
  { id: 'number', label: 'Số (0-9)', test: (pwd) => /\d/.test(pwd) },
  { id: 'special', label: 'Ký tự đặc biệt (!@#$...)', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
]

function getPasswordStrength(password) {
  const passed = passwordCriteria.filter((c) => c.test(password)).length
  if (passed === 0) return { level: 0, label: '', color: '' }
  if (passed <= 2) return { level: 1, label: 'Yếu', color: 'bg-red-500' }
  if (passed <= 3) return { level: 2, label: 'Trung bình', color: 'bg-yellow-500' }
  if (passed <= 4) return { level: 3, label: 'Khá mạnh', color: 'bg-green-500' }
  return { level: 4, label: 'Mạnh', color: 'bg-green-600' }
}

export function RegisterPage() {
  const { register } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    if (!agreedToTerms) {
      setError('Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật')
      return
    }
    if (passwordStrength.level < 2) {
      setError('Mật khẩu chưa đủ mạnh')
      return
    }

    setIsLoading(true)
    try {
      await register({ full_name: fullName, email, password })
    } catch (err) {
      // Extract error message - ensure it's always a string
      const responseMsg = err.response?.data?.message
      const responseErr = err.response?.data?.error
      const responseEmail = err.response?.data?.email?.[0]
      const responsePassword = err.response?.data?.password?.[0]
      const serverMsg = typeof responseMsg === 'string' ? responseMsg
        : typeof responseErr === 'string' ? responseErr
        : typeof responseEmail === 'string' ? responseEmail
        : typeof responsePassword === 'string' ? responsePassword
        : null
      const errorMsg = serverMsg || err.message || 'Đăng ký thất bại. Vui lòng thử lại.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding/Decoration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-secondary)] relative overflow-hidden">
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
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
              Tham gia<br />cùng chúng tôi
            </h1>
            <p className="text-lg text-white/80 mb-12 max-w-md leading-relaxed">
              Tạo tài khoản để khám phá công thức nấu ăn, quản lý tủ lạnh và chia sẻ đam mê ẩm thực với cộng đồng.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4">
              {[
                { icon: '✨', text: 'Lưu công thức yêu thích' },
                { icon: '📋', text: 'Danh sách nguyên liệu tự động' },
                { icon: '🤝', text: 'Kết nối cộng đồng đầu bếp' }
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

        {/* Decorative shapes */}
        <motion.div
          className="absolute top-20 -left-20 w-60 h-60 rounded-full bg-white/10"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-white/5"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-12 bg-[var(--color-background)]">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <motion.div variants={itemVariants} className="lg:hidden text-center mb-8">
            <h1 className="font-display text-3xl font-semibold text-[var(--color-secondary)] mb-2">
              KitchenMate
            </h1>
            <p className="text-[var(--color-text-secondary)]">Tạo tài khoản mới</p>
          </motion.div>

          {/* Form card */}
          <motion.div
            variants={itemVariants}
            className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] p-8 sm:p-10 shadow-[var(--shadow-xl)] border border-[var(--color-border)]"
          >
            <div className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-2">
                Đăng ký
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Đã có tài khoản?{' '}
                <Link
                  to="/login"
                  className="text-[var(--color-primary)] font-medium hover:underline"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Họ và tên"
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-5 h-5" />}
                required
                autoComplete="name"
                disabled={isLoading}
              />

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

              <div>
                <Input
                  label="Mật khẩu"
                  type="password"
                  placeholder="Tạo mật khẩu mạnh"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-5 h-5" />}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.level
                              ? passwordStrength.color
                              : 'bg-[var(--color-border)]'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {passwordStrength.label && (
                        <span className={passwordStrength.level >= 3 ? 'text-green-600' : 'text-yellow-600'}>
                          {passwordStrength.label}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {/* Password criteria checklist */}
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-1.5"
                  >
                    {passwordCriteria.slice(0, 3).map((criteria) => (
                      <div key={criteria.id} className="flex items-center gap-2 text-xs">
                        <span className={password.test(password) ? 'text-green-600' : 'text-[var(--color-text-muted)]'}>
                          {password.test(password) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </span>
                        <span className={password.test(password) ? 'text-green-600' : 'text-[var(--color-text-muted)]'}>
                          {criteria.label}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              <div>
                <Input
                  label="Xác nhận mật khẩu"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-5 h-5" />}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                  error={passwordsMismatch ? 'Mật khẩu không khớp' : undefined}
                />
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-[var(--color-text-secondary)] cursor-pointer">
                  Tôi đồng ý với{' '}
                  <Link to="/terms" className="text-[var(--color-primary)] hover:underline">
                    Điều khoản sử dụng
                  </Link>{' '}
                  và{' '}
                  <Link to="/privacy" className="text-[var(--color-primary)] hover:underline">
                    Chính sách bảo mật
                  </Link>
                </label>
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
                Tạo tài khoản
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default RegisterPage