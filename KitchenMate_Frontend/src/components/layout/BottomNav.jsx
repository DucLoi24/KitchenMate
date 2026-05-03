import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Compass, PlusCircle, UtensilsCrossed, ShoppingCart, Lightbulb, Bookmark, Settings } from 'lucide-react'
import { cn } from '@/components/ui/Button'
import { useAuth } from '@/components/auth/AuthContext'

const navItems = [
  { to: '/', icon: Home, label: 'Trang chủ' },
  { to: '/explore', icon: Compass, label: 'Khám phá' },
  { to: '/recipe/new', icon: PlusCircle, label: 'Tạo', isCreate: true },
  { to: '/pantry', icon: UtensilsCrossed, label: 'Tủ lạnh' },
  { to: '/collections', icon: Bookmark, label: 'Bộ sưu tập' },
  { to: '/suggest', icon: Lightbulb, label: 'Gợi ý' },
]

const adminNavItem = { to: '/admin', icon: Settings, label: 'Quản trị' }

export function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const isAdmin = user?.is_staff || user?.is_superuser

  const allItems = isAdmin ? [...navItems, adminNavItem] : navItems

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
      </div>
    </nav>
  )
}

export default BottomNav