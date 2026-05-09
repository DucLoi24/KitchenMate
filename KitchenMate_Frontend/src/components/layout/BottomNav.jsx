import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Compass, PlusCircle, UtensilsCrossed, Lightbulb, Bookmark, Settings, ChefHat, Bell } from 'lucide-react'
import { cn } from '@/utils'
import { useAuth } from '@/components/auth/useAuth'
import { useState, useEffect } from 'react'
import { notificationApi } from '@/api/reportsApi'
import { NotificationPopup } from '@/components/notification/NotificationPopup'

const navItems = [
  { to: '/', icon: Home, label: 'Trang chủ' },
  { to: '/explore', icon: Compass, label: 'Khám phá' },
  { to: '/recipe/new', icon: PlusCircle, label: 'Tạo', isCreate: true },
  { to: '/my-recipes', icon: ChefHat, label: 'Công thức' },
  { to: '/pantry', icon: UtensilsCrossed, label: 'Tủ lạnh' },
  { to: '/collections', icon: Bookmark, label: 'Bộ sưu tập' },
  { to: '/suggest', icon: Lightbulb, label: 'Gợi ý' },
]

const adminNavItem = { to: '/admin', icon: Settings, label: 'Quản trị' }

export function BottomNav() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const isAdmin = user?.is_staff || user?.is_superuser
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const allItems = isAdmin ? [...navItems, adminNavItem] : navItems

  // Poll for unread notification count
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {allItems.map(({ to, icon: Icon, label, isCreate }) => {
          const isActive = location.pathname === to ||
            (to !== '/' && location.pathname.startsWith(to))

          if (isCreate) {
            return (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-[var(--shadow-lg)] hover:bg-[var(--color-primary-light)] active:scale-95 transition-all">
                  <PlusCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] mt-1 text-[var(--color-text-secondary)] font-medium">
                  {label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-[var(--radius-md)] transition-colors min-w-[56px]',
                isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 w-12 h-0.5 bg-[var(--color-primary)] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn('w-5 h-5', isActive ? 'stroke-[2.5]' : '')} />
              <span className={cn('text-[10px] font-medium', isActive ? 'text-[var(--color-primary)]' : '')}>
                {label}
              </span>
            </Link>
          )
        })}

        {/* Notification Bell */}
        {isAuthenticated && (
          <button
            onClick={() => setShowNotifications(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-[var(--radius-md)] transition-colors min-w-[56px]'
            )}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Thông báo</span>
          </button>
        )}
      </div>

      <NotificationPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </nav>
  )
}

export default BottomNav