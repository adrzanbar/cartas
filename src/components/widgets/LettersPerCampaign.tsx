import type { WidgetServerProps } from 'payload'
import { BarClient } from './BarClient'

export default async function LettersPerCampaign({ req }: WidgetServerProps) {
  const { payload } = req

  const campaigns = await payload.find({
    collection: 'campaigns',
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })

  const data = await Promise.all(
    campaigns.docs.map(async (camp) => {
      const result = await payload.count({
        collection: 'letters',
        where: { campaign: { equals: camp.id } },
        overrideAccess: true,
      })
      return { name: camp.name ?? `ID ${camp.id}`, value: result.totalDocs }
    }),
  )

  const nonZero = data.filter((d) => d.value > 0)

  if (nonZero.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--theme-elevation-500)' }}>
        Sin datos
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600 }}>
        Cartas por campaña
      </h3>
      <BarClient data={nonZero} />
    </div>
  )
}
