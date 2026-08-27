import { PieChart as PieChartIcon } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, EmptyState } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { CountByKey } from '@/types'

export interface StatusDonutProps {
  data: CountByKey[]
  completionRate: number
  className?: string
}

/** Mirrors the dot colours in STATUS_META so the board and the chart agree. */
const STATUS_COLORS: Record<string, string> = {
  backlog: '#94a3b8',
  todo: '#0ea5e9',
  in_progress: '#f59e0b',
  in_review: '#7c4dff',
  done: '#10b981',
}

const FALLBACK_COLOR = '#7c4dff'

interface DonutTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string | number; value?: number | string; payload?: CountByKey }>
  total: number
}

function DonutTooltip({ active, payload, total }: DonutTooltipProps) {
  const slice = payload?.[0]
  if (!active || !slice) return null
  const datum = slice.payload
  const count = Number(slice.value ?? 0)
  const share = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="glass rounded-xl px-3 py-2 shadow-[0_18px_40px_-20px_rgba(10,12,18,0.6)]">
      <div className="flex items-center gap-2 text-xs">
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: STATUS_COLORS[datum?.key ?? ''] ?? FALLBACK_COLOR }}
        />
        <span className="font-medium">{datum?.label ?? slice.name}</span>
        <span className="ml-2 font-semibold tabular-nums">{count}</span>
        <span className="text-muted tabular-nums">({share}%)</span>
      </div>
    </div>
  )
}

export function StatusDonut({ data, completionRate, className }: StatusDonutProps) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0)
  const slices = data.filter((entry) => entry.count > 0)

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader title="Status mix" description="Every task across your projects" />
      <CardContent className="flex-1">
        {total === 0 ? (
          <EmptyState
            icon={PieChartIcon}
            title="Nothing to chart yet"
            description="Create a few tasks and the status mix will appear here."
            className="py-10"
          />
        ) : (
          <>
            <div className="relative mx-auto h-[190px] w-full max-w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="count"
                    nameKey="label"
                    innerRadius="68%"
                    outerRadius="94%"
                    paddingAngle={slices.length > 1 ? 3 : 0}
                    cornerRadius={6}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    isAnimationActive
                  >
                    {slices.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? FALLBACK_COLOR} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip total={total} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">{total}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">tasks</p>
                  <p className="mt-2 inline-flex rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 tabular-nums dark:text-emerald-300">
                    {completionRate}% done
                  </p>
                </div>
              </div>
            </div>

            <ul className="mt-5 space-y-2">
              {data.map((entry) => {
                const share = total > 0 ? Math.round((entry.count / total) * 100) : 0
                return (
                  <li key={entry.key} className="flex items-center gap-2.5 text-sm">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry.key] ?? FALLBACK_COLOR }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px]">{entry.label}</span>
                    <span className="text-[11px] text-muted tabular-nums">{share}%</span>
                    <span className="w-7 text-right text-[13px] font-semibold tabular-nums">{entry.count}</span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
