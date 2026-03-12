import { CollectionConfig, FieldHook } from 'payload'
import { isAdmin } from './Users'

export const setAlt: FieldHook = ({ value, data }) => value || data?.filename

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { es: 'Medio' },
    plural: { es: 'Medios' },
  },
  access: {
    admin: ({ req: { user } }) => isAdmin(user),
    create: ({ req: { user } }) => isAdmin(user),
    read: () => true,
    update: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => isAdmin(user),
  },
  admin: {
    group: {
      es: 'Administración',
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: { es: 'Texto alternativo' },
      required: true,
      hooks: {
        beforeChange: [setAlt],
      },
    },
  ],
  upload: true,
}
