import { Flag } from 'lucide-react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, EmptyState } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useTheme } from '@/store/theme'
import type { CountByKey } from '@/types'

export interface PriorityBarsProps {
  data: CountByKey[]
  className?: string
}

/** Mirrors PRIORITY_META so chips and bars share a language. */
const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#f43f5e',
  high: '#f97316',
  medium: '#0ea5e9',
  low: '#94a3b8',
}

/** Most severe first — horizontal bars read top-down. */
const ORDER = ['urgent', 'high', 'medium', 'low']

interface BarTooltipProps {
  active?: boolean
  payload?: Array<{ value?: number | string; payload?: CountByKey }>
}

function BarTooltip({ active, payload }: BarTooltipProps) {
  const entry = payload?.[0]
  if (!active || !entry) return null
  const datum = entry.payload
  return (
    <div className="glass rounded-xl px-3 py-2 shadow-[0_18px_40px_-20px_rgba(10,12,18,0.6)]">
      <div className="flex items-center gap-2 text-xs">
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: PRIORITY_COLORS[datum?.key ?? ''] ?? '#7c4dff' }}
        />
        <span className="font-medium">{datum?.label ?? 'Priority'}</span>
        <span className="ml-2 font-semibold tabular-nums">{Number(entry.value ?? 0)}</span>
      </div>
    </div>
  )
}

export function PriorityBars({ data, className }: PriorityBarsProps) {
  const { theme } = useTheme()
  const axis = theme === 'dark' ? '#8f9aad' : '#6b7688'
  const track = theme === 'dark' ? '#1b2030' : '#eef0f4'

  const rank = (key: string) => {
    const index = ORDER.indexOf(key)
    return index === -1 ? ORDER.length : index
  }
  const ordered = [...data].sort((a, b) => rank(a.key) - rank(b.key))
  const total = ordered.reduce((sum, entry) => sum + entry.count, 0)
  const highest = ordered.reduce((max, entry) => Math.max(max, entry.count), 0)

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader title="Priority spread" description="Where the pressure sits right now" />
      <CardContent className="flex-1">
        {total === 0 ? (
          <EmptyState
            icon={Flag}
            title="No priorities yet"
            description="Tasks you create will be grouped by priority here."
            className="py-10"
          />
        ) : (
          <div className="h-[212px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ordered}
                layout="vertical"
                barSize={16}
                margin={{ top: 4, right: 34, left: 0, bottom: 4 }}
              >
                <XAxis type="number" hide domain={[0, Math.max(1, highest)]} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={72}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axis, fontSize: 12 }}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: track, opacity: 0.45 }} />
                <Bar
                  dataKey="count"
                  radius={[8, 8, 8, 8]}
                  background={{ fill: track, radius: 8 }}
                  isAnimationActive
                >
                  {ordered.map((entry) => (
                    <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key] ?? '#7c4dff'} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="right"
                    offset={10}
                    fill={axis}
                    fontSize={12}
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
