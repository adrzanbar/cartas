import type { WidgetServerProps } from 'payload'
import { CampaignFilterClient } from './CampaignFilterClient'

export default async function CampaignFilter({ req }: WidgetServerProps) {
  const { payload, query } = req
  // No role check — the filter toolbar is intentionally visible to all users
  // so every role can narrow down the data widgets below.
  // Load all campaigns (limit arbitrary high value for admin UI)
  const campaigns = await payload.find({
    collection: 'campaigns',
    limit: 200,
    sort: '-createdAt',
    overrideAccess: true,
  })

  // Grab the current campaign from the URL query (if any)
  const initialSelected = typeof query?.campaign === 'string' ? query.campaign : null

  return (
    <div className="card" style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600 }}>
        Filtrar por campaña
      </h3>
      <CampaignFilterClient
        campaigns={campaigns.docs.map((c) => ({ id: String(c.id), name: c.name }))}
        initialSelected={initialSelected}
      />
    </div>
  )
}
