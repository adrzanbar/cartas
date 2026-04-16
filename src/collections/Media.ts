import { CollectionConfig, FieldHook } from 'payload'
import { isAdmin } from './Users'

export const setAlt: FieldHook = ({ value, data }) => value || data?.filename

export const Media: CollectionConfig = {
  slug: 'media',
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      hooks: {
        beforeChange: [setAlt],
      },
    },
  ],
  access: {
    create: ({ req: { user } }) => isAdmin(user),
    read: () => true,
    update: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => isAdmin(user),
  },
  admin: {
    group: {
      es: 'Administración',
    },
    hidden: ({ user }) => !isAdmin(user),
  },
  labels: {
    singular: { es: 'Medio' },
    plural: { es: 'Medios' },
  },
  upload: true,
}
