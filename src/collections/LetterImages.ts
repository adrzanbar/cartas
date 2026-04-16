import type { CollectionConfig } from 'payload'
import { isAdmin, isEditor, isReviewer } from './Users'
import { setAlt } from './Media'
import { whereAuthorManager } from './Letters'

export const LetterImages: CollectionConfig = {
  slug: 'letter-images',
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      access: {
        update: () => false,
      },
      admin: { hidden: true },
      hooks: { beforeChange: [setAlt] },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'scholarship-holders',
      required: true,
      access: {
        update: () => false,
      },
      admin: { hidden: true },
    },
  ],
  access: {
    create: async ({ req: { payload, user }, data }) => {
      if (!user) return false
      if (isAdmin(user) || isReviewer(user)) return true
      if (isEditor(user)) return whereAuthorManager(payload, user)
      return false
    },
    read: async ({ req: { payload, user }, data }) => {
      if (!user) return false
      if (isAdmin(user) || isReviewer(user)) return true
      if (isEditor(user)) return whereAuthorManager(payload, user)
      return false
    },
    update: async ({ req: { payload, user }, data }) => {
      if (!user) return false
      if (isAdmin(user) || isReviewer(user)) return true
      if (isEditor(user)) return whereAuthorManager(payload, user)
      return false
    },
    delete: async ({ req: { payload, user }, data }) => {
      if (!user) return false
      if (isAdmin(user) || isReviewer(user)) return true
      if (isEditor(user)) return whereAuthorManager(payload, user)
      return false
    },
  },
  admin: {
    group: {
      es: 'Cartas',
    },
    hidden: ({ user }) => !isAdmin(user),
  },
  labels: {
    singular: { es: 'Imagen de Carta' },
    plural: { es: 'Imágenes de Carta' },
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
  },
}
