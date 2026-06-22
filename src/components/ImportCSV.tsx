'use client'

import { useRef, useState, useTransition } from 'react'
import { Banner, Button, Drawer, PopupList, useListQuery, useModal, useTranslation } from '@payloadcms/ui'
import { importMediadores, importPadrinos, importBecarios } from '@/actions/import-csv'
import type { ImportResult } from '@/actions/import-csv'

function ImportDrawer({
  slug,
  titleKey,
  labelKey,
  importFn,
}: {
  slug: string
  titleKey: string
  labelKey: string
  importFn: (fd: FormData) => Promise<ImportResult>
}) {
  const { t } = useTranslation()
  const { openModal } = useModal()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [pending, startTransition] = useTransition()
  const { query, refineListData } = useListQuery()

  const handleImport = () => {
    if (!file) return
    setResult(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await importFn(fd)
      setResult(res)
      refineListData?.({ ...query } as any, true)
    })
  }

  return (
    <>
      <PopupList.Button onClick={() => openModal(slug)}>
        {t(labelKey as any)}
      </PopupList.Button>
      <Drawer slug={slug} title={t(titleKey as any)}>
        <div style={{ padding: 'var(--base)' }}>
          <div
            style={{
              marginBottom: 'var(--base)',
              padding: 'var(--base)',
              border: '1px dashed var(--theme-elevation-300)',
              borderRadius: 'var(--style-radius-m)',
            }}
          >
            <input ref={inputRef} type="file" accept=".csv" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--base)' }}>
              <Button onClick={() => inputRef.current?.click()} buttonStyle="secondary" size="small">
                {t('import-csv:select-file' as any)}
              </Button>
              {file && <span style={{ color: 'var(--theme-text)', fontSize: '0.875rem' }}>{file.name}</span>}
            </div>
          </div>
          <Button onClick={handleImport} disabled={!file || pending} buttonStyle="primary">
            {pending ? t('import-csv:importing' as any) : t('import-csv:import' as any)}
          </Button>
          {result && (
            <div style={{ marginTop: 'var(--base)' }}>
              <Banner type={result.errors.length > 0 ? 'error' : 'success'}>
                {t('import-csv:created' as any)}: {result.created}
                &nbsp;| {t('import-csv:updated' as any)}: {result.updated}
                &nbsp;| {t('import-csv:skipped' as any)}: {result.skipped}
                &nbsp;| {t('import-csv:errors' as any)}: {result.errors.length}
              </Banner>
              {result.errors.length > 0 && (
                <ul style={{ color: 'var(--theme-error-500)', fontSize: '0.875rem', marginTop: 'calc(var(--base) * 0.5)' }}>
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      {t('import-csv:row' as any)} {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Drawer>
    </>
  )
}

export function ImportMediadores() {
  return (
    <ImportDrawer
      slug="import-mediadores"
      titleKey="import-csv:title-mediadores"
      labelKey="import-csv:button-mediadores"
      importFn={importMediadores}
    />
  )
}

export function ImportPadrinos() {
  return (
    <ImportDrawer
      slug="import-padrinos"
      titleKey="import-csv:title-padrinos"
      labelKey="import-csv:button-padrinos"
      importFn={importPadrinos}
    />
  )
}

export function ImportBecarios() {
  return (
    <ImportDrawer
      slug="import-becarios"
      titleKey="import-csv:title-becarios"
      labelKey="import-csv:button-becarios"
      importFn={importBecarios}
    />
  )
}
