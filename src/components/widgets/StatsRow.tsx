import type { WidgetServerProps } from 'payload'
import { isAdmin } from '@/collections/Users'

export default async function StatsRow({ req }: WidgetServerProps) {
  const { payload, user, query } = req
  if (!user || !isAdmin(user)) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--theme-elevation-500)' }}>
        No autorizado
      </div>
    )
  }

  const campaignId = typeof query?.campaign === 'string' ? query.campaign : undefined
  const whereCampaign = campaignId ? { campaign: { equals: campaignId } } : undefined

  const [letters, lettersApproved, pendingDeliveries] = await Promise.all([
    payload.count({ collection: 'letters', where: whereCampaign, overrideAccess: true }),
    payload.count({
      collection: 'letters',
      where: { approved: { equals: true }, ...whereCampaign },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'deliveries',
      where: campaignId
        ? { sentAt: { exists: false }, 'letter.campaign': { equals: campaignId } }
        : { sentAt: { exists: false } },
      overrideAccess: true,
    }),
  ])

  const items: { label: string; value: number; color: string }[] = [
    { label: 'Cartas', value: letters.totalDocs, color: 'var(--theme-elevation-900)' },
    { label: 'Aprobadas', value: lettersApproved.totalDocs, color: 'var(--theme-success-500)' },
    { label: 'Pendientes de aprobación', value: letters.totalDocs - lettersApproved.totalDocs, color: 'var(--theme-warning-500)' },
    { label: 'Pendientes envío', value: pendingDeliveries.totalDocs, color: 'var(--theme-error-500)' },
  ]

  const grid = (gridItems: { label: string; value: number; color: string }[]) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
      }}
    >
      {gridItems.map((item) => (
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

  return grid(items)
}
