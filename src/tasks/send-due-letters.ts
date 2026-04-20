import { LetterImage, Letter, Sponsor, ScholarshipHolder } from '@/payload-types'
import Handlebars from 'handlebars'
import { Attachment } from 'nodemailer/lib/mailer'
import path from 'path'
import { BasePayload, TaskConfig } from 'payload'
import fs from 'fs/promises'

class LetterSender {
  templates: Map<number, HandlebarsTemplateDelegate<any>> = new Map()
  payload: BasePayload

  constructor(payload: BasePayload) {
    this.payload = payload
  }

  getImageBuffer = async (letterImage: LetterImage) => {
    if (!letterImage?.filename) return undefined
    const filePath = path.join(process.cwd(), 'letter-images', letterImage.filename)
    return await fs.readFile(filePath)
  }

  sendLetter = async (letter: Letter, recipient: Sponsor) => {
    if (!recipient.email) throw new Error('Invalid recipient email')
    if (typeof letter.campaign === 'number') throw new Error('Invalid campaign')
    if (typeof letter.campaign.emailTemplate === 'number') throw new Error('Invalid email template')
    if (typeof letter.author === 'number') throw new Error('Invalid author')
    if (!letter.images || letter.images.length === 0) throw new Error('No letter images to send')

    let template = this.templates.get(letter.campaign.emailTemplate.id)
    if (!template) {
      template = Handlebars.compile(letter.campaign.emailTemplate.template)
      this.templates.set(letter.campaign.emailTemplate.id, template)
    }

    const images: Attachment[] = []
    const files: Attachment[] = []

    for (const { image } of letter.images) {
      if (typeof image === 'number') throw new Error('Invalid letter image')

      const isImage = image.mimeType?.startsWith('image/')
      const isPdf = image.mimeType === 'application/pdf'

      if (isImage) {
        images.push({
          filename: image.filename || undefined,
          content: await this.getImageBuffer(image),
          cid: `letter-image-${letter.id}-${image.id}`,
        })
      } else if (isPdf) {
        files.push({
          filename: image.filename || undefined,
          content: await this.getImageBuffer(image),
        })
      } else {
        throw new Error(`Unsupported mime type: ${image.mimeType}`)
      }
    }

    const options: Record<string, (string | undefined)[] | string | null | undefined> = {
      becario: letter.author.name,
      padrino: recipient.name,
      message: letter.campaign.message,
      letterImages: images.map((image) => image.cid),
    }

    for (const image of letter.campaign.emailTemplate.images ?? []) {
      if (typeof image.image === 'number') throw new Error('Invalid email template image')
      options[image.name] = image.image.url
    }

    const html = template(options)

    await this.payload.sendEmail({
      to: recipient.email,
      subject: letter.campaign.subject,
      html,
      attachments: [...images, ...files],
    })
  }
}

export interface SendDueLettersIO {
  input: Record<string, unknown>
  output: {
    sent: number
    failed: number
  }
}

export const SendDueLetters: TaskConfig<SendDueLettersIO> = {
  slug: 'SendDueLetters',
  schedule: [
    {
      cron: '* * * * *',
      queue: 'letters',
    },
  ],
  outputSchema: [
    { name: 'sent', type: 'number', required: true },
    { name: 'failed', type: 'number', required: true },
  ],
  handler: async ({ req: { payload } }) => {
    console.log('[SendDueLetters] task started')
    const sender = new LetterSender(payload)

    let sentCount = 0
    let failedCount = 0

    const { docs, totalDocs } = await payload.find({
      collection: 'deliveries',
      where: {
        and: [
          { 'letter.campaign.sendAt': { less_than_equal: new Date().toISOString() } },
          {
            or: [{ sentAt: { exists: false } }],
          },
        ],
      },
      depth: 4,
    })

    console.log(`[SendDueLetters] ${totalDocs} due deliveries`)

    for (const delivery of docs) {
      const letter = delivery.letter as Letter
      const recipient = delivery.recipient as Sponsor
      const author = letter.author as ScholarshipHolder
      console.log(
        `[SendDueLetters] Sending letter from ${author.name} to recipient ${recipient.email}`,
      )
      try {
        if (typeof delivery.letter === 'number') throw new Error('Invalid letter in delivery')
        if (typeof delivery.recipient === 'number') throw new Error('Invalid recipient in delivery')

        await sender.sendLetter(delivery.letter, delivery.recipient)
        await payload.update({
          collection: 'deliveries',
          id: delivery.id,
          data: { sentAt: new Date().toISOString() },
        })
        sentCount++
      } catch (error) {
        console.error(`[SendDueLetters] Failed to send letter for delivery ${delivery.id}:`, error)
        failedCount++
      }
    }

    return {
      output: {
        sent: sentCount,
        failed: failedCount,
      },
    }
  },
}
