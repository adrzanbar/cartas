import type { Access, CollectionConfig, Where } from 'payload'
import { isAdmin, isMediator, isReviewer, isScholarshipHolder } from './Users'
import { LetterImage } from '@/payload-types'

export const access: Access<LetterImage> = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user) || isReviewer(user)) return true
  const or: Where[] = [{ owner: { equals: user.id } }]
  if (isMediator(user)) {
    or.push({ 'author.mediator': { equals: user.id } })
  }
  if (isScholarshipHolder(user)) {
    or.push({ 'author.user': { equals: user.id } })
  }
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
        create: () => false,
        read: ({ req: { user } }) => (user ? isAdmin(user) : false),
        update: () => false,
      },
      label: { es: 'Autor' },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      access: {
        create: () => false,
        read: ({ req: { user } }) => (user ? isAdmin(user) : false),
        update: () => false,
      },
      defaultValue: ({ user }) => (user ? user.id : undefined),
      label: { es: 'Dueño' },
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
    hideAPIURL: true,
  },
  labels: {
    singular: { es: 'Imagen de Carta' },
    plural: { es: 'Imágenes de Carta' },
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
  },
}
