import { TaskConfig } from 'payload'
import { Campaign, EmailTemplate, ScholarshipHolder, Sponsor } from '@/payload-types'
import { getId } from '@/utils'
import { buildEmailAttachments, renderEmailHtml } from '@/utils/email'

interface DeliveryError {
  deliveryId: number
  letterId: number | string
  recipientId: number | string
  error: string
}

type Input = Record<string, never>
type Output = {
  found: number
  sent: number
  skipped: number
  failed: number
  errors: DeliveryError[]
}

type Handler = TaskConfig<{ input: Input; output: Output }>['handler']

async function processDelivery(
  delivery: { id: number; letter: number | { id: number }; recipient: number | { id: number } },
  errors: DeliveryError[],
  req: any,
): Promise<'sent' | 'skipped'> {
  const letterDoc = await req.payload.findByID({
    collection: 'letters',
    id: getId(delivery.letter),
    req,
    depth: 3,
  })

  const recipient = await req.payload.findByID({
    collection: 'sponsors',
    id: getId(delivery.recipient),
    req,
  })

  const campaign = letterDoc.campaign as Campaign
  const template = campaign.emailTemplate as EmailTemplate

  if (new Date(campaign.sendAt) > new Date()) return 'skipped'

  if (!recipient.email) {
    errors.push({
      deliveryId: delivery.id,
      letterId: getId(delivery.letter),
      recipientId: getId(delivery.recipient),
      error: 'Missing recipient email',
    })
    return 'skipped'
  }

  const { attachments, letterImageCids, error: attachError } = await buildEmailAttachments(letterDoc)
  if (attachError) {
    errors.push({
      deliveryId: delivery.id,
      letterId: getId(delivery.letter),
      recipientId: getId(delivery.recipient),
      error: attachError,
    })
    return 'skipped'
  }

  const html = renderEmailHtml(
    campaign,
    template,
    (letterDoc.author as ScholarshipHolder).name,
    (recipient as Sponsor).name ?? '',
    letterImageCids,
  )

  await req.payload.sendEmail({
    to: recipient.email,
    subject: campaign.subject,
    html,
    attachments,
  })

  await req.payload.update({
    collection: 'deliveries',
    id: delivery.id,
    data: { sentAt: new Date().toISOString() },
    req,
    overrideAccess: true,
  })

  return 'sent'
}

const handler: Handler = async ({ req }) => {
  const { docs: pending } = await req.payload.find({
    collection: 'deliveries',
    where: {
      and: [
        { sentAt: { equals: null } },
        { 'letter.campaign.sendAt': { less_than_equal: new Date().toISOString() } },
      ],
    },
    depth: 0,
    pagination: false,
    req,
    overrideAccess: true,
  })

  const errors: DeliveryError[] = []
  let sent = 0
  let skipped = 0

  for (const delivery of pending) {
    try {
      const result = await processDelivery(delivery, errors, req)
      if (result === 'sent') sent++
      else skipped++
    } catch (err) {
      errors.push({
        deliveryId: delivery.id,
        letterId: getId(delivery.letter),
        recipientId: getId(delivery.recipient),
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const output = { found: pending.length, sent, skipped, failed: errors.length, errors }
  req.payload.logger.info({ output }, 'send-pending-deliveries complete')
  return { output }
}

export const SendPendingDeliveries = {
  slug: 'send-pending-deliveries',
  schedule: [{ cron: '* * * * *', queue: 'delivery' }],
  handler,
}
