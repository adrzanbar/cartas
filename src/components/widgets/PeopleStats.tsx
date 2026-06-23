import type { WidgetServerProps } from 'payload'
import { isAdmin } from '@/collections/Users'

export default async function PeopleStats({ req }: WidgetServerProps) {
  const { payload, user } = req
  if (!user || !isAdmin(user)) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--theme-elevation-500)' }}>
        No autorizado
      </div>
    )
  }

  const [holders, sponsors] = await Promise.all([
    payload.count({ collection: 'scholarship-holders', overrideAccess: true }),
    payload.count({ collection: 'sponsors', overrideAccess: true }),
  ])

  const items: { label: string; value: number; color: string }[] = [
    { label: 'Becarios', value: holders.totalDocs, color: 'var(--theme-elevation-700)' },
    { label: 'Padrinos', value: sponsors.totalDocs, color: 'var(--theme-elevation-700)' },
  ]

  const grid = (gridItems: { label: string; value: number; color: string }[]) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
      }}
    >
      {gridItems.map(item => (
        <div
          key={item.label}
          className="card"
          style={{ textAlign: 'center', padding: '16px 12px' }}
        >
          <p
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
              color: item.color,
            }}
          >
            {item.value}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--theme-elevation-500)' }}>
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )

  return grid(items)
}
