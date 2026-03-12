import type { CollectionConfig } from 'payload'
import { isAdmin, isEditor, isReviewer } from './Users'
import { whereAuthorManager } from './Letters'
import { setAlt } from './Media'

export const LetterImages: CollectionConfig = {
  slug: 'letter-images',
  labels: {
    singular: { es: 'Imagen de Carta' },
    plural: { es: 'Imágenes de Carta' },
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user) || isReviewer(user)) return true
      if (isEditor(user)) return whereAuthorManager(user)
      return false
    },
    update: ({ req: { user } }) => {
      if (isAdmin(user) || isReviewer(user)) return true
      if (isEditor(user)) return whereAuthorManager(user)
      return false
    },
    delete: ({ req: { user } }) => {
      if (isAdmin(user) || isReviewer(user)) return true
      if (isEditor(user)) return whereAuthorManager(user)
      return false
    },
  },
  admin: {
    hidden: ({ user }) => !isAdmin(user),
    group: {
      es: 'Cartas',
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: { es: 'Texto alternativo' },
      required: true,
      hooks: { beforeChange: [setAlt] },
      admin: { hidden: true },
    },
    {
      name: 'author',
      type: 'relationship',
      label: { es: 'Autor' },
      relationTo: 'scholarship-holders',
      admin: { readOnly: true },
      access: {
        update: () => false,
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    staticDir: '/app/letter-images',
  },
}
