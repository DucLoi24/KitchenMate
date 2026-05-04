/**
 * Admin Dashboard Page - KitchenMate
 *
 * Step 4: Dashboard with stat cards
 * - Displays 4 stat cards: Người dùng, Công thức, Chờ duyệt, Nguyên liệu
 * - Graceful fallback when backend stats MISSING ("Tính năng đang phát triển")
 * - Loading skeletons while fetching
 * - Error state with retry button
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, Clock, Carrot, AlertTriangle, RefreshCw, Construction } from 'lucide-react'

import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { UserGrowthChart, RecipeSubmissionsChart, TotalViewsChart } from '@/components/admin/charts'

// Stat card colors
const STAT_COLORS = {
  default: {
    bg: 'bg-[var(--color-primary)]/10',
    icon: 'text-[var(--color-primary)]',
  },
  warning: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-500',
  },
  success: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-500',
  },
  info: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-500',
  },
}

// Stat card configuration
const STAT_CARDS = [
  {
    key: 'users',
    label: 'Người dùng',
    icon: Users,
    color: 'info',
  },
  {
    key: 'recipes',
    label: 'Công thức',
    icon: BookOpen,
    color: 'success',
  },
  {
    key: 'pending',
    label: 'Chờ duyệt',
    icon: Clock,
    color: 'warning',
  },
  {
    key: 'ingredients',
    label: 'Nguyên liệu',
    icon: Carrot,
    color: 'default',
  },
]

// Loading skeleton for stat cards
function StatCardSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-4 w-20 bg-[var(--color-background-alt)] rounded animate-pulse" />
          <div className="h-8 w-16 bg-[var(--color-background-alt)] rounded animate-pulse" />
        </div>
        <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-background-alt)] animate-pulse" />
      </div>
    </div>
  )
}

// Stat card component
function StatCard({ label, value, icon: Icon, color = 'default', loading = false }) {
  const colors = STAT_COLORS[color] || STAT_COLORS.default

  if (loading) {
    return <StatCardSkeleton />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 hover:shadow-[var(--shadow-md)] transition-shadow duration-[var(--transition-base)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm font-medium mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-[var(--color-text)]">
            {value ?? '—'}
          </p>
        </div>
        <div className={cn('w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center', colors.bg)}>
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>
      </div>
    </motion.div>
  )
}

// Error state component
function ErrorState({ message, onRetry }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        Đã xảy ra lỗi
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm mb-4 max-w-sm">
        {message || 'Không thể tải dữ liệu. Vui lòng thử lại.'}
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" />
        Thử lại
      </Button>
    </div>
  )
}

// Fallback state for missing backend feature
function FallbackState({ message }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-[var(--color-primary)]" />
      </div>
      <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">
        Tính năng đang phát triển
      </h3>
      <p className="text-[var(--color-text-secondary)] text-sm max-w-sm">
        {message || 'Dữ liệu thống kê sẽ sớm được cập nhật.'}
      </p>
    </div>
  )
}

// Main dashboard component
export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [backendAvailable, setBackendAvailable] = useState(true)
  const [chartData, setChartData] = useState({ user_growth: [], recipe_submissions: [], total_views: [] })
  const [chartsLoading, setChartsLoading] = useState(false)
  const [chartsError, setChartsError] = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const { adminApi: api } = await import('@/api/adminApi')

      const results = await Promise.allSettled([
        api.getUsers({ page_size: 1 }),
        api.getRecipeAll({ page_size: 1 }),
        api.getRecipePending({ page_size: 1 }),
        api.getIngredientAll({ page_size: 1 }),
        api.getIngredientPending({ page_size: 1 }),
      ])

      const [usersRes, recipesRes, pendingRecipesRes, ingredientsRes, pendingIngredientsRes] = results

      const userCount = usersRes.status === 'fulfilled' ? usersRes.value.data?.count ?? 0 : 0
      const recipeCount = recipesRes.status === 'fulfilled' ? recipesRes.value.data?.count ?? 0 : 0
      const pendingRecipeCount = pendingRecipesRes.status === 'fulfilled' ? pendingRecipesRes.value.data?.count ?? 0 : 0
      const ingredientCount = ingredientsRes.status === 'fulfilled' ? ingredientsRes.value.data?.count ?? 0 : 0
      const pendingIngredientCount = pendingIngredientsRes.status === 'fulfilled' ? pendingIngredientsRes.value.data?.count ?? 0 : 0

      setStats({
        users: userCount,
        recipes: recipeCount,
        ingredients: ingredientCount,
        pending: pendingRecipeCount + pendingIngredientCount,
      })
      setBackendAvailable(true)
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
      setError(err?.message || 'Không thể tải dữ liệu thống kê')
      setBackendAvailable(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchCharts = async () => {
    setChartsLoading(true)
    setChartsError(null)
    try {
      const { adminApi: api } = await import('@/api/adminApi')
      const response = await api.getCharts(7)
      if (response?.success && response?.data) {
        setChartData({
          user_growth: response.data.user_growth || [],
          recipe_submissions: response.data.recipe_submissions || [],
          total_views: response.data.total_views || [],
        })
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err)
      setChartsError(err?.message || 'Không thể tải dữ liệu biểu đồ')
    } finally {
      setChartsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchCharts()
  }, [])

  // Render fallback if backend feature is missing
  if (!backendAvailable && !loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
            Tổng quan
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            Thống kê tổng quan hệ thống
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FallbackState message="Dữ liệu thống kê sẽ sớm được cập nhật khi backend hỗ trợ." />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)]">
          Tổng quan
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          Thống kê tổng quan hệ thống
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStats} />
        ) : (
          STAT_CARDS.map((card, index) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard
                label={card.label}
                value={stats?.[card.key]}
                icon={card.icon}
                color={card.color}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
        <UserGrowthChart data={chartData.user_growth} loading={chartsLoading} error={chartsError} onRetry={fetchCharts} />
        <TotalViewsChart data={chartData.total_views} loading={chartsLoading} error={chartsError} onRetry={fetchCharts} />
      </div>
      <div className="mt-4">
        <RecipeSubmissionsChart data={chartData.recipe_submissions} loading={chartsLoading} error={chartsError} onRetry={fetchCharts} />
      </div>

      {/* Quick Actions Section */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text)] mb-4">
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Quản lý công thức"
            description="Duyệt hoặc từ chối công thức mới"
            icon={BookOpen}
            to="/admin/recipes"
          />
          <QuickActionCard
            title="Quản lý nguyên liệu"
            description="Duyệt hoặc từ chối nguyên liệu mới"
            icon={Carrot}
            to="/admin/ingredients"
          />
          <QuickActionCard
            title="Quản lý người dùng"
            description="Xem và quản lý tài khoản người dùng"
            icon={Users}
            to="/admin/users"
          />
        </div>
      </div>
    </div>
  )
}

// Quick action card component
function QuickActionCard({ title, description, icon: Icon, to }) {
  return (
    <a
      href={to}
      className="block bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-primary)]/30 transition-all duration-[var(--transition-base)]"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="font-medium text-[var(--color-text)] mb-1">{title}</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
        </div>
      </div>
    </a>
  )
}

export default DashboardPage