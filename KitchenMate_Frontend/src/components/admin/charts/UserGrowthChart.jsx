/**
 * User Growth Chart - KitchenMate Admin
 *
 * LineChart showing new_users over 7 days
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const CHART_COLORS = {
  primary: 'var(--color-primary)',
  grid: 'var(--color-border)',
  text: 'var(--color-text-secondary)',
  background: 'var(--color-surface)',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
      <p className="text-sm text-[var(--color-primary)]">
        Người dùng mới: <span className="font-semibold">{payload[0]?.value ?? 0}</span>
      </p>
    </div>
  )
}

export function UserGrowthChart({ data = [], loading = false, error = null, onRetry }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-display font-semibold text-[var(--color-text)]">Tăng trưởng người dùng</h3>
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
          <h3 className="font-display font-semibold text-[var(--color-text)]">Tăng trưởng người dùng</h3>
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
          <h3 className="font-display font-semibold text-[var(--color-text)]">Tăng trưởng người dùng</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">7 ngày gần nhất</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">Chưa có dữ liệu tăng trưởng</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-display font-semibold text-[var(--color-text)]">Tăng trưởng người dùng</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">7 ngày gần nhất</p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
              <Line
                type="monotone"
                dataKey="new_users"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS.primary, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: CHART_COLORS.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default UserGrowthChart