# Dashboard Widgets

Experimental Payload feature — modular dashboard with resizable, draggable widgets.

## Config

```typescript
// payload.config.ts
admin: {
  dashboard: {
    widgets: [
      {
        slug: 'my-widget',          // unique id
        Component: '/components/MyWidget',    // default export
        // Component: '/components/MyWidget#NamedExport',  // named export
        fields: [
          { name: 'title', type: 'text' },
          { name: 'showTrend', type: 'checkbox' },
        ],
        minWidth: 'small',
        maxWidth: 'medium',
      },
    ],
    defaultLayout: ({ req }) => [
      { widgetSlug: 'collections', width: 'full' },
      { widgetSlug: 'my-widget', data: { title: 'Stats' }, width: 'medium' },
    ],
  },
}
```

### WidgetWidth values

`'x-small' | 'small' | 'medium' | 'large' | 'x-large' | 'full'`

## Widget Component

Server Component, receives `WidgetServerProps`:

```typescript
import type { WidgetServerProps } from 'payload'
import type { MyWidgetWidget } from '@/payload-types'

export default async function MyWidget({ req, widgetData }: WidgetServerProps<MyWidgetWidget>) {
  const { payload } = req
  // payload.count(), payload.find(), etc.
  return (
    <div className="card">
      <h3>{widgetData?.title ?? 'Default'}</h3>
    </div>
  )
}
```

- Use `className="card"` for consistent Payload look.
- Theme CSS vars: `var(--theme-elevation-0)` bg, `var(--theme-text)` text, `var(--theme-elevation-500)` muted.

## Built-in widget

`collections` — shows collection/global cards. Auto-included if no `defaultLayout`.

## User customization

Users click breadcrumb → "Edit Dashboard" → add/reorder/resize/delete widgets, saved to preferences. "Reset Layout" reverts to `defaultLayout`.

## Client-side charts (Recharts)

For charts (pie, bar, line, area), use a client component wrapping Recharts:

```typescript
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function PieWidgetClient({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
          {data.map((_, i) => (
            <Cell key={i} fill={`var(--theme-elevation-${(i % 4) * 200 + 200})`} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}
```

Wrap it in a Server Component widget that fetches data:

```typescript
import PieWidgetClient from './PieWidgetClient'
import type { WidgetServerProps } from 'payload'

export default async function SponsorBreakdownWidget({ req }: WidgetServerProps) {
  const { payload } = req
  const sponsors = await payload.count({ collection: 'sponsors' })
  const holders = await payload.count({ collection: 'scholarship-holders' })
  return (
    <div className="card">
      <h3>Sponsors vs Holders</h3>
      <PieWidgetClient data={[
        { name: 'Sponsors', value: sponsors.totalDocs },
        { name: 'Holders', value: holders.totalDocs },
      ]} />
    </div>
  )
}
```

### Available chart packages (check package.json)

- `recharts` — likely already installed (peer dep of shadcn/ui)
- `lucide-react` — icons only, not charts

Use `recharts` for: PieChart, BarChart, LineChart, AreaChart, etc.

## Big Number widget

```typescript
export default async function CountWidget({ req }: WidgetServerProps) {
  const count = await req.payload.count({ collection: 'letters' })
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>{count.totalDocs}</p>
      <p style={{ color: 'var(--theme-elevation-500)', margin: 0 }}>Cartas</p>
    </div>
  )
}
```

## Important notes

- After adding component: `pnpm generate:importmap`
- Widgets are **experimental** in Payload 3.x — API may change.
- Each plugin can define its own widgets.

## Current Widgets (FONBEC Cartas)

| Slug | Component | Description |
|---|---|---|
| `stats-row` | `/components/widgets/StatsRow` | Big number cards: cartas, aprobadas, pendientes, becarios, padrinos, pendientes envío |
| `education-pie` | `/components/widgets/EducationPie` | Donut chart: scholarship holders by education level |
| `delivery-status` | `/components/widgets/DeliveryStatus` | Pie chart: sent vs pending deliveries |
| `letters-per-campaign` | `/components/widgets/LettersPerCampaign` | Bar chart: letters per campaign |

### Layout

```
[collections          ] full
[stats-row            ] full
[education-pie] [delivery-status]  medium/medium
[letters-per-campaign ] full
```

### Files

| File | Type |
|---|---|
| `src/components/widgets/StatsRow.tsx` | Server widget |
| `src/components/widgets/EducationPie.tsx` | Server widget → PieClient |
| `src/components/widgets/DeliveryStatus.tsx` | Server widget → PieClient |
| `src/components/widgets/LettersPerCampaign.tsx` | Server widget → BarClient |
| `src/components/widgets/PieClient.tsx` | Client (recharts) |
| `src/components/widgets/BarClient.tsx` | Client (recharts) |

### TypeScript note

`defaultLayout` in `payload.config.ts` uses `as (args: { req: any }) => any` cast to bypass Payload's overly restrictive `WidgetInstance` type that only recognizes the built-in `collections` slug.
