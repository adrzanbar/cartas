import type {
  CollectionAfterChangeHook,
  CollectionConfig,
  Where,
  FilterOptionsProps,
  Data,
} from 'payload'
import { getManagedAuthorIds, isAdmin, isEditor, isReviewer } from './Users'
import type { Letter as LetterType, User } from '@/payload-types'

export const whereAuthorManager = (user: User | null): Where => ({
  or: [{ author: { in: getManagedAuthorIds(user) } }, { author: { exists: false } }],
})

export const whereCampaignActive = (): Where => ({
  and: [
    { 'campaign.active': { equals: true } },
    { 'campaign.sendAt': { greater_than: new Date().toISOString() } },
  ],
})

export const whereNotApproved = (): Where => ({
  approved: { equals: false },
})

export const bySelectedAuthor = async ({ data, req }: FilterOptionsProps) => {
  if (!data || !data.author) return { id: { in: [] } }

  const { docs } = await req.payload.find({
    collection: 'scholarship-holders',
    where: { id: { equals: data.author } },
  })

  const sponsors = docs[0]?.sponsors ?? []
  const sponsorIds = sponsors.map((sponsor) => (typeof sponsor === 'number' ? sponsor : sponsor.id))

  return { id: { in: sponsorIds } }
}

const setLetterImageAuthor: CollectionAfterChangeHook<LetterType> = async ({ doc, req }) => {
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

const statusOptions = [
  { label: { es: 'Borrador' }, value: 'draft' },
  { label: { es: 'Aprobado' }, value: 'approved' },
  { label: { es: 'Enviado' }, value: 'sent' },
]

const statusFilterOptions = ({ data }: { data: Data }) => {
  const status = data?.status
  return status === 'sent'
    ? statusOptions
    : statusOptions.filter((option) => option.value !== 'sent')
}

export const Letters: CollectionConfig = {
  slug: 'letters',
  labels: {
    singular: { es: 'Carta' },
    plural: { es: 'Cartas' },
  },
  access: {
    create: ({ req: { user } }) => isAdmin(user) || isEditor(user),
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (isReviewer(user)) return whereCampaignActive()
      if (isEditor(user)) return { and: [whereAuthorManager(user), whereCampaignActive()] }
      return false
    },
    update: ({ req: { user } }) => {
      if (isAdmin(user) || isReviewer(user)) return true
      if (isEditor(user))
        return { and: [whereAuthorManager(user), whereCampaignActive(), whereNotApproved()] }
      return false
    },
    delete: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (isEditor(user))
        return { and: [whereAuthorManager(user), whereCampaignActive(), whereNotApproved()] }
      return false
    },
  },
  admin: {
    group: {
      es: 'Cartas',
    },
  },
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
    },
    {
      name: 'status',
      type: 'select',
      label: { es: 'Estado' },
      required: true,
      options: statusOptions,
      defaultValue: 'draft',
      filterOptions: statusFilterOptions,
      access: {
        create: () => false,
        update: ({ data, req: { user } }) =>
          data?.status !== 'sent' && (isAdmin(user) || isReviewer(user)),
      },
    },
    {
      name: 'images',
      type: 'array',
      label: { es: 'Imágenes' },
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          label: { es: 'Imagen' },
          relationTo: 'letter-images',
          required: true,
        },
      ],
    },
    {
      name: 'recipients',
      type: 'relationship',
      label: { es: 'Destinatarios' },
      relationTo: 'sponsors',
      hasMany: true,
      filterOptions: bySelectedAuthor,
      access: {
        update: ({ req: { user }, data }) =>
          data?.status !== 'sent' && (isAdmin(user) || isEditor(user)),
      },
    },
    {
      name: 'note',
      type: 'textarea',
      label: { es: 'Nota' },
      access: {
        create: ({ req: { user } }) => isAdmin(user) || isReviewer(user),
        update: ({ req: { user } }) => isAdmin(user) || isReviewer(user),
      },
    },
    {
      name: 'deliveries',
      type: 'array',
      label: { es: 'Envíos' },
      access: {
        create: () => false,
        update: () => false,
      },
      admin: { readOnly: true },
      fields: [
        {
          name: 'recipient',
          type: 'relationship',
          relationTo: 'sponsors',
          required: true,
        },
        {
          name: 'sentAt',
          type: 'date',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Enviado', value: 'sent' },
            { label: 'Fallido', value: 'failed' },
          ],
          required: true,
        },
        {
          name: 'error',
          type: 'text',
        },
      ],
    },
  ],
  hooks: {
    afterChange: [setLetterImageAuthor],
  },
}
