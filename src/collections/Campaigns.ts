import { CollectionConfig, Where } from 'payload'
import { isAdmin } from './Users'

export const whereActiveAndsendAtAfter = (active: boolean, sendAt: Date): Where => {
  return {
    and: [{ active: { equals: active } }, { sendAt: { greater_than: sendAt.toISOString() } }],
  }
}

export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  fields: [
    {
      name: 'subject',
      type: 'text',
      label: { es: 'Asunto' },
      required: true,
    },
    {
      name: 'sendAt',
      type: 'date',
      label: { es: 'Enviar el' },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: { es: 'Activa' },
      defaultValue: true,
    },
    {
      name: 'email-template',
      type: 'relationship',
      label: { es: 'Plantilla de correo' },
      relationTo: 'email-templates',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      label: { es: 'Mensaje' },
    },
  ],
  admin: {
    useAsTitle: 'subject',
    group: {
      es: 'Administración',
    },
    hidden: ({ user }) => !isAdmin(user),
  },
  access: {
    create: ({ req: { user } }) => isAdmin(user),
    update: ({ req: { user } }) => isAdmin(user),
    delete: ({ req: { user } }) => isAdmin(user),
  },
  labels: {
    singular: { es: 'Campaña' },
    plural: { es: 'Campañas' },
  },
}
