import { CollectionConfig, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { isAdmin } from './Users'
import { getId } from '@/utils'

async function syncLetterSent(letterId: number | string, req: any) {
  const letter = await req.payload.findByID({
    collection: 'letters',
    id: letterId,
    depth: 0,
    req,
    overrideAccess: true,
  })

  if (!letter.approved) {
    if (letter.sent) {
      await req.payload.update({
        collection: 'letters',
        id: letterId,
        data: { sent: false },
        req,
        overrideAccess: true,
      })
    }
    return
  }

  const recipients = (letter.recipients || []).map(getId)
  if (recipients.length === 0) return

  const { docs: sentDeliveries } = await req.payload.find({
    collection: 'deliveries',
    where: {
      and: [
        { letter: { equals: letterId } },
        { sentAt: { exists: true } },
      ],
    },
    depth: 0,
    pagination: false,
    req,
    overrideAccess: true,
  })

  const sentRecipientIds = new Set(sentDeliveries.map((d: any) => getId(d.recipient)))
  const isSent = recipients.every((r: number) => sentRecipientIds.has(r))

  if (isSent !== Boolean(letter.sent)) {
    await req.payload.update({
      collection: 'letters',
      id: letterId,
      data: { sent: isSent },
      req,
      overrideAccess: true,
    })
  }
}

const syncLetterSentHook: CollectionAfterChangeHook = async ({ doc, req }) => {
  const letterId = doc.letter ? getId(doc.letter) : null
  if (letterId) await syncLetterSent(letterId, req)
  return doc
}

const syncLetterSentOnDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const letterId = doc.letter ? getId(doc.letter) : null
  if (letterId) await syncLetterSent(letterId, req)
}

export const Deliveries: CollectionConfig = {
  slug: 'deliveries',
  fields: [
    {
      name: 'letter',
      type: 'relationship',
      relationTo: 'letters',
      label: { es: 'Carta' },
      required: true,
    },
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'sponsors',
      label: { es: 'Destinatario' },
      required: true,
    },
    { name: 'sentAt', type: 'date', label: { es: 'Fecha de envío' } },
    {
      name: 'campaign',
      type: 'relationship',
      relationTo: 'campaigns',
      label: { es: 'Campaña' },
      virtual: 'letter.campaign',
    },
  ],
  admin: {
    group: {
      es: 'Administración',
    },
    hideAPIURL: true,
  },
  hooks: {
    afterChange: [syncLetterSentHook],
    afterDelete: [syncLetterSentOnDelete],
  },
  access: {
    create: () => false,
    read: ({ req: { user } }) => user && isAdmin(user),
    update: () => false,
    delete: () => false,
  },
  labels: {
    singular: { es: 'Entrega' },
    plural: { es: 'Entregas' },
  },
}
