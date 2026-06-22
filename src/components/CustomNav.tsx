import { Logout } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import { NavHamburger, NavWrapper } from '@payloadcms/next/client'
import { PREFERENCE_KEYS } from 'payload/shared'
import { cache } from 'react'
import CustomNavClient, { SettingsMenuButton } from './CustomNavClient'

const baseClass = 'nav'

const getNavPrefs = cache(async (req: any) => {
  return req?.user?.collection
    ? await req.payload
        .find({
          collection: 'payload-preferences',
          depth: 0,
          limit: 1,
          pagination: false,
          req,
          where: {
            and: [
              { key: { equals: PREFERENCE_KEYS.NAV } },
              { 'user.relationTo': { equals: req.user.collection } },
              { 'user.value': { equals: req?.user?.id } },
            ],
          },
        })
        .then((res: any) => res?.docs?.[0]?.value)
    : null
})

export default async function CustomNav(props: any) {
  const {
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
    viewType,
    visibleEntities,
  } = props

  if (!payload?.config) return null

  const {
    admin: {
      components: { afterNav, afterNavLinks, beforeNav, beforeNavLinks, logout, settingsMenu },
    },
    collections,
    globals,
  } = payload.config

  const groups = groupNavItems(
    [
      ...collections
        .filter(({ slug }: any) => visibleEntities.collections.includes(slug))
        .map((collection: any) => ({ type: EntityType.collection, entity: collection })),
      ...globals
        .filter(({ slug }: any) => visibleEntities.globals.includes(slug))
        .map((global: any) => ({ type: EntityType.global, entity: global })),
    ],
    permissions,
    i18n,
  )

  const navPreferences = await getNavPrefs(req)

  const serverProps = { i18n, locale, params, payload, permissions, searchParams, user }
  const clientProps = { documentSubViewType, viewType }

  const LogoutComponent = RenderServerComponent({
    clientProps,
    Component: logout?.Button,
    Fallback: Logout,
    importMap: payload.importMap,
    serverProps,
  })

  const RenderedSettingsMenu =
    settingsMenu && Array.isArray(settingsMenu)
      ? settingsMenu.map((item: any, index: number) =>
          RenderServerComponent({
            clientProps,
            Component: item,
            importMap: payload.importMap,
            key: `settings-menu-item-${index}`,
            serverProps,
          }),
        )
      : []

  const RenderedBeforeNav = RenderServerComponent({
    clientProps,
    Component: beforeNav,
    importMap: payload.importMap,
    serverProps,
  })

  const RenderedBeforeNavLinks = RenderServerComponent({
    clientProps,
    Component: beforeNavLinks,
    importMap: payload.importMap,
    serverProps,
  })

  const RenderedAfterNavLinks = RenderServerComponent({
    clientProps,
    Component: afterNavLinks,
    importMap: payload.importMap,
    serverProps,
  })

  const RenderedAfterNav = RenderServerComponent({
    clientProps,
    Component: afterNav,
    importMap: payload.importMap,
    serverProps,
  })

  return (
    <NavWrapper baseClass={baseClass}>
      {RenderedBeforeNav}
      <nav className={`${baseClass}__wrap`}>
        {RenderedBeforeNavLinks}
        <CustomNavClient groups={groups} navPreferences={navPreferences} />
        {RenderedAfterNavLinks}
        <div className={`${baseClass}__controls`}>
          <SettingsMenuButton settingsMenu={RenderedSettingsMenu} />
          {LogoutComponent}
        </div>
      </nav>
      {RenderedAfterNav}
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <NavHamburger baseClass={baseClass} />
        </div>
      </div>
    </NavWrapper>
  )
}
