import type { CollectionConfig } from 'payload'
import { isAdmin, isEditor, isReviewer } from './Users'

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  labels: {
    singular: { es: 'Padrino' },
    plural: { es: 'Padrinos' },
  },
  access: {
    create: ({ req: { user } }) => isAdmin(user),
    update: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => isAdmin(user),
  },
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => !isAdmin(user),
    group: {
      es: 'Personas',
    },
  },
  fields: [
    {
      name: 'nationalId',
      type: 'text',
      label: { es: 'Documento de identidad' },
      required: true,
      unique: true,
    },
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
    },
  ],
}
