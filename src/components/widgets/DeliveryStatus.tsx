import type { WidgetServerProps } from 'payload'
import { isAdmin } from '@/collections/Users'
import { PieClient } from './PieClient'

export default async function DeliveryStatus({ req }: WidgetServerProps) {
  const { payload, user, query } = req
  if (!user || !isAdmin(user)) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--theme-elevation-500)' }}>
        No autorizado
      </div>
    )
  }

  const campaignId = typeof query?.campaign === 'string' ? query.campaign : undefined
  const whereBase = (sent: boolean) => {
    const base: any = { sentAt: { exists: sent } }
    if (campaignId) base['letter.campaign'] = { equals: campaignId }
    return base
  }

  const [sent, pending] = await Promise.all([
    payload.count({
      collection: 'deliveries',
      where: whereBase(true),
      overrideAccess: true,
    }),
    payload.count({
      collection: 'deliveries',
      where: whereBase(false),
      overrideAccess: true,
    }),
  ])

  const data = [
    { name: 'Enviadas', value: sent.totalDocs },
    { name: 'Pendientes', value: pending.totalDocs },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600 }}>Estado de entregas</h3>
        <p style={{ textAlign: 'center', color: 'var(--theme-elevation-500)', margin: 0 }}>Sin datos</p>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600 }}>Estado de entregas</h3>
      <PieClient data={data} />
    </div>
  )
}
