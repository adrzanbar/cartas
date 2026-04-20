import type {
  Access,
  CollectionAfterChangeHook,
  CollectionConfig,
  DefaultValue,
  FieldHook,
  FilterOptions,
  Where,
} from 'payload'
import { Letter, LetterImage } from '@/payload-types'
import { isAdmin, isReviewer, isScholarshipHolder, isMediator } from './Users'
import { getId } from '@/utils'

export const createAccess: Access<LetterImage> = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
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

export const readAccess: Access<LetterImage> = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  const or: Where[] = []
  if (isReviewer(user)) {
    or.push({ 'author.educationLevel': { not_equals: 'tertiary' } })
  }
  if (isScholarshipHolder(user)) {
    or.push({ 'author.user.id': { equals: user.id } })
  }
  if (isMediator(user)) {
    or.push({ 'author.mediator.id': { equals: user.id } })
  }
  if (or.length === 0) return false
  return { or }
}

const campaignFilter: FilterOptions<Letter> = () => ({
  sendAt: { greater_than: new Date().toISOString() },
})

const createDeliveries: CollectionAfterChangeHook<Letter> = async ({ doc, req }) => {
  if (!doc.recipients || doc.recipients.length === 0) return doc
  const { docs: authorDocs } = await req.payload.find({
    collection: 'scholarship-holders',
    depth: 0,
    limit: 1,
    req,
    pagination: false,
    where: { id: { equals: doc.author } },
  })
  if (doc.approved || authorDocs[0].educationLevel === 'tertiary') {
    await Promise.all(
      doc.recipients.map(async (recipient) => {
        const recipientId = getId(recipient)
        const { totalDocs } = await req.payload.find({
          collection: 'deliveries',
          depth: 0,
          limit: 1,
          pagination: false,
          req,
          where: {
            and: [{ letter: { equals: doc.id } }, { recipient: { equals: recipientId } }],
          },
        })
        if (totalDocs === 0) {
          await req.payload.create({
            collection: 'deliveries',
            req,
            data: {
              letter: doc.id,
              recipient: recipientId,
            },
          })
        }
      }),
    )
  } else {
    await req.payload.delete({
      collection: 'deliveries',
      req,
      where: {
        letter: { equals: doc.id },
      },
    })
  }
  return doc
}

const setLetterImageAuthor: FieldHook<Letter, number | LetterImage | null | undefined> = async ({
  req,
  value,
  data,
}) => {
  if (!value || !data?.author) return value
  await req.payload.update({
    collection: 'letter-images',
    id: getId(value),
    data: {
      author: getId(data.author),
    },
    req,
    overrideAccess: true,
  })
  return value
}

const defaultAuthor: DefaultValue = async ({ user, req }) => {
  if (!user) return
  if (isScholarshipHolder(user)) {
    const { docs } = await req.payload.find({
      collection: 'scholarship-holders',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: { user: { equals: user.id } },
    })
    return docs[0].id
  }
}

export const recipientsFilter: FilterOptions = async ({ data, req }) => {
  if (!data || !data.author) return { id: { in: [] } }
  const { docs } = await req.payload.find({
    collection: 'scholarship-holders',
    where: { id: { equals: data.author } },
    req,
  })
  const sponsors = docs[0]?.sponsors ?? []
  const sponsorIds = sponsors.map((sponsor) => (typeof sponsor === 'number' ? sponsor : sponsor.id))
  return { id: { in: sponsorIds } }
}

export const Letters: CollectionConfig = {
  slug: 'letters',
  fields: [
    {
      name: 'campaign',
      type: 'relationship',
      relationTo: 'campaigns',
      access: {
        update: () => false,
      },
      filterOptions: campaignFilter,
      label: { es: 'Campaña' },
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'scholarship-holders',
      access: {
        create: ({ req: { user } }) => (user ? isAdmin(user) || isMediator(user) : false),
        update: () => false,
      },
      admin: {
        condition: (data, siblingData, { user }) => (user ? !isScholarshipHolder(user) : false),
      },
      defaultValue: defaultAuthor,
      label: { es: 'Autor' },
      required: true,
    },
    {
      name: 'warning',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/letter-image-description#LetterImageDescription',
        },
        disableListColumn: true,
        disableBulkEdit: true,
        condition: (data, siblingData, { operation }) => operation === 'create',
      },
    },
    {
      name: 'images',
      type: 'array',
      access: {
        create: () => false,
        update: ({ data }) => !data?.approved,
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          hooks: {
            beforeChange: [setLetterImageAuthor],
          },
          label: { es: 'Imagen' },
          relationTo: 'letter-images',
          required: true,
        },
      ],
      label: { es: 'Imágenes' },
    },
    {
      name: 'recipients',
      type: 'relationship',
      relationTo: 'sponsors',
      access: {
        update: ({ data }) => !data?.approved,
      },
      hasMany: true,
      filterOptions: recipientsFilter,
      label: { es: 'Destinatarios' },
    },
    {
      name: 'approved',
      type: 'checkbox',
      access: {
        create: ({ req: { user } }) => (user ? isAdmin(user) || isReviewer(user) : false),
        update: ({ req: { user } }) => (user ? isAdmin(user) || isReviewer(user) : false),
      },
      admin: {
        condition: (data, siblingData, { user, operation }) => {
          if (!user) return false
          if (isScholarshipHolder(user)) return false
          return operation !== 'create'
        },
      },
      label: { es: 'Aprobada' },
      required: true,
    },
    {
      name: 'note',
      type: 'textarea',
      access: {
        create: ({ req: { user } }) => (user ? isAdmin(user) || isReviewer(user) : false),
        update: ({ req: { user } }) => (user ? isAdmin(user) || isReviewer(user) : false),
      },
      admin: {
        condition: (data, siblingData, { user, operation }) => {
          if (!user) return false
          if (isScholarshipHolder(user)) return false
          return operation !== 'create'
        },
      },
      label: { es: 'Nota del revisor' },
    },
  ],
  access: {
    create: createAccess,
    read: readAccess,
    update: readAccess,
    delete: createAccess,
  },
  admin: {
    group: {
      es: 'Cartas',
    },
  },
  hooks: {
    afterChange: [createDeliveries],
  },
  labels: {
    singular: { es: 'Carta' },
    plural: { es: 'Cartas' },
  },
}
