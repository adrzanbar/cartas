import type { CollectionConfig } from 'payload'
import { isAdmin, isReviewer } from './Users'

export const ScholarshipHolders: CollectionConfig = {
  slug: 'scholarship-holders',
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
      name: 'educationLevel',
      type: 'select',
      label: { es: 'Nivel educativo' },
      required: true,
      options: [
        { label: { es: 'Primario' }, value: 'primary' },
        { label: { es: 'Secundario' }, value: 'secondary' },
        { label: { es: 'Terciario' }, value: 'tertiary' },
      ],
    },
  ],
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
  labels: {
    singular: { es: 'Becario' },
    plural: { es: 'Becarios' },
  },
}
