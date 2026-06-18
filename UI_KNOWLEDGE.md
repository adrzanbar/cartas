# @payloadcms/ui — Internal Reference

`@payloadcms/ui@3.80.0`. Subpath exports in `package.json`:

| Import | Contents |
|---|---|
| `@payloadcms/ui` | All client components, hooks, providers, fields, icons |
| `@payloadcms/ui/rsc` | Server-component-safe utilities (renderTable, resolveFilterOptions, etc.) |
| `@payloadcms/ui/shared` | Shared utilities, glyphs, formatting (requests, formatAdminURL, groupNavItems) |
| `@payloadcms/ui/css` | Compiled global styles |
| `@payloadcms/ui/scss` | SCSS library (mixins, variables) |

**Performance rule for frontend code:** import tree-shakeable paths (e.g. `@payloadcms/ui/elements/Button`) instead of `@payloadcms/ui` to keep bundle small.

---

## Hooks

All hooks must be used in Client Components (`'use client'`).

### Form Hooks (`@payloadcms/ui`)

| Hook | Returns | Description |
|---|---|---|
| `useForm` | `Context` | Full form state, submit/validate. Causes re-render on any field change. |
| `useDocumentForm` | `Context` | Document-level form from within a child form (e.g. lexical Blocks) |
| `useFormFields(selector)` | `Value` | Subscribe to specific fields only: `useFormFields(([fields]) => fields[path])` |
| `useAllFormFields` | `FormFieldsContextType` | Raw field map — prefer `useFormFields` |
| `useFormSubmitted` | `boolean` | True after form submit |
| `useFormProcessing` | `boolean` | True while form is processing |
| `useFormBackgroundProcessing` | `boolean` | True if autosave is running |
| `useFormModified` | `boolean` | True if form has unsaved changes |
| `useFormInitializing` | `boolean` | True while initializing |
| `useWatchForm` | `Context` | Subscribe to form without triggering re-renders |
| `useField<T>(options?)` | `FieldType<T>` | Get/set a single field's value by path. Options: `{ path, validate, disableFormData }` |
| `useFieldPath` (from `'@payloadcms/ui'`) | `string` | Current field path from `FieldPathContext` |
| `useRowLabel<T>()` | `{ data, path, rowNumber }` | Row data inside array/block rows |
| `useControllableState` | State setter | Controlled/uncontrolled state management |

### Auth / Config Hooks

| Hook | Returns | Description |
|---|---|---|
| `useAuth<T>()` | `AuthContext<T>` | `user`, `logOut`, `permissions`, `token`, `refreshCookie`, `setUser` |
| `useConfig()` | `{ config, getEntityConfig, setConfig }` | Client-safe config. `getEntityConfig(slug)` for O(1) lookups. |
| `useLocale()` | `Locale` | Current locale code |
| `useLocaleLoading` | `{ localeIsLoading, setLocaleIsLoading }` | Locale loading state |
| `useTranslation<T>()` | `{ t, i18n, switchLanguage }` | `t('namespace:key')` for i18n |
| `useTheme()` | `{ theme, setTheme, autoMode }` | `'dark' \| 'light'` |
| `useDocumentInfo()` | `DocumentInfoContext` | `id`, `collectionSlug`, `globalSlug`, `data`, `docPermissions`, `docConfig`, `setData`, `versionCount`, `unpublishedVersionCount`, `hasSavePermission`, `hasPublishPermission`, `hasDeletePermission`, `hasTrashPermission`, `unlockDocument`, `updateDocumentEditor` |
| `useDocumentTitle()` | `{ title, setDocumentTitle }` | Document title (prefer over `useDocumentInfo().title`) |
| `useDocumentEvents()` | Context | Document event listeners |
| `useStepNav()` | Navigation state | Set breadcrumb steps via `<SetStepNav />` |
| `useNav()` | `{ navOpen, setNavOpen, hydrated, navRef }` | Sidebar nav state |
| `useFolder()` | Context | Folder browser state |

### Data / API Hooks

| Hook | Signature | Description |
|---|---|---|
| `usePayloadAPI(url, options?)` | `[{ data, isError, isLoading }, { setParams }]` | Fetch data from Payload REST API |
| `usePreferences()` | Context | User preferences CRUD |
| `useServerFunctions()` | Context | Call server functions from client |
| `useActions()` | Context | Register/listen for actions |
| `useClientFunctions()` / `useAddClientFunction` | Context | Register/call client functions |

### UI State Hooks

| Hook | Returns | Description |
|---|---|---|
| `useModal()` (from `@faceless-ui/modal`) | `{ openModal, closeModal, ... }` | Modal management |
| `useNav()` | `{ navOpen, setNavOpen }` | Nav toggle state |
| `useScrollInfo()` | Scroll position | Scroll offset/direction |
| `useWindowInfo()` | Window size/breakpoint | Responsive breakpoints |
| `useSelection()` | Selection state | Row selection in list views |
| `useEditDepth()` | `number` | Current edit depth (drawers stack) |
| `useEntityVisibility()` | Context | Entity visibility state |
| `useRouteTransition()` | Loading state | Route transition progress |
| `useRouteCache()` | Context | Cached route data |
| `useSearchParams()` | URL search params | Current query string |
| `useParams()` | Route params | Dynamic route parameters |
| `useOperation()` | `'create' \| 'update'` | Current CRUD operation |
| `useListQuery()` | `{ query, setQuery, ... }` | List view query state (search, sort, page, filters) |
| `useTableColumns()` | `{ columns, moveColumn, ... }` | Table column state |
| `useCellProps()` | Column cell props | Resolved cell render props |
| `useListRelationships()` | Relationship data | Relationship table state |
| `useBulkUpload()` | Upload state | Bulk upload context |
| `useListDrawerContext()` | Drawer context | List drawer state |

### Drawer Hooks

```tsx
// Document drawer — edit/create docs in a modal
const [DocumentDrawer, DocumentDrawerToggler, { openDrawer, closeDrawer, isDrawerOpen }] = useDocumentDrawer({
  collectionSlug: 'posts',
  id: postId,          // omit for "create new" view
})

// List drawer — pick a doc from a list
const [ListDrawer, ListDrawerToggler, { openDrawer, closeDrawer }] = useListDrawer({
  collectionSlugs: ['posts'],
  filterOptions: {},
})
```

### Utility Hooks

| Hook | Description |
|---|---|
| `useDebounce(value, delay)` | Debounced value |
| `useDebouncedCallback(fn, deps, delay)` | Debounced function |
| `useDebouncedEffect(fn, deps, delay)` | Debounced effect |
| `useDelay(ms)` | Boolean that flips after delay |
| `useDelayedRender(delay)` | Delayed render toggle |
| `useThrottledEffect(fn, deps, delay)` | Throttled effect |
| `useThrottledValue(value, delay)` | Throttled value |
| `useEffectEvent(fn)` | Stable callback reference |
| `useHotkey(key, fn)` | Keyboard shortcut binding |
| `useIntersect(options)` | IntersectionObserver |
| `useResize(handler)` | ResizeObserver |
| `useQueue()` | Sequential task queue |
| `useUseTitleField()` | Resolve `useAsTitle` field |
| `useClickOutside(ref, handler)` | Click outside detection |
| `usePopupWindow(url)` | Popup window management |
| `useRelatedCollections(relationTo)` | Resolve related collections |
| `useDrawerSlug()` | Current drawer slug |
| `useDrawerDepth()` | Current drawer depth |
| `useCollapsible()` | Collapsible toggle state |
| `useDocumentDrawerContext()` | Document drawer context |
| `useLivePreviewContext()` | Live preview context |

---

## Providers

All render in `RootProvider`. Usually you only mount custom ones via `admin.components.providers`.

| Provider | Must wrap? | Notes |
|---|---|---|
| `RootProvider` | Yes (root) | Composes all built-in providers |
| `ConfigProvider` | Yes | Provides `useConfig` |
| `AuthProvider` | Yes | Provides `useAuth` |
| `DocumentInfoProvider` | Per-document | Provides `useDocumentInfo` |
| `LocaleProvider` | Yes | Provides `useLocale` |
| `TranslationProvider` | Yes | Provides `useTranslation` |
| `ThemeProvider` | Yes | Provides `useTheme` |
| `PreferencesProvider` | Yes | User preferences |
| `ListQueryProvider` | List views | `useListQuery` |
| `TableColumnsProvider` | List views | `useTableColumns` |
| `SelectionProvider` | List views | Row selection |
| `NavProvider` | Yes | Sidebar nav state |
| `FolderProvider` | Folder views | Folder browser |
| `LivePreviewProvider` | Live preview | Live preview state |
| `EditDepthProvider` | Drawers | Edit depth tracking |
| `EntityVisibilityProvider` | Per-collection | Entity visibility |
| `ScrollInfoProvider` | Yes | Scroll position |
| `WindowInfoProvider` | Yes | Window/breakpoint info |
| `RouteTransitionProvider` | Yes | Route transition |
| `RouteCacheProvider` | Yes | Route data caching |
| `SearchParamsProvider` | Yes | URL search params |
| `UploadControlsProvider` | Upload views | Upload state |
| `UploadEditsProvider` | Upload editing | Upload edit state |
| `UploadHandlersProvider` | Upload | Upload handler registration |
| `ActionsProvider` | Yes | Action registry |
| `ClientFunctionProvider` | Yes | Client function registry |
| `ServerFunctionsProvider` | Yes | Server function calls |
| `DocumentEventsProvider` | Yes | Document events |
| `BulkUploadProvider` | Bulk upload | Bulk upload state |
| `RelationshipProvider` | Table | Relationship cell data |
| `RowLabelProvider` | Arrays/Blocks | Row label data + path |
| `TabsProvider` | Tabs field | Tabs state |
| `DrawerDepthProvider` | Yes | Drawer depth tracking |
| `PageConfigProvider` | Per-page | Page-level config (experimental) |
| `ClickOutsideProvider` | Yes | Click outside tracking |
| `OperationProvider` | Per-document | CRUD operation type |
| `ParamsProvider` | Yes | Route params |
| `FolderProvider` | Yes | Folder state |

---

## Elements (UI Components)

All importable from `@payloadcms/ui`. Key ones:

| Component | Props Summary | Purpose |
|---|---|---|
| `Button` | `buttonStyle`, `size`, `icon`, `iconPosition`, `el`, `url`, `to`, `disabled`, `onClick`, `type`, `round`, `tooltip`, `secondaryActions`, `SubMenuPopupContent`, `programmaticSubmit`, `buttonId` | Versatile button (primary/secondary/error/pill etc.) |
| `Banner` | `type` (`'default'\|'error'\|'info'\|'success'`), `icon`, `alignIcon`, `to`, `onClick` | Notification banner |
| `Card` | Basic card container | Dashboard/collection card |
| `Collapsible` | `children`, header | Collapsible panel. Use `useCollapsible()` hook |
| `Drawer` / `DrawerToggler` | `slug`, `title`, `Header`, `gutter` | Slide-out drawer. Slug must be unique + use `formatDrawerSlug` |
| `Modal` / `useModal` | (from `@faceless-ui/modal`) | Modal dialog |
| `Popup` | `button`, `render`, `horizontalAlign`, `verticalAlign`, `size`, `buttonType`, `buttonStyle`, `showOnHover`, `caret`, `forceOpen` | Context menu / dropdown |
| `PopupList.ButtonGroup` / `PopupList.Button` / `PopupList.Divider` | `ButtonGroup: { buttonSize, textAlign }`, `Button: { active, href, onClick }` | Menu items for settingsMenu and editMenuItems |
| `Pill` | Pill/badge | Small label |
| `PillSelector` | `options: SelectablePill[]` | Multi-select pill UI |
| `Link` | Wraps `next/link` with `preventDefault` | Admin-safe link |
| `Gutter` | `className` | Horizontal padding container |
| `Table` | `columns`, `data`, `appearance` | Data table |
| `DefaultCell` | Various | Default table cell renderer |
| `DateCell` | Date display | Date table cell |
| `Pagination` | Page navigation | Pagination controls |
| `PerPage` | Limit selector | Items-per-page dropdown |
| `PageControls` | Page nav | Lower-level pagination |
| `SearchFilter` | Text input | List search box |
| `ListControls` | Controls bar | Search + where + columns |
| `WhereBuilder` | Where query builder | Filter builder UI |
| `SortColumn` / `SortHeader` / `SortRow` | Sort state | Column sorting |
| `ColumnSelector` | Column picker | Toggle visible columns |
| `BulkUploadDrawer` | Upload drawer | Bulk file upload |
| `Upload` | File upload | File upload component |
| `EditUpload` | Crop/editor | Image crop/edit |
| `FileDetails` | File info | File metadata display |
| `Thumbnail` / `ThumbnailCard` | Thumbnail | Image thumbnail |
| `PreviewButton` | Preview | Document preview button |
| `PublishButton` / `SaveButton` / `SaveDraftButton` / `UnpublishButton` | Save/publish | Document action buttons |
| `DeleteMany` / `EditMany` / `PublishMany` / `UnpublishMany` / `RestoreMany` | Bulk actions | Batch operations |
| `SelectAll` / `SelectRow` / `SelectMany` | Selection | Row selection |
| `DocumentControls` | Controls bar | Document save/publish bar |
| `DocumentFields` | Field layout | Renders all document fields |
| `DocumentDrawer` / `DocumentDrawerToggler` | Drawer | Document edit drawer |
| `ListDrawer` / `ListDrawerToggler` | Drawer | Document picker drawer |
| `ItemsDrawer` | Drawer | Relationship items picker |
| `BlocksDrawer` / `BlockSelector` / `SectionTitle` | Block picker | Block field UI |
| `RelationshipTable` | Table | Related documents table |
| `Dropzone` | File drop | Drag-and-drop upload |
| `ConfirmationModal` | Confirm | Confirmation dialog |
| `FullscreenModal` | Fullscreen | Fullscreen overlay |
| `GenerateConfirmation` | Confirm step | Confirmation with extra UI |
| `LoadingOverlay` / `LoadingOverlayToggle` / `FormLoadingOverlayToggle` | Loading | Loading spinner overlay |
| `ShimmerEffect` / `StaggeredShimmers` | Skeleton | Loading skeleton |
| `AnimateHeight` | Animate | Height animation wrapper |
| `Tooltip` | Tooltip | Hover tooltip |
| `Toasts` (re-exports `sonner.toast`) | Toast | `toast('message')`, `toast.error('err')` |
| `ErrorPill` | Error | Field error badge |
| `TimezonePicker` | Timezone | Timezone selector |
| `DatePicker` | Date | Date/time picker |
| `ReactSelect` / `Select` | Options | Multi-select dropdown |
| `Combobox` | `{ options: ComboboxEntry[] }` | Autocomplete dropdown |
| `CodeEditor` | Code | Monaco code editor |
| `CopyToClipboard` | Copy | Copy button |
| `CopyLocaleData` | Locale copy | Copy data between locales |
| `DraggableSortable` | Drag | Drag-and-drop sort |
| `StepNav` / `SetStepNav` | Breadcrumbs | Breadcrumb navigation |
| `Nav` / `NavGroup` | Sidebar | Admin nav |
| `NavToggler` | Toggle | Nav collapse toggle |
| `AppHeader` | Header | Admin header bar |
| `Hamburger` | Menu | Hamburger menu button |
| `Logout` | Logout | Logout component |
| `Locked` | Locked doc | Document locked overlay |
| `StayLoggedIn` | Session | Session keep-alive |
| `Status` | Status | Draft/published indicator |
| `SearchFilter` | Search | Search input |
| `ViewDescription` | Description | Collection/global description |
| `RenderCustomComponent` | Render | Utility to render custom components |
| `RenderServerComponent` | SSR render | Utility to render server components |
| `RenderTitle` | Title | Document title renderer |
| `HydrateAuthProvider` | Hydration | Auth state rehydration |
| `BulkUploadDrawer` | Upload | Bulk upload drawer |
| `EmailAndUsernameFields` | Auth | Login form fields |
| `LivePreviewWindow` / `LivePreview` | Preview | Live preview pane |
| `MoveDocToFolder` / `MoveDocToFolderButton` | Folder move | Move document between folders |
| `RenderFields` | Fields | Field renderer from form state |
| `Localizer` | Language | Language switcher |

### WhereBuilder Conditions (sub-components)

| Export | Type |
|---|---|
| `TextCondition` | `Text` |
| `SelectCondition` | `Select` |
| `RelationshipCondition` | `Relationship` |
| `NumberCondition` | `Number` |
| `DateCondition` | `Date` |

---

## Field Components

All field components have corresponding `*Field` (form) and `*Input` (raw) versions:

| Field | Form Component | Input Component |
|---|---|---|
| Text | `TextField` | `TextInput` |
| Textarea | `TextareaField` | `TextareaInput` |
| Number | `NumberField` | — |
| Email | `EmailField` | — |
| Password | `PasswordField` | — |
| ConfirmPassword | `ConfirmPasswordField` | — |
| Checkbox | `CheckboxField` | `CheckboxInput` |
| Select | `SelectField` | `SelectInput` |
| RadioGroup | `RadioGroupField` | — |
| Relationship | `RelationshipField` | `RelationshipInput` |
| Upload | `UploadField` | `UploadInput` |
| DateTime | `DateTimeField` | — |
| JSON | `JSONField` | — |
| Code | `CodeField` | — |
| Point | `PointField` | — |
| Array | `ArrayField` | — |
| Blocks | `BlocksField` | — |
| Group | `GroupField` | — |
| Row | `RowField` | — |
| Tabs | `TabsField` (with `TabsProvider`) | — |
| Collapsible | `CollapsibleField` | — |
| Slug | `SlugField` | — |
| UI | `UIField` | — |
| Hidden | `HiddenField` | — |
| Join | `JoinField` | — |

Field sub-components: `FieldDescription`, `FieldError`, `FieldLabel`.

---

## Icons

All importable from `@payloadcms/ui`:

CalendarIcon, CheckIcon, ChevronIcon, CloseMenuIcon, CodeBlockIcon, CopyIcon, DocumentIcon, DragHandleIcon, EditIcon, ExternalLinkIcon, EyeIcon, FolderIcon, GearIcon, GridViewIcon, LineIcon, LinkIcon, ListViewIcon, LockIcon, LogOutIcon, MenuIcon, MinimizeMaximizeIcon, MoreIcon, MoveFolderIcon, PeopleIcon, PlusIcon, SearchIcon, SortIcon, SwapIcon, ThreeDotsIcon, TrashIcon, XIcon

Toast icons: `ErrorIcon`, `InfoIcon`, `SuccessIcon`, `WarningIcon`.

---

## Graphics

| Export | Purpose |
|---|---|
| `PayloadIcon` | Main Payload logo icon |
| `PayloadLogo` | Full Payload logo (login page) |
| `Account` | Account graphic |
| `File` | File type icon |
| `DefaultBlockImage` | Default block thumbnail |

---

## Forms

| Export | Purpose |
|---|---|
| `Form` | Form component with `FormProps` |
| `FormSubmit` | Submit button |
| `fieldReducer` | Form state reducer |
| `FieldContext` | Field context provider |
| `withCondition` | HOC for conditional fields |
| `WatchCondition` | Conditional watch component |
| `NullifyLocaleField` | Locale nullification |
| `WatchChildErrors` | Child error watcher |
| `RenderFields` | Renders fields from schema |
| `RowLabel` | Array/block row label |
| `RowLabelProvider` | Row label context |

---

## RSC Exports (`@payloadcms/ui/rsc`)

Server-side utilities for custom views:

| Export | Purpose |
|---|---|
| `renderTable` | Server-side table rendering |
| `renderFilters` | Server-side filter rendering |
| `resolveFilterOptions` | Resolve relationship filter options |
| `getColumns` | Get column state server-side |
| `FolderTableCell` | Folder table cell (server) |
| `FolderField` | Folder field (server) |
| `CollectionCards` | Dashboard collection cards widget |
| `FieldDiffContainer` / `FieldDiffLabel` | Version diff UI |
| `getHTMLDiffComponents` / `escapeDiffHTML` | HTML diff utilities |
| `upsertPreferences` | Save preferences server-side |
| `handleLivePreview` / `handlePreview` | Preview handlers |
| `copyDataFromLocaleHandler` | Cross-locale copy handler |
| `getFolderResultsComponentAndData` | Folder view data |
| `_internal_renderFieldHandler` | Internal field renderer |
| `File` | File graphic (server-safe) |
| `CheckIcon` | Check icon (server-safe) |

---

## Shared Exports (`@payloadcms/ui/shared`)

| Export | Purpose |
|---|---|
| `requests` (from `utilities/api.js`) | HTTP client for Payload REST API |
| `formatAdminURL({ adminRoute, serverURL, path })` | Build admin URLs |
| `formatDocTitle(doc, config)` | Format document title |
| `formatDate(date, config, dateFNSKey)` | Format date for display |
| `getNavGroups({ collectionConfigs, globalConfigs, permissions })` | Build nav groups |
| `groupNavItems` / `EntityType` / `NavGroupType` | Nav grouping types |
| `getVisibleEntities` | Get visible collections/globals |
| `getGlobalData` | Get global document data |
| `isEditing` / `hasSavePermission` | Edit/save permission checks |
| `isClientUserObject` | Client user type guard |
| `handleBackToDashboard` / `handleGoBack` | Navigation utilities |
| `handleTakeOver` | Document take-over handler |
| `sanitizeID` | Sanitize document IDs |
| `traverseForLocalizedFields` | Find localized fields |
| `findLocaleFromCode` | Resolve locale by code |
| `filterFields` | Filter fields for column state |
| `getInitialColumns` | Default column state |
| `Translation` / `withMergedProps` / `WithServerSideProps` | Utilities |
| `abortAndIgnore` / `handleAbortRef` | Abort controller helpers |
| `PayloadIcon` / `PayloadLogo` | Glyph components (server-safe) |
| `reduceToSerializableFields` | Strip non-serializable from form state |
| `mergeFieldStyles` | Merge field-level CSS |

---

## Styling

```scss
// In a Custom Component:
@import '~@payloadcms/ui/scss';

.my-component {
  @include mid-break { ... }
  background: var(--theme-elevation-100);
  color: var(--theme-text);
}
```

### Available CSS Variables

`--theme-elevation-50` through `--theme-elevation-900`, `--theme-border`, `--theme-text`, `--theme-bg`, `--theme-input-bg`, `--theme-success-*`, `--theme-error-*`, `--theme-warning-*`, `--theme-dr-table-header`, `--theme-baseline`, `--base` (spacing unit), `--breakpoints-xs` through `--breakpoints-xl`, `--font-body`, `--font-mono`, `--style-radius-s` / `--style-radius-m`.

---

## Widgets

| Widget | Purpose |
|---|---|
| `CollectionCards` (from `@payloadcms/ui/rsc`) | Built-in collections/globals dashboard widget |

Define custom widgets in `admin.dashboard.widgets`. Each receives `WidgetServerProps` with `req` and optional `widgetData`.

---

## Performance Rules

1. **Admin panel UI**: import from `@payloadcms/ui` directly (no tree-shaking needed inside admin)
2. **Frontend app**: import from `@payloadcms/ui/elements/Button` etc. (tree-shakeable paths)
3. **Form subscriptions**: prefer `useFormFields(selector)` over `useForm()` — scoped subscriptions avoid full re-renders
4. **Server Components**: default — only add `'use client'` when you need state, effects, event handlers, or browser APIs
