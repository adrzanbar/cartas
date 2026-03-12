import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { Campaigns } from './collections/Campaigns'
import { LetterImages } from './collections/LetterImages'
import { Letters } from './collections/Letters'
import { Media } from './collections/Media'
import { ScholarshipHolder } from './collections/ScholarshipHolders'
import { Sponsors } from './collections/Sponsors'
import { Users } from './collections/Users'
import { es } from '@payloadcms/translations/languages/es'
import { EmailTemplates } from './collections/EmailTemplates'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { SendDueLetters } from './tasks/send-due-letters'
import { migrations } from './migrations'

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

const clientId = requiredEnv('GMAIL_CLIENT_ID', process.env.GMAIL_CLIENT_ID)
const clientSecret = requiredEnv('GMAIL_CLIENT_SECRET', process.env.GMAIL_CLIENT_SECRET)
const refreshToken = requiredEnv('GMAIL_REFRESH_TOKEN', process.env.GMAIL_REFRESH_TOKEN)
const userEmail = requiredEnv('GMAIL_USER_EMAIL', process.env.GMAIL_USER_EMAIL)

const transportOptions: SMTPTransport.Options = {
  service: 'gmail',
  auth: {
    type: 'OAuth2' as const,
    user: userEmail,
    clientId,
    clientSecret,
    refreshToken,
  },
}

export default buildConfig({
  admin: {
    meta: {
      titleSuffix: '- FONBEC Cartas',
    },
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(path.dirname(fileURLToPath(import.meta.url))),
    },
    dateFormat: "d 'de' MMMM yyyy",
  },
  collections: [
    Users,
    Media,
    ScholarshipHolder,
    Sponsors,
    Campaigns,
    EmailTemplates,
    Letters,
    LetterImages,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    prodMigrations: migrations,
  }),
  sharp,
  email: nodemailerAdapter({
    defaultFromAddress: userEmail,
    defaultFromName: 'Cartas',
    transportOptions,
  }),
  plugins: [],
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },
  jobs: {
    addParentToTaskLog: true,
    tasks: [SendDueLetters],
    autoRun: [
      {
        cron: '* * * * *',
        queue: 'letters',
      },
    ],
  },
})
