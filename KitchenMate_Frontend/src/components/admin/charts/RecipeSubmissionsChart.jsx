/**
 * Recipe Submissions Chart - KitchenMate Admin
 *
 * BarChart with 2 bars per day (new_recipes, public_recipes)
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const CHART_COLORS = {
  newRecipes: '#B85C38',
  publicRecipes: '#3D5A45',
  grid: 'var(--color-border)',
  text: 'var(--color-text-secondary)',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value ?? 0}</span>
        </p>
      ))}
    </div>
  )
}

function CustomLegend({ payload }) {
  if (!payload?.length) return null

  return (
    <div className="flex justify-center gap-6 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-[var(--color-text-secondary)]">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function RecipeSubmissionsChart({ data = [], loading = false, error = null, onRetry }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-display font-semibold text-[var(--color-text)]">Công thức nộp mới</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">7 ngày gần nhất</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-[var(--color-background-alt)] rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-display font-semibold text-[var(--color-text)]">Công thức nộp mới</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">7 ngày gần nhất</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-display font-semibold text-[var(--color-text)]">Công thức nộp mới</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">7 ngày gần nhất</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">Chưa có dữ liệu công thức</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-display font-semibold text-[var(--color-text)]">Công thức nộp mới</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">7 ngày gần nhất</p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                axisLine={{ stroke: CHART_COLORS.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Bar
                dataKey="new_recipes"
                name="Tạo mới"
                fill={CHART_COLORS.newRecipes}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="public_recipes"
                name="Công khai"
                fill={CHART_COLORS.publicRecipes}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default RecipeSubmissionsChart