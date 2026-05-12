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
  const [isHovered, setIsHovered] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const isExpanded = isOpen || isHovered
  const sidebarWidthClass = isExpanded ? 'w-[240px]' : 'w-[72px]'
  const labelClass = cn(
    'min-w-0 overflow-hidden whitespace-nowrap font-medium transition-all duration-200 ease-out',
    isExpanded ? 'max-w-[160px] translate-x-0 opacity-100' : 'max-w-0 -translate-x-2 opacity-0'
  )

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
      <aside
        data-lenis-scroll="ignore"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="sticky top-16 z-[60] hidden h-[calc(100vh-4rem)] w-[72px] shrink-0 self-start lg:block"
      >
        <div
          className={cn(
            'absolute inset-0 z-[60] flex h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] transition-[width,box-shadow] duration-300 ease-out will-change-[width]',
            sidebarWidthClass
          )}
        >
          <nav
            onWheel={(e) => e.stopPropagation()}
            className="h-full overflow-y-auto px-3 py-4"
          >
            <div className="flex h-full flex-col">
              <ul className="space-y-1">
                {allNavItems.map(({ to, icon: Icon, label }) => {
                  const isActive = location.pathname === to ||
                    (to !== '/' && location.pathname.startsWith(to))

                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        aria-label={label}
                        title={isExpanded ? undefined : label}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors duration-[var(--transition-fast)]',
                          isActive
                            ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-alt)] hover:text-[var(--color-text)]'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-indicator"
                            className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[var(--color-primary-dark)]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <Icon className={cn('h-5 w-5 flex-shrink-0', isExpanded ? '' : 'mx-auto')} />
                        <span className={labelClass}>{label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {isAuthenticated && (
                <div className="mt-auto border-t border-[var(--color-border)] pt-4">
                  <ul className="space-y-1">
                    {bottomNavItems.map(({ to, icon: Icon, label }) => {
                      const isActive = location.pathname === to

                      return (
                        <li key={to}>
                          <Link
                            to={to}
                            aria-label={label}
                            title={isExpanded ? undefined : label}
                            className={cn(
                              'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors duration-[var(--transition-fast)]',
                              isActive
                                ? 'bg-[var(--color-background-alt)] text-[var(--color-text)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-alt)] hover:text-[var(--color-text)]'
                            )}
                          >
                            <Icon className={cn('h-5 w-5 flex-shrink-0', isExpanded ? '' : 'mx-auto')} />
                            <span className={labelClass}>{label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </nav>

          {isAuthenticated && (
            <div className="border-t border-[var(--color-border)] px-3 py-4">
              <button
                onClick={() => setShowNotifications(true)}
                aria-label="Thông báo"
                title={isExpanded ? undefined : 'Thông báo'}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-background-alt)] hover:text-[var(--color-text)]'
                )}
              >
                <div className="relative">
                  <Bell className={cn('h-5 w-5 flex-shrink-0', isExpanded ? '' : 'mx-auto')} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={labelClass}>Thông báo</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <NotificationPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  )
}

export default Sidebar
