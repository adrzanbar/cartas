import { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const EmailTemplates: CollectionConfig = {
  slug: 'email-templates',
  labels: {
    singular: { es: 'Plantilla de correo' },
    plural: { es: 'Plantillas de correo' },
  },
  access: {
    create: ({ req: { user } }) => isAdmin(user),
    read: ({ req: { user } }) => isAdmin(user),
    update: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => isAdmin(user),
  },
  admin: {
    useAsTitle: 'name',
    group: {
      es: 'Administración',
    },
    hidden: ({ user }) => !isAdmin(user),
  },
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
      label: { es: 'Plantilla' },
      required: true,
      admin: {
        language: 'handlebars',
      },
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
          label: { es: 'Imagen' },
          relationTo: 'media',
          required: true,
        },
      ],
    },
  ],
}
