import { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const ScholarshipHolderMediations: CollectionConfig = {
  slug: 'scholarship-holder-mediations',
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: { es: 'Usuario' },
    },
    {
      name: 'scholarshipHolder',
      type: 'relationship',
      relationTo: 'scholarship-holders',
      required: true,
      label: { es: 'Becario' },
    },
  ],
  indexes: [
    {
      fields: ['user', 'scholarshipHolder'],
      unique: true,
    },
  ],
  admin: {
    hidden: ({ user }) => !isAdmin(user),
    group: {
      es: 'Administración',
    },
  },
}
