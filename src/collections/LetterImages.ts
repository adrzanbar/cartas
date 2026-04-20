import type { Access, CollectionConfig, Where } from 'payload'
import { isAdmin, isMediator, isReviewer, isScholarshipHolder } from './Users'
import { LetterImage } from '@/payload-types'

export const access: Access<LetterImage> = ({ req: { user }, data }) => {
  if (!user) return false
  if (isAdmin(user) || isReviewer(user)) return true
  if (!data?.author) return true
  const or: Where[] = []
  if (isScholarshipHolder(user)) {
    or.push({ 'author.user': { equals: user.id } })
  }
  if (isMediator(user)) {
    or.push({ 'author.mediator': { equals: user.id } })
  }
  if (or.length === 0) return false
  return { or }
}

export const LetterImages: CollectionConfig = {
  slug: 'letter-images',
  fields: [
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'scholarship-holders',
      access: {
        update: () => false,
      },
      admin: {
        hidden: true,
      },
      label: { es: 'Autor' },
    },
  ],
  access: {
    create: access,
    read: access,
    update: access,
    delete: access,
  },
  admin: {
    hidden: ({ user }) => !isAdmin(user),
    group: {
      es: 'Cartas',
    },
  },
  labels: {
    singular: { es: 'Imagen de Carta' },
    plural: { es: 'Imágenes de Carta' },
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
  },
}
