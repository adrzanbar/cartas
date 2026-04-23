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
import { isAdmin, isReviewer, isScholarshipHolder, isMediator, isTertiaryReviewer } from './Users'
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
  if (isAdmin(user) || isTertiaryReviewer(user)) return true
  const or: Where[] = []
  if (isReviewer(user)) {
    or.push({ 'author.educationLevel': { not_equals: 'tertiary' } })
  }
  if (isScholarshipHolder(user)) {
    or.push({ 'author.user': { equals: user.id } })
  }
  if (isMediator(user)) {
    or.push({ 'author.mediator': { equals: user.id } })
  }
  if (or.length === 0) return false
  return { or }
}

const updateAccess: Access<LetterImage> = async ({ req }) => {
  const read = await readAccess({ req })

  if (typeof read === 'boolean') return read

  const or = [...(read.or || []), { 'campaign.sendAt': { greater_than: new Date().toISOString() } }]

  return { or }
}

const campaignFilter: FilterOptions<Letter> = () => ({
  sendAt: { greater_than: new Date().toISOString() },
})

const syncDeliveries: CollectionAfterChangeHook<Letter> = async ({ doc, req }) => {
  if (!doc.author) return
  const currentRecipients = (doc.recipients || []).map((recipient) => getId(recipient))
  if (doc.approved) {
    const { docs: existingDeliveries } = await req.payload.find({
      collection: 'deliveries',
      depth: 0,
      pagination: false,
      req,
      where: { letter: { equals: doc.id } },
    })
    const existingRecipientIds = existingDeliveries.map((delivery) => getId(delivery.recipient))
    const recipientsToCreate = currentRecipients.filter((id) => !existingRecipientIds.includes(id))
    const deliveryIdsToDelete = existingDeliveries
      .filter((delivery) => !currentRecipients.includes(getId(delivery.recipient)))
      .map((delivery) => delivery.id)
    if (recipientsToCreate.length > 0) {
      await Promise.all(
        recipientsToCreate.map((recipientId) =>
          req.payload.create({
            collection: 'deliveries',
            req,
            data: {
              letter: doc.id,
              recipient: recipientId,
            },
          }),
        ),
      )
    }
    if (deliveryIdsToDelete.length > 0) {
      await req.payload.delete({
        collection: 'deliveries',
        req,
        where: {
          id: { in: deliveryIdsToDelete },
        },
      })
    }
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
  const scholarshipHolder = await req.payload.findByID({
    collection: 'scholarship-holders',
    id: data.author,
    req,
  })
  return { id: { in: scholarshipHolder.sponsors?.map(getId) } }
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
      name: 'images',
      type: 'array',
      access: {
        update: ({ doc }) => !doc?.approved,
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
        update: ({ doc }) => !doc?.approved,
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
    update: updateAccess,
    delete: createAccess,
  },
  admin: {
    hideAPIURL: true,
    group: {
      es: 'Cartas',
    },
  },
  hooks: {
    afterChange: [syncDeliveries],
  },
  labels: {
    singular: { es: 'Carta' },
    plural: { es: 'Cartas' },
  },
}
