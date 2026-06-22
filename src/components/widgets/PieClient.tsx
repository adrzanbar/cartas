'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

const COLORS = [
  'var(--theme-elevation-900)',
  'var(--theme-success-500)',
  'var(--theme-error-500)',
  'var(--theme-warning-500)',
  'var(--theme-elevation-500)',
]

export function PieClient({
  data,
  innerRadius,
}: {
  data: { name: string; value: number }[]
  innerRadius?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={innerRadius}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
