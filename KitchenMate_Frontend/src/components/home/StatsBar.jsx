// KitchenMate_Frontend/src/components/home/StatsBar.jsx
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Leaf, Heart, Bookmark } from 'lucide-react'
import { cn } from '@/utils'

const STATS_CONFIG = [
  {
    key: 'myRecipes',
    label: 'Công thức của tôi',
    icon: UtensilsCrossed,
    color: 'primary',
    navigate: '/my-recipes',
  },
  {
    key: 'pantry',
    label: 'Nguyên liệu',
    icon: Leaf,
    color: 'secondary',
    navigate: '/pantry',
  },
  {
    key: 'favorites',
    label: 'Đã thích',
    icon: Heart,
    color: 'accent',
    navigate: '/collections/favorites',
  },
  {
    key: 'saved',
    label: 'Đã lưu',
    icon: Bookmark,
    color: 'primary',
    navigate: '/collections',
  },
]

const COLOR_MAP = {
  primary: {
    bg: 'bg-[var(--color-primary)]/10',
    icon: 'text-[var(--color-primary)]',
  },
  secondary: {
    bg: 'bg-[var(--color-secondary)]/10',
    icon: 'text-[var(--color-secondary)]',
  },
  accent: {
    bg: 'bg-[var(--color-accent)]/10',
    icon: 'text-[var(--color-accent)]',
  },
}

export function StatsBar({ stats }) {
  const navigate = useNavigate()

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative -mt-8 max-w-7xl mx-auto px-4 lg:px-8"
    >
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS_CONFIG.map((config, index) => {
            const value = stats[config.key] ?? 0
            const Icon = config.icon
            const colors = COLOR_MAP[config.color]

            return (
              <motion.div
                key={config.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={() => navigate(config.navigate)}
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className={cn(
                  'w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center',
                  colors.bg
                )}>
                  <Icon className={cn('w-6 h-6', colors.icon)} />
                </div>
                <div className="font-display text-2xl font-bold text-[var(--color-text)]">
                  {value}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">{config.label}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}

export default StatsBar