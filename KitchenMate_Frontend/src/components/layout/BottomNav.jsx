import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Compass,
  PlusCircle,
  UtensilsCrossed,
  ShoppingCart,
  Lightbulb,
  Bookmark,
  User,
  Settings,
  CircleDot,
  X,
  Bell,
} from 'lucide-react'
import { cn } from '@/utils'
import { useAuth } from '@/components/auth/useAuth'
import { useState, useEffect } from 'react'
import { notificationApi } from '@/api/reportsApi'
import { NotificationPopup } from '@/components/notification/NotificationPopup'

const navItems = [
  { to: '/', icon: Home, label: 'Trang chủ' },
  { to: '/explore', icon: Compass, label: 'Khám phá' },
  { to: '/recipe/new', icon: PlusCircle, label: 'Tạo công thức' },
  { to: '/my-recipes', icon: UtensilsCrossed, label: 'Công thức của tôi' },
  { to: '/pantry', icon: CircleDot, label: 'Tủ lạnh' },
  { to: '/shopping-list', icon: ShoppingCart, label: 'Danh sách đi chợ' },
  { to: '/suggest', icon: Lightbulb, label: 'Gợi ý món ăn' },
  { to: '/collections', icon: Bookmark, label: 'Bộ sưu tập' },
]

const bottomNavItems = [
  { to: '/profile', icon: User, label: 'Trang cá nhân' },
  { to: '/settings', icon: Settings, label: 'Cài đặt' },
]

export function MobileSidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const isAdmin = user?.is_staff || user?.is_superuser
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const allNavItems = isAdmin
    ? [...navItems, { to: '/admin', icon: Settings, label: 'Quản trị' }]
    : navItems

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchUnreadCount = async () => {
      try {
        const res = await notificationApi.getUnreadCount()
        setUnreadCount(res.data?.unread_count || 0)
      } catch {
        // Ignore errors
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  useEffect(() => {
    if (isOpen) {
      onClose()
    }
  }, [location.pathname])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-[var(--color-surface)] shadow-[var(--shadow-lg)] lg:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
              <Link to="/" className="flex items-center gap-2" onClick={onClose}>
                <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-xl font-semibold text-[var(--color-text)]">
                  KitchenMate
                </span>
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-background-alt)] transition-colors"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-1">
                {allNavItems.map(({ to, icon: Icon, label }) => {
                  const isActive = location.pathname === to ||
                    (to !== '/' && location.pathname.startsWith(to))

                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        onClick={onClose}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors duration-[var(--transition-fast)]',
                          isActive
                            ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-alt)] hover:text-[var(--color-text)]'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="mobile-sidebar-indicator"
                            className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[var(--color-primary-dark)]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              {isAuthenticated && (
                <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                  <ul className="space-y-1">
                    {bottomNavItems.map(({ to, icon: Icon, label }) => {
                      const isActive = location.pathname === to

                      return (
                        <li key={to}>
                          <Link
                            to={to}
                            onClick={onClose}
                            className={cn(
                              'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors duration-[var(--transition-fast)]',
                              isActive
                                ? 'bg-[var(--color-background-alt)] text-[var(--color-text)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-alt)] hover:text-[var(--color-text)]'
                            )}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium">{label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </nav>
            {isAuthenticated && (
              <div className="border-t border-[var(--color-border)] px-3 py-4">
                <button
                  onClick={() => setShowNotifications(true)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-background-alt)] hover:text-[var(--color-text)]'
                  )}
                >
                  <div className="relative">
                    <Bell className="h-5 w-5 flex-shrink-0" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">Thông báo</span>
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default MobileSidebar