import { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const EmailTemplates: CollectionConfig = {
  slug: 'email-templates',
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { es: 'Nombre' },
      required: true,
    },
    {
      name: 'template',
      type: 'code',
      admin: {
        language: 'handlebars',
      },
      label: { es: 'Plantilla' },
      required: true,
    },
    {
      name: 'images',
      type: 'array',
      label: { es: 'Imágenes' },
      minRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: { es: 'Imagen' },
          required: true,
        },
      ],
    },
  ],
  access: {
    create: ({ req: { user } }) => (user ? isAdmin(user) : false),
    read: ({ req: { user } }) => (user ? isAdmin(user) : false),
    update: ({ req: { user } }) => (user ? isAdmin(user) : false),
    delete: ({ req: { user } }) => (user ? isAdmin(user) : false),
  },
  admin: {
    useAsTitle: 'name',
    group: {
      es: 'Administración',
    },
    hidden: ({ user }) => !isAdmin(user),
  },
  labels: {
    singular: { es: 'Plantilla de correo' },
    plural: { es: 'Plantillas de correo' },
  },
}
