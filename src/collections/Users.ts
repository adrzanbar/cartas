import { User } from '@/payload-types'
import type { ClientUser, CollectionConfig } from 'payload'

export const isAdmin = (user: User | ClientUser) => {
  return user?.roles?.includes('admin') ?? false
}
export const isReviewer = (user: User) => {
  return user?.roles?.includes('reviewer') ?? false
}
export const isMediator = (user: User) => {
  return user?.roles?.includes('mediator') ?? false
}
export const isScholarshipHolder = (user: User) => {
  return user?.roles?.includes('scholarshipHolder') ?? false
}

export const Users: CollectionConfig = {
  slug: 'users',
  fields: [
    {
      name: 'name',
      type: 'text',
      access: {
        update: ({ req: { user } }) => (user ? isAdmin(user) : false),
      },
      label: { es: 'Nombre' },
      required: true,
    },
    {
      name: 'username',
      type: 'text',
      access: {
        update: ({ req: { user } }) => (user ? isAdmin(user) : false),
      },
      required: true,
      unique: true,
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        update: ({ req: { user } }) => (user ? isAdmin(user) : false),
      },
      hasMany: true,
      label: { es: 'Roles' },
      required: true,
      options: [
        { label: { es: 'Administrador' }, value: 'admin' },
        { label: { es: 'Revisor' }, value: 'reviewer' },
        { label: { es: 'Mediador' }, value: 'mediator' },
        { label: { es: 'Becario' }, value: 'scholarshipHolder' },
      ],
    },
  ],
  access: {
    create: ({ req: { user } }) => (user ? isAdmin(user) : false),
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isAdmin(user)) return true
      return { id: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isAdmin(user)) return true
      return { id: { equals: user.id } }
    },
    delete: ({ req: { user } }) => (user ? isAdmin(user) : false),
  },
  admin: {
    useAsTitle: 'username',
    group: {
      es: 'Administración',
    },
    hidden: ({ user }) => !isAdmin(user),
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: (args) => {
        return `
        Estás recibiendo este correo porque tú (o alguien más) ha solicitado restablecer la contraseña de tu cuenta. Por favor haz clic en el siguiente enlace o pégalo en tu navegador para completar el proceso: ${process.env.NEXT_PUBLIC_SERVER_URL}/admin/reset/${args?.token} Si no solicitaste esto, por favor ignora este correo y tu contraseña permanecerá sin cambios.
        `
      },
    },
    loginWithUsername: {
      allowEmailLogin: true,
    },
  },
  labels: {
    singular: { es: 'Usuario' },
    plural: { es: 'Usuarios' },
  },
}
