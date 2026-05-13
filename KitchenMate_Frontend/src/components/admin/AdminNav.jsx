import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Carrot,
  Users,
  FolderOpen,
  Flag,
  Scale,
} from 'lucide-react'
import { cn } from '@/utils'

const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/admin/recipes', icon: BookOpen, label: 'Công thức' },
  { to: '/admin/ingredients', icon: Carrot, label: 'Nguyên liệu' },
  { to: '/admin/users', icon: Users, label: 'Người dùng' },
  { to: '/admin/categories', icon: FolderOpen, label: 'Danh mục' },
  { to: '/admin/reports', icon: Flag, label: 'Báo cáo' },
  { to: '/admin/units', icon: Scale, label: 'Đơn vị' },
]

export function AdminNav() {
  const location = useLocation()

  return (
    <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border)]">
      <nav className="flex overflow-x-auto px-4 py-2 gap-1 scrollbar-hide">
        {adminNavItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to ||
            (to !== '/admin' && location.pathname.startsWith(to))

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] font-medium text-sm whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default AdminNav
