import { Activity as ActivityIcon } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, EmptyState } from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'
import { useTheme } from '@/store/theme'
import type { TrendPoint } from '@/types'

export interface TrendChartProps {
  data: TrendPoint[]
  className?: string
}

const SERIES: Record<string, { label: string; color: string }> = {
  created: { label: 'Created', color: '#7c4dff' },
  completed: { label: 'Completed', color: '#22d3ee' },
}

interface TooltipEntry {
  dataKey?: string | number
  value?: number | string
  color?: string
  name?: string | number
}

interface TrendTooltipProps {
  active?: boolean
  label?: string | number
  payload?: TooltipEntry[]
}

function TrendTooltip({ active, label, payload }: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="glass min-w-[150px] rounded-xl px-3 py-2 shadow-[0_18px_40px_-20px_rgba(10,12,18,0.6)]">
      <p className="text-[11px] font-semibold tracking-tight text-muted">
        {formatDate(String(label ?? ''), 'EEE, MMM d')}
      </p>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry) => {
          const key = String(entry.dataKey ?? entry.name ?? '')
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color ?? SERIES[key]?.color }}
              />
              <span className="text-muted">{SERIES[key]?.label ?? key}</span>
              <span className="ml-auto font-semibold tabular-nums">{entry.value ?? 0}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

export function TrendChart({ data, className }: TrendChartProps) {
  const { theme } = useTheme()
  const axis = theme === 'dark' ? '#8f9aad' : '#6b7688'
  const cursor = theme === 'dark' ? '#3a4256' : '#c3cad6'

  const created = data.reduce((sum, point) => sum + point.created, 0)
  const completed = data.reduce((sum, point) => sum + point.completed, 0)

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader
        title="Throughput"
        description={`${created} created · ${completed} completed in the last 14 days`}
        action={
          <div className="flex items-center gap-3">
            <LegendChip color={SERIES.created.color} label="Created" />
            <LegendChip color={SERIES.completed.color} label="Completed" />
          </div>
        }
      />
      <CardContent className="flex-1 pl-1 pr-3">
        {data.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Task throughput shows up here as soon as work starts moving."
            className="py-10"
          />
        ) : (
          <div className="h-[260px] w-full sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES.created.color} stopOpacity={0.42} />
                    <stop offset="95%" stopColor={SERIES.created.color} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="trendCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES.completed.color} stopOpacity={0.36} />
                    <stop offset="95%" stopColor={SERIES.completed.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 6"
                  className="stroke-current opacity-10"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => formatDate(value, 'MMM d')}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={12}
                  minTickGap={24}
                  interval="preserveStartEnd"
                  tick={{ fill: axis, fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  width={30}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={6}
                  tick={{ fill: axis, fontSize: 11 }}
                />
                <Tooltip
                  content={<TrendTooltip />}
                  cursor={{ stroke: cursor, strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Created"
                  stroke={SERIES.created.color}
                  strokeWidth={2}
                  fill="url(#trendCreated)"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--app-panel)' }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke={SERIES.completed.color}
                  strokeWidth={2}
                  fill="url(#trendCompleted)"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--app-panel)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
