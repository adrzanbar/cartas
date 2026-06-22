'use client'

import { getTranslation } from '@payloadcms/translations'
import {
  BrowseByFolderButton,
  GearIcon,
  Link,
  NavGroup,
  Popup,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { EntityType } from '@payloadcms/ui/shared'
import { usePathname } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import { Fragment } from 'react'
import {
  FileSpreadsheet,
  GraduationCap,
  HeartHandshake,
  Image,
  Mail,
  Megaphone,
  FileText,
  FolderOpen,
  Send,
  UserCircle,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  users: UserCircle,
  'scholarship-holders': GraduationCap,
  sponsors: HeartHandshake,
  campaigns: Megaphone,
  'email-templates': FileText,
  letters: FileSpreadsheet,
  'letter-images': Image,
  deliveries: Send,
  media: FolderOpen,
}

const baseClass = 'nav'
const settingsMenuBaseClass = 'settings-menu-button'

export function SettingsMenuButton({ settingsMenu }: { settingsMenu: React.ReactNode[] }) {
  const { t } = useTranslation()
  if (!settingsMenu || settingsMenu.length === 0) return null
  return (
    <Popup
      button={<GearIcon ariaLabel={t('general:menu')} />}
      className={settingsMenuBaseClass}
      horizontalAlign="left"
      id="settings-menu"
      size="small"
      verticalAlign="bottom"
    >
      {settingsMenu.map((item, i) => (
        <Fragment key={`settings-menu-item-${i}`}>{item}</Fragment>
      ))}
    </Popup>
  )
}

function NavIcon({ slug }: { slug: string }) {
  const Icon = ICON_MAP[slug]
  if (!Icon) return null
  return <Icon className={`${baseClass}__link-icon`} />
}

export default function CustomNavClient({
  groups,
  navPreferences,
}: {
  groups: any[]
  navPreferences: any
}) {
  const pathname = usePathname()
  const { config } = useConfig()
  const {
    admin: {
      routes: { browseByFolder: foldersRoute },
    },
    folders,
    routes: { admin: adminRoute },
  } = config
  const { i18n } = useTranslation()

  const folderURL = formatAdminURL({ adminRoute, path: foldersRoute })
  const viewingRootFolderView = pathname.startsWith(folderURL)

  return (
    <Fragment>
      {folders && typeof folders === 'object' && 'browseByFolder' in folders && folders.browseByFolder && <BrowseByFolderButton active={viewingRootFolderView} />}
      {groups.map((group: any) => {
        const { entities, label } = group
        return (
          <NavGroup
            key={label}
            isOpen={navPreferences?.groups?.[label]?.open}
            label={label}
          >
            {entities.map((entity: any, i: number) => {
              const { slug, type, label: entityLabel } = entity
              let href: string
              let id: string
              if (type === EntityType.collection) {
                href = formatAdminURL({ adminRoute, path: `/collections/${slug}` })
                id = `nav-${slug}`
              } else {
                href = formatAdminURL({ adminRoute, path: `/globals/${slug}` })
                id = `nav-global-${slug}`
              }
              const isActive =
                pathname.startsWith(href) &&
                ['/', undefined].includes(pathname[href.length])

              const Label = (
                <Fragment>
                  {isActive && <div className={`${baseClass}__link-indicator`} />}
                  <NavIcon slug={slug} />
                  <span className={`${baseClass}__link-label`}>
                    {getTranslation(entityLabel, i18n)}
                  </span>
                </Fragment>
              )

              if (pathname === href) {
                return (
                  <div className={`${baseClass}__link`} id={id} key={i}>
                    {Label}
                  </div>
                )
              }

              return (
                <Link
                  className={`${baseClass}__link`}
                  href={href}
                  id={id}
                  key={i}
                  prefetch={false}
                >
                  {Label}
                </Link>
              )
            })}
          </NavGroup>
        )
      })}
    </Fragment>
  )
}
