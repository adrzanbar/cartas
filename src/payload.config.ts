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
import { ScholarshipHolders } from './collections/ScholarshipHolders'
import { Sponsors } from './collections/Sponsors'
import { isAdmin, Users } from './collections/Users'
import { es } from '@payloadcms/translations/languages/es'
import { EmailTemplates } from './collections/EmailTemplates'
import { migrations } from './migrations'
import { httpOAuthAdapter } from './adapters/email-http-oauth'
import { SendLetter } from './tasks/send-letter'
import { Deliveries } from './collections/Deliveries'

export default buildConfig({
  admin: {
    components: {
      graphics: { Icon: '@/components/icon', Logo: '@/components/logo' },
    },
    dateFormat: "d 'de' MMMM yyyy",
    importMap: {
      baseDir: path.resolve(path.dirname(fileURLToPath(import.meta.url))),
    },
    meta: {
      titleSuffix: '- FONBEC Cartas',
      icons: {
        icon: '/favicon.ico',
      },
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Media,
    ScholarshipHolders,
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
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  jobs: {
    jobsCollectionOverrides: ({ defaultJobsCollection }) => {
      if (!defaultJobsCollection.admin) defaultJobsCollection.admin = {}
      defaultJobsCollection.admin.hidden = ({ user }) => !user || !isAdmin(user)
      defaultJobsCollection.admin.group = 'System'
      defaultJobsCollection.access = {
        read: ({ req: { user } }) => user && isAdmin(user),
        create: ({ req: { user } }) => user && isAdmin(user),
        update: ({ req: { user } }) => user && isAdmin(user),
        delete: ({ req: { user } }) => user && isAdmin(user),
      }
      return defaultJobsCollection
    },
    tasks: [SendLetter],
    autoRun: [
      {
        cron: '* * * * *',
        queue: 'default',
        limit: 10,
      },
    ],
  },
})
