import type { WidgetServerProps } from 'payload'
import { isAdmin } from '@/collections/Users'

export default async function StatsRow({ req }: WidgetServerProps) {
  const { payload, user } = req
  if (!user || !isAdmin(user)) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--theme-elevation-500)' }}>
        No autorizado
      </div>
    )
  }

  const [letters, holders, sponsors, lettersApproved, pendingDeliveries] = await Promise.all([
    payload.count({ collection: 'letters', overrideAccess: true }),
    payload.count({ collection: 'scholarship-holders', overrideAccess: true }),
    payload.count({ collection: 'sponsors', overrideAccess: true }),
    payload.count({
      collection: 'letters',
      where: { approved: { equals: true } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'deliveries',
      where: { sentAt: { exists: false } },
      overrideAccess: true,
    }),
  ])

  const letterItems = [
    { label: 'Cartas', value: letters.totalDocs, color: 'var(--theme-elevation-900)' },
    { label: 'Aprobadas', value: lettersApproved.totalDocs, color: 'var(--theme-success-500)' },
    { label: 'Pendientes', value: letters.totalDocs - lettersApproved.totalDocs, color: 'var(--theme-warning-500)' },
    { label: 'Pendientes envío', value: pendingDeliveries.totalDocs, color: 'var(--theme-error-500)' },
  ]

  const peopleItems = [
    { label: 'Becarios', value: holders.totalDocs, color: 'var(--theme-elevation-700)' },
    { label: 'Padrinos', value: sponsors.totalDocs, color: 'var(--theme-elevation-700)' },
  ]

  const grid = (items: typeof letterItems) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="card"
          style={{
            textAlign: 'center',
            padding: '16px 12px',
          }}
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
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '13px',
              color: 'var(--theme-elevation-500)',
            }}
          >
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {grid(peopleItems)}
      {grid(letterItems)}
    </div>
  )
}
