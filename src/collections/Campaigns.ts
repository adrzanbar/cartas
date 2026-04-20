import { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  labels: {
    singular: { es: 'Campaña' },
    plural: { es: 'Campañas' },
  },
  fields: [
    {
      name: 'subject',
      type: 'text',
      hasMany: false,
      label: { es: 'Asunto' },
      minLength: 1,
      required: true,
    },
    {
      name: 'sendAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: "d 'de' MMMM yyyy, h:mm aa",
        },
      },
      label: { es: 'Enviar el' },
      required: true,
    },
    {
      name: 'emailTemplate',
      type: 'relationship',
      relationTo: 'email-templates',
      label: { es: 'Plantilla de correo' },
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      label: { es: 'Mensaje' },
    },
  ],
  access: {
    create: ({ req: { user } }) => (user ? isAdmin(user) : false),
    update: ({ req: { user } }) => (user ? isAdmin(user) : false),
    delete: ({ req: { user } }) => (user ? isAdmin(user) : false),
  },
  admin: {
    useAsTitle: 'subject',
    group: {
      es: 'Administración',
    },
    hidden: ({ user }) => !isAdmin(user),
  },
}
