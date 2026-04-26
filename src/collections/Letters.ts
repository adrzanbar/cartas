import {
  type Access,
  type CollectionConfig,
  type DefaultValue,
  type FieldHook,
  type FilterOptions,
  type Where,
  type CollectionBeforeChangeHook,
  APIError,
  CollectionAfterChangeHook,
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
  return {
    and: [read, { 'campaign.sendAt': { greater_than: new Date().toISOString() } }],
  }
}

const campaignFilter: FilterOptions<Letter> = () => ({
  sendAt: { greater_than: new Date().toISOString() },
})

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

const recipientsFilter: FilterOptions = async ({ data, req }) => {
  if (!data || !data.author) return { id: { in: [] } }
  const scholarshipHolder = await req.payload.findByID({
    collection: 'scholarship-holders',
    id: data.author,
    req,
  })
  return { id: { in: scholarshipHolder.sponsors?.map(getId) } }
}

const ensureUniqueCampaignAuthorRecipient: CollectionBeforeChangeHook<Letter> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const message = 'Solo se permite una carta por padrino por campaña'
  const { payload } = req
  const id = data.id || originalDoc?.id
  const author = data.author || originalDoc?.author
  const campaign = data.campaign || originalDoc?.campaign
  const recipients = data.recipients || originalDoc?.recipients
  if (!recipients || !author || !campaign) return data
  if (!recipients) return data
  const { docs, totalDocs } = await payload.find({
    req,
    collection: 'letters',
    where: {
      and: [
        { author: { equals: author } },
        { campaign: { equals: campaign } },
        { recipients: { in: recipients } },
      ],
    },
  })
  if (operation === 'create' && totalDocs > 0) throw new APIError(message, 400, undefined, true)
  if (operation === 'update' && docs.some((doc) => doc.id !== id))
    throw new APIError(message, 400, undefined, true)
  return data
}

const enqueueTask: CollectionAfterChangeHook<Letter> = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  if (operation !== 'update') return doc
  if (doc.approved === previousDoc?.approved) return doc

  if (doc.approved) {
    const campaign = await req.payload.findByID({
      collection: 'campaigns',
      id: doc.campaign as number,
      req,
      depth: 0,
    })

    const currentRecipients = (doc.recipients || []).map(getId)

    if (currentRecipients.length > 0) {
      await Promise.all(
        currentRecipients.map((recipientId) =>
          req.payload.jobs.queue({
            task: 'send-letter',
            waitUntil: new Date(campaign.sendAt),
            input: {
              letter: doc.id,
              recipient: recipientId,
            },
            req,
          }),
        ),
      )
    }
  } else {
    await req.payload.jobs.cancel({
      where: {
        taskSlug: { equals: 'send-letter' },
        'input.letter': { equals: doc.id },
      },
      req,
    })
  }

  return doc
}

const setSent: FieldHook<Letter, number[] | undefined> = async ({
  req,
  value,
  originalDoc,
  data,
}) => {
  if (!data) return value

  const newRecipients = value || []
  const oldRecipients = originalDoc?.recipients || []

  if (newRecipients.length === 0) {
    data.sent = false
    return value
  }

  const hasChanged =
    newRecipients.length !== oldRecipients.length ||
    !newRecipients.every((recipient, i) => recipient === oldRecipients[i])

  if (!hasChanged) {
    return value
  }

  if (originalDoc?.id) {
    const { totalDocs } = await req.payload.find({
      collection: 'deliveries',
      where: {
        and: [
          { letter: { equals: originalDoc.id } },
          { recipient: { in: newRecipients } }, // Use newRecipients, not originalDoc.recipients
        ],
      },
      req,
      depth: 0,
    })

    data.sent = newRecipients.length > 0 && newRecipients.length <= totalDocs
  } else {
    data.sent = false
  }

  return value
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
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'letter-images',
          hooks: {
            beforeChange: [setLetterImageAuthor],
          },
          label: { es: 'Imagen' },
          required: true,
        },
      ],
      access: {
        update: ({ doc }) => doc && !doc.approved,
      },
      label: { es: 'Imágenes' },
    },
    {
      name: 'recipients',
      type: 'relationship',
      relationTo: 'sponsors',
      access: {
        update: ({ doc }) => doc && !doc.approved,
      },
      hasMany: true,
      filterOptions: recipientsFilter,
      label: { es: 'Destinatarios' },
      hooks: {
        beforeChange: [setSent],
      },
    },
    {
      name: 'approved',
      type: 'checkbox',
      access: {
        create: ({ req: { user } }) => false,
        update: ({ req: { user } }) => user && (isAdmin(user) || isReviewer(user)),
      },
      admin: {
        condition: (data, siblingData, { user }) =>
          user && (isAdmin(user) || isReviewer(user) || isMediator(user)),
      },
      label: { es: 'Aprobada' },
      required: true,
    },
    {
      name: 'sent',
      type: 'checkbox',
      access: {
        create: () => false,
        update: () => false,
        read: ({ req: { user } }) => user && isAdmin(user),
      },
      admin: { readOnly: true },
      label: { es: 'Enviada' },
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
    beforeChange: [ensureUniqueCampaignAuthorRecipient],
    afterChange: [enqueueTask],
  },
  labels: {
    singular: { es: 'Carta' },
    plural: { es: 'Cartas' },
  },
}
