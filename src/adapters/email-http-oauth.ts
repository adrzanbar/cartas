import { gmail_v1, google } from 'googleapis'
import type { EmailAdapter, SendEmailOptions } from 'payload'
import MailComposer from 'nodemailer/lib/mail-composer'

export type HttpOAuthAdapterAdapterConfig = {
  defaultFromAddress: string
  defaultFromName: string
  clientId: string
  clientSecret: string
  refreshToken: string
}

export type HttpOauthAdapterResponse = gmail_v1.Schema$Message

export const httpOAuthAdapter = (config: HttpOAuthAdapterAdapterConfig): EmailAdapter<HttpOauthAdapterResponse> => {
  return ({ payload }) => {
    // 1. Initialize the Google OAuth2 Client
    const oAuth2Client = new google.auth.OAuth2(config.clientId, config.clientSecret)
    oAuth2Client.setCredentials({ refresh_token: config.refreshToken })

    // 2. Initialize the Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

    return {
      name: 'gmail-http-adapter',
      defaultFromAddress: config.defaultFromAddress,
      defaultFromName: config.defaultFromName,
      sendEmail: async (message: SendEmailOptions) => {
        try {
          // 3. Compile the email into an RFC 2822 formatted message
          // This ensures things like attachments and multipart HTML/text work perfectly.
          const mailOptions = {
            from: message.from || `"${config.defaultFromName}" <${config.defaultFromAddress}>`,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
            attachments: message.attachments,
            ...message,
          }

          const mail = new MailComposer(mailOptions)
          const mailBuffer = await mail.compile().build()

          // 4. Encode the raw buffer to base64url format (Strictly required by Gmail API)
          const encodedMessage = mailBuffer.toString('base64url')

          // 5. Send the email via HTTP API (Port 443)
          const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
              raw: encodedMessage,
            },
          })

          payload.logger.info(`Email successfully sent. ID: ${response.data.id}`)
          return response.data
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          payload.logger.error(`Error sending email: ${errorMessage}`)
          throw error
        }
      },
    }
  }
}
