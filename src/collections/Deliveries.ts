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
    { name: 'sentAt', type: 'date', label: { es: 'Fecha de envío' } },
    {
      name: 'campaign',
      type: 'relationship',
      relationTo: 'campaigns',
      label: { es: 'Campaña' },
      virtual: 'letter.campaign',
    },
  ],
  admin: {
    group: {
      es: 'Administración',
    },
    hideAPIURL: true,
  },
  access: {
    create: () => false,
    read: ({ req: { user } }) => user && isAdmin(user),
    update: () => false,
    delete: () => false,
  },
  labels: {
    singular: { es: 'Entrega' },
    plural: { es: 'Entregas' },
  },
}
