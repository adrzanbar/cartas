import { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const Deliveries: CollectionConfig = {
  slug: 'deliveries',
  fields: [
    { name: 'letter', type: 'relationship', relationTo: 'letters', required: true },
    { name: 'recipient', type: 'relationship', relationTo: 'sponsors', required: true },
  ],
  access: {
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  admin: {
    group: {
      es: 'Administración',
    },
    hidden: ({ user }) => !isAdmin(user),
  },
  labels: {
    singular: { es: 'Entrega' },
    plural: { es: 'Entregas' },
  },
}
