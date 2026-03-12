import Handlebars from 'handlebars'
import type { TaskConfig } from 'payload'

export const SendDueLetters: TaskConfig<'SendDueLetters'> = {
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
  handler: async ({ req }) => {
    console.log('[SendDueLetters] task started')

    const { payload } = req
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
    const now = new Date().toISOString()

    const { docs: campaigns } = await payload.find({
      collection: 'campaigns',
      where: {
        and: [{ active: { equals: true } }, { sendAt: { less_than_equal: now } }],
      },
    })

    if (campaigns.length === 0) return { output: { sent: 0, failed: 0 } }

    const [instagramResult, letterResult] = await Promise.all([
      payload.find({
        collection: 'media',
        where: { filename: { equals: 'instagram.png' } },
        limit: 1,
      }),
      payload.find({
        collection: 'media',
        where: { filename: { equals: 'letter.png' } },
        limit: 1,
      }),
    ])

    const instagramIconUrl = `${serverUrl}${(instagramResult.docs[0] as any)?.url}`
    const letterIconUrl = `${serverUrl}${(letterResult.docs[0] as any)?.url}`

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

      let allLettersFullySent = true

      for (const letter of letters) {
        const { author, recipients, images, deliveries } = letter as any

        const attachments =
          images?.map((i: any) => ({
            filename: i.image.filename,
            path: `${process.cwd()}/letter-images/${i.image.filename}`,
            cid: i.image.filename,
          })) ?? []

        const emailTemplate = (campaign as any)['email-template']
        const template = Handlebars.compile(emailTemplate.template)

        const alreadySent = new Set(
          (deliveries ?? [])
            .filter((d: any) => d.status === 'sent')
            .map((d: any) => (typeof d.recipient === 'number' ? d.recipient : d.recipient.id)),
        )

        const pendingRecipients = (recipients ?? []).filter(
          (r: any) => !!r.email && !alreadySent.has(r.id),
        )

        const newDeliveries: any[] = []

        for (const recipient of pendingRecipients) {
          const html = template({
            becario: (author as any).name,
            padrino: recipient.name,
            message: (campaign as any).message,
            images: images?.length > 0,
            image: images?.map((i: any) => i.image.filename),
            instagram: instagramIconUrl,
            letter: letterIconUrl,
          })

          try {
            await payload.sendEmail({
              to: recipient.email,
              subject: campaign.subject,
              html,
              attachments,
            })
            newDeliveries.push({
              recipient: recipient.id,
              sentAt: new Date().toISOString(),
              status: 'sent',
            })
            totalSent++
          } catch (err: any) {
            newDeliveries.push({
              recipient: recipient.id,
              sentAt: new Date().toISOString(),
              status: 'failed',
              error: err.message,
            })
            totalFailed++
          }
        }

        const allDeliveries = [...(deliveries ?? []), ...newDeliveries]
        const allRecipients = (recipients ?? []).filter((r: any) => !!r.email)
        const letterFullySent = allRecipients.every((r: any) =>
          allDeliveries.some((d: any) => {
            const dId = typeof d.recipient === 'number' ? d.recipient : d.recipient?.id
            return dId === r.id && d.status === 'sent'
          }),
        )

        if (!letterFullySent) allLettersFullySent = false

        await payload.update({
          collection: 'letters',
          id: letter.id,
          data: {
            status: letterFullySent ? 'sent' : 'approved',
            deliveries: allDeliveries,
          },
        })
      }

      if (allLettersFullySent && letters.length > 0) {
        await payload.update({
          collection: 'campaigns',
          id: campaign.id,
          data: { active: false },
        })
      }
    }

    return { output: { sent: totalSent, failed: totalFailed } }
  },
}
