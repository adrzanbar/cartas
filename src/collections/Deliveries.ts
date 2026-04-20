import { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const Deliveries: CollectionConfig = {
  slug: 'deliveries',
  fields: [
    {
      name: 'letter',
      type: 'relationship',
      relationTo: 'letters',
      label: { es: 'Carta' },
      required: true,
    },
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'sponsors',
      label: { es: 'Destinatario' },
      required: true,
    },
    { name: 'sentAt', type: 'date', label: { es: 'Enviada en' } },
  ],
  admin: {
    group: {
      es: 'Administración',
    },
  },
  access: {
    create: () => false,
    read: ({ req: { user } }) => (user ? isAdmin(user) : false),
    update: () => false,
    delete: () => false,
  },
  labels: {
    singular: { es: 'Entrega' },
    plural: { es: 'Entregas' },
  },
}
