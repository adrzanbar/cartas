import type { CollectionConfig, Where } from 'payload'
import { isAdmin } from './Users'

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { es: 'Nombre' },
      required: true,
    },
    {
      name: 'organizationName',
      type: 'text',
      label: { es: 'Nombre de la organización' },
      required: false,
    },
    {
      name: 'email',
      type: 'email',
      label: { es: 'Correo electrónico' },
      unique: true,
    },
  ],
  access: {
    create: ({ req: { user } }) => (user ? isAdmin(user) : false),
    update: ({ req: { user } }) => (user ? isAdmin(user) : false),
    delete: ({ req: { user } }) => (user ? isAdmin(user) : false),
  },
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => !isAdmin(user),
    group: {
      es: 'Personas',
    },
    hideAPIURL: true,
  },
  labels: {
    singular: { es: 'Padrino' },
    plural: { es: 'Padrinos' },
  },
}
