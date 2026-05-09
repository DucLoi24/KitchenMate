import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  Bell,
} from 'lucide-react'
import { useAuth } from '@/components/auth/useAuth'
import { cn } from '@/utils'
import { NotificationPopup } from '@/components/notification/NotificationPopup'
import { notificationApi } from '@/api/reportsApi'

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

export function Sidebar({ isOpen = true }) {
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
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

  return (
    <>
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 240 : 72,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col h-[calc(100vh-4rem)] sticky top-16 bg-[var(--color-surface)] border-r border-[var(--color-border)] overflow-hidden"
      >
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {allNavItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to ||
                (to !== '/' && location.pathname.startsWith(to))

              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-all duration-[var(--transition-fast)] group relative',
                      isActive
                        ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-alt)] hover:text-[var(--color-text)]'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--color-primary-dark)] rounded-r-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className={cn('w-5 h-5 flex-shrink-0', isOpen ? '' : 'mx-auto')} />
                    {isOpen && (
                      <span className="font-medium truncate">{label}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {isAuthenticated && (
          <div className="border-t border-[var(--color-border)] py-4 px-3">
            <ul className="space-y-1">
              {bottomNavItems.map(({ to, icon: Icon, label }) => {
                const isActive = location.pathname === to

                return (
                  <li key={to}>
                    <Link
                      to={to}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-all duration-[var(--transition-fast)]',
                        isActive
                          ? 'bg-[var(--color-background-alt)] text-[var(--color-text)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-alt)] hover:text-[var(--color-text)]'
                      )}
                    >
                      <Icon className={cn('w-5 h-5 flex-shrink-0', isOpen ? '' : 'mx-auto')} />
                      {isOpen && <span className="font-medium truncate">{label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {isAuthenticated && (
          <div className="border-t border-[var(--color-border)] py-4 px-3">
            <button
              onClick={() => setShowNotifications(true)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-all duration-[var(--transition-fast)] w-full',
                'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-alt)] hover:text-[var(--color-text)]'
              )}
            >
              <div className="relative">
                <Bell className={cn('w-5 h-5 flex-shrink-0', isOpen ? '' : 'mx-auto')} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {isOpen && (
                <span className="font-medium truncate">Thông báo</span>
              )}
            </button>
          </div>
        )}
      </motion.aside>

      <NotificationPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  )
}

export default Sidebar
