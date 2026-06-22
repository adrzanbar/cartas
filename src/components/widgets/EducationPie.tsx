import type { WidgetServerProps } from 'payload'
import { isAdmin } from '@/collections/Users'
import { PieClient } from './PieClient'

export default async function EducationPie({ req }: WidgetServerProps) {
  const { payload, user } = req
  if (!user || !isAdmin(user)) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--theme-elevation-500)' }}>
        No autorizado
      </div>
    )
  }

  const [primary, secondary, tertiary] = await Promise.all([
    payload.count({
      collection: 'scholarship-holders',
      where: { educationLevel: { equals: 'primary' } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'scholarship-holders',
      where: { educationLevel: { equals: 'secondary' } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'scholarship-holders',
      where: { educationLevel: { equals: 'tertiary' } },
      overrideAccess: true,
    }),
  ])

  const data = [
    { name: 'Primario', value: primary.totalDocs },
    { name: 'Secundario', value: secondary.totalDocs },
    { name: 'Terciario', value: tertiary.totalDocs },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--theme-elevation-500)' }}>
        Sin datos
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600 }}>
        Becarios por nivel
      </h3>
      <PieClient data={data} innerRadius={35} />
    </div>
  )
}
