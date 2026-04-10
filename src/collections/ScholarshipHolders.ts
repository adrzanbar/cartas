import type { CollectionConfig, Where } from 'payload'
import { getManagedAuthorIds, isAdmin, isEditor, isReviewer } from './Users'
import { User } from '@/payload-types'

const whereManager = (user: User | null): Where => {
  return { id: { in: getManagedAuthorIds(user) } }
}

export const ScholarshipHolder: CollectionConfig = {
  slug: 'scholarship-holders',
  labels: {
    singular: { es: 'Becario' },
    plural: { es: 'Becarios' },
  },
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => !isAdmin(user),
    group: {
      es: 'Personas',
    },
  },
  access: {
    create: ({ req: { user } }) => isAdmin(user),
    read: ({ req: { user } }) => {
      if (isAdmin(user) || isReviewer(user)) return true
      if (isEditor(user)) return whereManager(user)
      return false
    },
    update: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => isAdmin(user),
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
    {
      name: 'sponsors',
      type: 'relationship',
      label: { es: 'Padrinos' },
      relationTo: 'sponsors',
      hasMany: true,
    },
  ],
}
