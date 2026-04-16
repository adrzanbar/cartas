import { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const Scholarships: CollectionConfig = {
  slug: 'scholarships',
  fields: [
    {
      name: 'scholarshipHolder',
      type: 'relationship',
      relationTo: 'scholarship-holders',
      required: true,
      label: { es: 'Becario' },
    },
    {
      name: 'sponsor',
      type: 'relationship',
      relationTo: 'sponsors',
      required: true,
      label: { es: 'Padrino' },
    },
  ],
  indexes: [
    {
      fields: ['scholarshipHolder', 'sponsor'],
      unique: true,
    },
  ],
  access: {
    create: ({ req: { user } }) => isAdmin(user),
    update: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => isAdmin(user),
  },
  admin: {
    hidden: ({ user }) => !isAdmin(user),
    group: { es: 'Personas' },
  },
}
