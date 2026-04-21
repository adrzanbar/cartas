import { CollectionConfig, FieldHook } from 'payload'
import { isAdmin } from './Users'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { es: 'Medio' },
    plural: { es: 'Medios' },
  },
  access: {
    create: ({ req: { user } }) => (user ? isAdmin(user) : false),
    read: () => true,
  },
  admin: {
    group: {
      es: 'Administración',
    },
    hidden: ({ user }) => !isAdmin(user),
    hideAPIURL: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: { es: 'Texto alternativo' },
      required: true,
    },
  ],
  upload: true,
}
