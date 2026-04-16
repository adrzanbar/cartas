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

export const Users: CollectionConfig = {
  slug: 'users',
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
  ],
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
  auth: {
    forgotPassword: {
      generateEmailHTML: (args) => {
        return `
        Estás recibiendo este correo porque tú (o alguien más) ha solicitado restablecer la contraseña de tu cuenta. Por favor haz clic en el siguiente enlace o pégalo en tu navegador para completar el proceso: ${process.env.NEXT_PUBLIC_SERVER_URL}/admin/reset/${args?.token} Si no solicitaste esto, por favor ignora este correo y tu contraseña permanecerá sin cambios.
        `
      },
    },
  },
  labels: {
    singular: { es: 'Usuario' },
    plural: { es: 'Usuarios' },
  },
}
