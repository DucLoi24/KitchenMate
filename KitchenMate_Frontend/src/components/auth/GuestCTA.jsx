import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChefHat, Lock, UtensilsCrossed, ShoppingCart, Lightbulb, Bookmark, User } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/components/ui/Button'

const contextConfig = {
  pantry: {
    icon: UtensilsCrossed,
    title: 'Quản lý tủ lạnh',
    message: 'Theo dõi nguyên liệu có sẵn trong tủ lạnh để nhận gợi ý món ăn phù hợp.',
  },
  shopping: {
    icon: ShoppingCart,
    title: 'Danh sách đi chợ',
    message: 'Tạo danh sách mua sắm thông minh, tự động cập nhật từ tủ lạnh.',
  },
  suggest: {
    icon: Lightbulb,
    title: 'Gợi ý món ăn',
    message: 'AI phân tích tủ lạnh để gợi ý món ăn phù hợp nhất với bạn.',
  },
  'create-recipe': {
    icon: ChefHat,
    title: 'Tạo công thức',
    message: 'Chia sẻ công thức nấu ăn của bạn với cộng đồng.',
  },
  collections: {
    icon: Bookmark,
    title: 'Bộ sưu tập',
    message: 'Lưu và sắp xếp các công thức yêu thích của bạn.',
  },
  profile: {
    icon: User,
    title: 'Trang cá nhân',
    message: 'Xem và chỉnh sửa thông tin cá nhân, công thức đã tạo.',
  },
}

const defaultConfig = {
  icon: Lock,
  title: 'Đăng nhập để tiếp tục',
  message: 'Kết nối tài khoản để truy cập tính năng này và nhiều lợi ích khác.',
}

export function GuestCTA({ context = null, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const config = contextConfig[context] || defaultConfig
  const Icon = config.icon

  const handleLogin = () => {
    navigate(`/login?from=${location.pathname}`)
  }

  const handleRegister = () => {
    navigate(`/register?from=${location.pathname}`)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Backdrop blur overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[var(--color-background)]/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="relative bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)] p-8 sm:p-10 min-w-[320px] max-w-md w-full text-center"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-[var(--color-primary)]" />
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-semibold text-[var(--color-text)] mb-2">
          {config.title}
        </h3>

        {/* Message */}
        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
          {config.message}
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleLogin}
            className="w-full"
          >
            Đăng nhập
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleRegister}
            className="w-full"
          >
            Đăng ký miễn phí
          </Button>
        </div>

        {/* Close hint */}
        <p className="text-xs text-[var(--color-text-muted)] mt-4">
          Hoặc{' '}
          <button
            onClick={onClose}
            className="text-[var(--color-primary)] hover:underline"
          >
            quay lại trang chủ
          </button>
        </p>
      </motion.div>
    </div>
  )
}

export default GuestCTA
