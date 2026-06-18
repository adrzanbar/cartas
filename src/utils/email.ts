import fs from 'fs/promises'
import path from 'path'
import Handlebars from 'handlebars'
import { Attachment } from 'nodemailer/lib/mailer'
import {
  Campaign,
  EmailTemplate,
  LetterImage,
  Media,
} from '@/payload-types'

export interface AttachmentResult {
  attachments: Attachment[]
  letterImageCids: string[]
  error?: string
}

export async function buildEmailAttachments(
  letterDoc: { id: number | string; images?: { image: number | LetterImage }[] },
): Promise<AttachmentResult> {
  const attachments: Attachment[] = []
  const letterImageCids: string[] = []

  for (const { image } of letterDoc.images || []) {
    const img = image as LetterImage
    const fileName = img.filename
    if (!fileName) return { attachments, letterImageCids, error: 'Invalid letter image' }
    const filePath = path.join(process.cwd(), 'letter-images', fileName)
    const content = await fs.readFile(filePath)
    if (img.mimeType?.startsWith('image/')) {
      const cid = `letter-image-${letterDoc.id}-${img.id}`
      attachments.push({ filename: fileName, content, cid })
      letterImageCids.push(cid)
    } else if (img.mimeType === 'application/pdf') {
      attachments.push({ filename: fileName, content })
    } else {
      return { attachments, letterImageCids, error: `Unsupported mime type: ${img.mimeType}` }
    }
  }

  return { attachments, letterImageCids }
}

export function renderEmailHtml(
  campaign: Campaign,
  template: EmailTemplate,
  authorName: string,
  recipientName: string,
  letterImageCids: string[],
): string {
  return Handlebars.compile(template.template)({
    ...(template.images || []).reduce(
      (acc, curr) => {
        acc[curr.name] = (curr.image as Media).url
        return acc
      },
      {} as Record<string, string | null | undefined>,
    ),
    becario: authorName,
    padrino: recipientName,
    message: campaign.message,
    letterImages: letterImageCids,
  })
}
