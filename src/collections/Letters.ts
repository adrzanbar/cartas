import type { CollectionConfig, Where, CollectionAfterChangeHook, Payload } from 'payload'
import { isAdmin, isEditor, isReviewer } from './Users'
import { Letter, LetterImage, ScholarshipHolder, User } from '@/payload-types'
import { whereActiveAndsendAtAfter } from './Campaigns'

const statusOptions = [
  { label: { es: 'Borrador' }, value: 'draft' },
  { label: { es: 'Aprobado' }, value: 'approved' },
  { label: { es: 'Enviado' }, value: 'sent' },
]

const setLetterImageAuthor: CollectionAfterChangeHook<Letter> = async ({ doc, req }) => {
  const mediaIds = (doc.images ?? []).map((item) =>
    typeof item.image === 'number' ? item.image : item.image.id,
  )
  await Promise.all(
    mediaIds.map((id) =>
      req.payload.update({
        collection: 'letter-images',
        id,
        data: { author: doc.author },
      }),
    ),
  )
}

export const whereAuthorManager = async (payload: Payload, user: User): Promise<Where> => {
  const result = await payload.find({
    collection: 'scholarship-holder-mediations',
    where: {
      and: [{ 'user.id': { equals: user?.id } }],
    },
    pagination: false,
    depth: 0,
  })

  return { 'author.id': { in: result.docs.map((doc) => doc.scholarshipHolder) } }
}

const whereAuthorSponsor = async (payload: Payload, data: Letter): Promise<Where> => {
  const result = await payload.find({
    collection: 'scholarships',
    where: {
      and: [{ scholarshipHolder: { equals: data.author } }],
    },
    pagination: false,
    depth: 0,
  })
  return {
    id: { in: result.docs.map((doc) => doc.sponsor) },
  }
}

export const Letters: CollectionConfig = {
  slug: 'letters',
  fields: [
    {
      name: 'campaign',
      type: 'relationship',
      label: { es: 'Campaña' },
      required: true,
      relationTo: 'campaigns',
      access: {
        update: () => false,
      },
      filterOptions: whereActiveAndsendAtAfter(true, new Date()),
    },
    {
      name: 'author',
      type: 'relationship',
      label: { es: 'Autor' },
      required: true,
      relationTo: 'scholarship-holders',
      access: {
        update: () => false,
      },
      filterOptions: async ({ req: { user, payload } }) => {
        if (!user) return false
        if (isAdmin(user)) return true
        if (isEditor(user)) return whereAuthorManager(payload, user)
        return false
      },
    },
    {
      name: 'status',
      type: 'select',
      options: statusOptions,
      required: true,
      defaultValue: 'draft',
      filterOptions: ({ options }) =>
        options.filter((option) =>
          typeof option === 'string' ? option !== 'sent' : option.value !== 'sent',
        ),
      access: {
        create: () => false,
        update: ({ data, req: { user } }) =>
          data?.status !== 'sent' && (isAdmin(user) || isReviewer(user)),
      },
      label: { es: 'Estado' },
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          label: { es: 'Imagen' },
          relationTo: 'letter-images',
          required: true,
        },
      ],
      access: {
        create: () => false,
        update: ({ data }) => data?.status === 'draft',
      },
      label: { es: 'Imágenes' },
      minRows: 1,
    },
    {
      name: 'recipients',
      type: 'relationship',
      relationTo: 'sponsors',
      hasMany: true,
      filterOptions: async ({ data, req: { payload } }) =>
        whereAuthorSponsor(payload, data as Letter),
      access: {
        update: ({ req: { user }, data }) =>
          data?.status === 'draft' && (isAdmin(user) || isEditor(user)),
      },
      label: { es: 'Destinatarios' },
    },
    {
      name: 'note',
      type: 'textarea',
      label: { es: 'Nota del revisor' },
      access: {
        create: ({ req: { user } }) => isAdmin(user) || isReviewer(user),
        update: ({ req: { user }, data }) =>
          data?.status !== 'sent' && (isAdmin(user) || isReviewer(user)),
      },
    },
  ],
  access: {
    create: async ({ req: { payload, user }, data }) => {
      if (!user) return false
      if (isAdmin(user)) return true
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
      if (isAdmin(user)) return true
      if (isEditor(user)) return whereAuthorManager(payload, user)
      return false
    },
  },
  admin: {
    group: {
      es: 'Cartas',
    },
  },
  labels: {
    singular: { es: 'Carta' },
    plural: { es: 'Cartas' },
  },
  hooks: {
    afterChange: [setLetterImageAuthor],
  },
}
