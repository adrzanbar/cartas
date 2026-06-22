import type { CollectionConfig } from 'payload'
import { isAdmin } from './Users'

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { es: 'Nombre' },
    },
    {
      name: 'organizationName',
      type: 'text',
      label: { es: 'Nombre de la organización' },
    },
    {
      name: 'nationalId',
      type: 'text',
      label: { es: 'DNI' },
    },
    {
      name: 'laborTaxUniqueKey',
      type: 'text',
      label: { es: 'CUIL/CUIT' },
    },
    {
      name: 'email',
      type: 'email',
      label: { es: 'Correo electrónico' },
    },
  ],
  access: {
    create: ({ req: { user } }) => (user ? isAdmin(user) : false),
    update: ({ req: { user } }) => (user ? isAdmin(user) : false),
    delete: ({ req: { user } }) => (user ? isAdmin(user) : false),
  },
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => !isAdmin(user),
    group: {
      es: 'Personas',
    },
    hideAPIURL: true,
    components: {
      listMenuItems: ['@/components/ImportCSV#ImportPadrinos'],
    },
  },
  labels: {
    singular: { es: 'Padrino' },
    plural: { es: 'Padrinos' },
  },
}
