import { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { isAdmin } from './Users'
import { getId } from '@/utils'

const checkAndSetLetterSent: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation !== 'create') return doc

  const letterId = getId(doc.letter)

  const letter = await req.payload.findByID({
    req,
    collection: 'letters',
    id: letterId,
  })

  const recipients = (letter.recipients || []).map(getId)

  if (recipients.length === 0) return doc

  const { totalDocs } = await req.payload.find({
    req,
    collection: 'deliveries',
    where: {
      letter: { equals: letterId },
      recipient: { in: recipients },
    },
  })

  if (totalDocs >= recipients.length && !letter.sent) {
    await req.payload.update({
      req,
      overrideAccess: true,
      collection: 'letters',
      id: letterId,
      data: { sent: true },
    })
  }

  return doc
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
  access: {
    create: () => false,
    read: ({ req: { user } }) => user && isAdmin(user),
    update: () => false,
    delete: () => false,
  },
  hooks: {
    afterChange: [checkAndSetLetterSent],
  },
  labels: {
    singular: { es: 'Entrega' },
    plural: { es: 'Entregas' },
  },
}
