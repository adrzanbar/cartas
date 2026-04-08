import Handlebars from 'handlebars'
import type { BasePayload, TaskConfig } from 'payload'
import path from 'path'
import fs from 'fs/promises'
import { Letter, LetterImage, Sponsor } from '@/payload-types'
import { Attachment } from 'nodemailer/lib/mailer'

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
    if (typeof letter.campaign['email-template'] === 'number')
      throw new Error('Invalid email template')
    if (typeof letter.author === 'number') throw new Error('Invalid author')
    if (!letter.images) throw new Error('No letter images to send')

    const instagram = letter.campaign['email-template'].images?.filter(
      (image) => image.name === 'instagram',
    )[0].image
    const letterIcon = letter.campaign['email-template'].images?.filter(
      (image) => image.name === 'letter',
    )[0].image

    if (typeof instagram === 'number' || typeof letterIcon === 'number') {
      throw new Error('Invalid template images')
    }

    let template = this.templates.get(letter.campaign['email-template'].id)
    if (!template) {
      template = Handlebars.compile(letter.campaign['email-template'].template)
      this.templates.set(letter.campaign['email-template'].id, template)
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

    const html = template({
      becario: letter.author.name,
      padrino: recipient.name,
      message: letter.campaign.message,
      instagram: instagram?.url,
      letter: letterIcon?.url,
      letterImages: images.map((image) => image.cid),
    })

    await this.payload.sendEmail({
      to: recipient.email,
      subject: letter.campaign.subject,
      html,
      attachments: [...images, ...files],
    })
  }
}

export const SendDueLetters: TaskConfig<'SendDueLetters'> = {
  slug: 'SendDueLetters',
  schedule: [
    {
      cron: process.env.SEND_DUE_LETTERS_CRON || '0 8 * * *',
      queue: 'letters',
    },
  ],
  outputSchema: [
    { name: 'sent', type: 'number', required: true },
    { name: 'failed', type: 'number', required: true },
  ],
  handler: async ({ req }) => {
    console.log('[SendDueLetters] task started')
    const { payload } = req
    const sender = new LetterSender(payload)

    const { docs: campaigns, totalDocs } = await payload.find({
      collection: 'campaigns',
      where: {
        and: [
          { active: { equals: true } },
          { sendAt: { less_than_equal: new Date().toISOString() } },
        ],
      },
      pagination: false,
    })

    let totalSent = 0
    let totalFailed = 0

    for (const campaign of campaigns) {
      const { docs: letters } = await payload.find({
        collection: 'letters',
        where: {
          and: [{ campaign: { equals: campaign.id } }, { status: { equals: 'approved' } }],
        },
        depth: 3,
      })

      let allSent = true

      for (const letter of letters) {
        const { recipients } = letter

        if (!recipients) continue

        for (const recipient of recipients) {
          if (typeof recipient === 'number') {
            console.warn(`[SendDueLetters] failed to get recipient data for ${recipient}, skipping`)
            continue
          }
          try {
            const { docs } = await payload.find({
              collection: 'deliveries',
              where: {
                and: [{ letter: { equals: letter.id } }, { recipient: { equals: recipient.id } }],
              },
              limit: 1,
            })
            if (docs[0]) continue

            await sender.sendLetter(letter, recipient)

            await payload.create({
              collection: 'deliveries',
              data: {
                letter: letter.id,
                recipient: recipient.id,
              },
            })

            totalSent++
          } catch (err: any) {
            console.warn(`[SendDueLetters]`, err)
            totalFailed++
          }
        }

        const { docs } = await payload.find({
          collection: 'deliveries',
          where: {
            and: [
              { letter: { equals: letter.id } },
              {
                recipient: {
                  in: letter.recipients?.map((recipient) =>
                    typeof recipient === 'number' ? recipient : recipient.id,
                  ),
                },
              },
            ],
          },
        })
        const sent = docs.length === letter.recipients?.length

        if (sent) {
          await payload.update({
            collection: 'letters',
            id: letter.id,
            data: {
              status: 'sent',
            },
          })
        }

        allSent &&= sent
      }

      if (allSent) {
        await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { active: false },
        })
      }
    }

    console.log(`[SendDueLetters] done — sent: ${totalSent}, failed: ${totalFailed}`)
    return { output: { sent: totalSent, failed: totalFailed } }
  },
}
