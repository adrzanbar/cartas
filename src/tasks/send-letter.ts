import fs from 'fs/promises'
import path from 'path'
import { JobCancelledError, TaskConfig } from 'payload'
import Handlebars from 'handlebars'
import { Attachment } from 'nodemailer/lib/mailer'
import {
  Campaign,
  EmailTemplate,
  LetterImage,
  Media,
  ScholarshipHolder,
  Sponsor,
} from '@/payload-types'
import { getId } from '@/utils'

type SendLetterInputOutput = {
  input: {
    letter: number
    recipient: number
  }
  output: { success: boolean }
}

export const SendLetter: TaskConfig<SendLetterInputOutput> = {
  slug: 'send-letter',
  inputSchema: [
    { name: 'letter', type: 'relationship', relationTo: 'letters', required: true },
    { name: 'recipient', type: 'relationship', relationTo: 'sponsors', required: true },
  ],
  outputSchema: [{ name: 'success', type: 'checkbox' }],
  retries: 3,
  handler: async ({ input, req }) => {
    console.log(`Sending letter ${input.letter} to recipient ${input.recipient}`)

    const letter = await req.payload.findByID({
      collection: 'letters',
      id: input.letter,
      req,
      depth: 3,
    })

    const recipient = await req.payload.findByID({
      collection: 'sponsors',
      id: input.recipient,
      req,
    })

    if (!letter.approved) throw new JobCancelledError(`Letter ${letter.id} is not approved`)
    if (new Date((letter.campaign as Campaign).sendAt) > new Date())
      throw new Error(`Letter can only be sent after ${(letter.campaign as Campaign).sendAt}`)
    if (!letter.recipients?.map(getId).includes(input.recipient))
      throw new JobCancelledError(`Letter ${letter.id} is not approved`)
    if (!recipient.email) throw new Error(`Recipient ${recipient.name} is missing email`)

    const attachments: Attachment[] = []
    const letterImageCids: string[] = []

    for (const { image } of letter.images || []) {
      const fileName = (image as LetterImage).filename
      if (!fileName) throw new Error('Invalid letter image')
      const filePath = path.join(process.cwd(), 'letter-images', fileName)
      const content = await fs.readFile(filePath)
      if ((image as LetterImage).mimeType?.startsWith('image/')) {
        const cid = `letter-image-${letter.id}-${(image as LetterImage).id}`
        attachments.push({
          filename: fileName,
          content,
          cid,
        })
        letterImageCids.push(cid)
      } else if ((image as LetterImage).mimeType === 'application/pdf') {
        attachments.push({
          filename: fileName,
          content,
        })
      } else {
        throw new Error(`Unsupported mime type: ${(image as LetterImage).mimeType}`)
      }
    }
    const html = Handlebars.compile(
      ((letter.campaign as Campaign).emailTemplate as EmailTemplate).template,
    )({
      ...(((letter.campaign as Campaign).emailTemplate as EmailTemplate).images || []).reduce(
        (acc, curr) => {
          acc[curr.name] = (curr.image as Media).url
          return acc
        },
        {} as Record<string, string | null | undefined>,
      ),
      becario: (letter.author as ScholarshipHolder).name,
      padrino: (recipient as Sponsor).name,
      message: (letter.campaign as Campaign).message,
      letterImages: letterImageCids,
    })
    await req.payload.sendEmail({
      to: recipient.email,
      subject: (letter.campaign as Campaign).subject,
      html,
      attachments,
    })

    req.payload.create({
      collection: 'deliveries',
      data: {
        letter: input.letter,
        recipient: input.recipient,
        sentAt: new Date().toISOString(),
      },
      req,
    })

    return {
      output: { success: true },
      state: 'succeeded',
    }
  },
}
