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
import { SendDueLetters } from './tasks/send-due-letters'
import { migrations } from './migrations'
import { httpOAuthAdapter } from './adapters/email-http-oauth'
import { Deliveries } from './collections/Deliveries'

export default buildConfig({
  admin: {
    meta: {
      titleSuffix: '- FONBEC Cartas',
      icons: {
        icon: '/favicon.ico',
      },
    },
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(path.dirname(fileURLToPath(import.meta.url))),
    },
    dateFormat: "d 'de' MMMM yyyy",
    components: {
      graphics: { Icon: '@/components/icon', Logo: '@/components/logo' },
    },
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
    Deliveries,
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
  email: httpOAuthAdapter({
    defaultFromAddress: process.env.EMAIL_USER || '',
    defaultFromName: process.env.EMAIL_USER || '',
    clientId: process.env.EMAIL_CLIENT_ID || '',
    clientSecret: process.env.EMAIL_CLIENT_SECRET || '',
    refreshToken: process.env.EMAIL_CLIENT_REFRESH_TOKEN || '',
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
