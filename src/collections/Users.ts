import { User } from '@/payload-types'
import type { ClientUser, CollectionConfig } from 'payload'

export const isAdmin = (user: User | ClientUser | null) => {
  return user?.roles?.includes('admin') ?? false
}
export const isReviewer = (user: User | null) => {
  return user?.roles?.includes('reviewer') ?? false
}
export const isEditor = (user: User | null) => {
  return user?.roles?.includes('editor') ?? false
}
export const getManagedAuthorIds = (user: User | null): number[] =>
  (user?.managedAuthors ?? []).map((a) => (typeof a === 'number' ? a : a.id))

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { es: 'Usuario' },
    plural: { es: 'Usuarios' },
  },
  access: {
    create: ({ req: { user } }) => isAdmin(user),
    read: ({ req: { user } }) => isAdmin(user),
    update: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => isAdmin(user),
  },
  admin: {
    useAsTitle: 'email',
    group: {
      es: 'Administración',
    },
  },
  auth: true,
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
      name: 'roles',
      type: 'select',
      label: { es: 'Roles' },
      required: true,
      hasMany: true,
      options: [
        { label: { es: 'Administrador' }, value: 'admin' },
        { label: { es: 'Editor' }, value: 'editor' },
        { label: { es: 'Revisor' }, value: 'reviewer' },
      ],
    },
    {
      name: 'managedAuthors',
      type: 'relationship',
      label: { es: 'Autores gestionados' },
      relationTo: 'scholarship-holders',
      hasMany: true,
    },
  ],
}
