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
import { SendPendingDeliveries } from './tasks/send-pending-deliveries'
import { Deliveries } from './collections/Deliveries'
import { es as customTranslations } from './translations/es'

export default buildConfig({
  admin: {
    components: {
      graphics: { Icon: '@/components/icon', Logo: '@/components/logo' },
      Nav: '@/components/CustomNav',
    },
    dateFormat: "d 'de' MMMM yyyy",
    dashboard: {
      widgets: [
        {
          slug: 'stats-row',
          Component: '/components/widgets/StatsRow',
          minWidth: 'full',
          maxWidth: 'full',
        },
        {
          slug: 'education-pie',
          Component: '/components/widgets/EducationPie',
          minWidth: 'small',
          maxWidth: 'medium',
        },
        {
          slug: 'delivery-status',
          Component: '/components/widgets/DeliveryStatus',
          minWidth: 'small',
          maxWidth: 'medium',
        },
        {
          slug: 'letters-per-campaign',
          Component: '/components/widgets/LettersPerCampaign',
          minWidth: 'medium',
          maxWidth: 'full',
        },
      ],
      defaultLayout: (({ req }: { req: any }) => {
        const user = req.user
        const admin = user && isAdmin(user)
        return [
          ...(admin ? [{ widgetSlug: 'stats-row', width: 'full' as const }] : []),
          ...(admin ? [{ widgetSlug: 'education-pie', width: 'medium' as const }] : []),
          ...(admin ? [{ widgetSlug: 'delivery-status', width: 'medium' as const }] : []),
          ...(admin ? [{ widgetSlug: 'letters-per-campaign', width: 'full' as const }] : []),
          { widgetSlug: 'collections', width: 'full' as const },
        ]
      }) as (args: { req: any }) => any,
    },
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
    translations: { es: customTranslations } as any,
  },
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  jobs: {
    tasks: [SendPendingDeliveries],
    autoRun: [
      {
        cron: '* * * * *',
        queue: 'delivery',
        limit: 1,
      },
    ],
  },
})
