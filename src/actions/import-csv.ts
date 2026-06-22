'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import type { PayloadLogger, RequiredDataFromCollectionSlug, Where } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { isAdmin } from '@/collections/Users'
import Papa from 'papaparse'

const log = (logger: PayloadLogger, tag: string, msg: string) =>
  logger.info(`[import-csv] [${tag}] ${msg}`)

export type ImportResult = {
  created: number
  updated: number
  skipped: number
  errors: { row: number; message: string }[]
}

const normalize = (str: string) => str.toLowerCase().replace(/\s/g, '')

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const result = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true })
  const allRows = result.data
  if (allRows.length < 2) return { headers: [], rows: [] }

  const headerIdx = allRows.findIndex((r) => r.some((c) => c?.trim() === 'Nombre'))
  if (headerIdx === -1) return { headers: [], rows: [] }

  return {
    headers: allRows[headerIdx].map((c) => c?.trim() ?? ''),
    rows: allRows.slice(headerIdx + 1).map((r) => r.map((c) => c?.trim() ?? '')),
  }
}

async function authenticate() {
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  if (!user || !isAdmin(user)) throw new Error('No autorizado')
  const req = { user }
  return { payload, req }
}

async function getFile(formData: FormData): Promise<string | null> {
  const entry = formData.get('file')
  const file = entry instanceof File ? entry : null
  if (!file) return null
  return file.text()
}

export async function importMediadores(formData: FormData): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const { payload, req } = await authenticate()
    const text = await getFile(formData)
    if (!text) { result.errors.push({ row: 0, message: 'No se proporcionó archivo' }); return result }

    const { headers, rows } = parseCSV(text)
    const nameIdx = headers.indexOf('Nombre')
    const dniIdx = headers.indexOf('DNI')
    if (nameIdx === -1 || dniIdx === -1) {
      result.errors.push({ row: 0, message: 'Columnas requeridas no encontradas: Nombre, DNI' })
      return result
    }

    log(payload.logger, 'mediadores', `Import start: ${rows.length} rows`)
    for (let i = 0; i < rows.length; i++) {
      const name = rows[i][nameIdx]?.trim()
      const dni = rows[i][dniIdx]?.trim()
      if (!name || !dni) { result.skipped++; continue }

      const username = normalize(dni)
      try {
        const existing = await payload.find({
          collection: 'users',
          where: { username: { equals: username } },
          req, overrideAccess: false, limit: 1, pagination: false,
        })

        if (existing.docs.length > 0) {
          await payload.update({
            collection: 'users',
            id: String(existing.docs[0].id),
            data: {
              name,
              roles: existing.docs[0].roles?.includes('mediator')
                ? existing.docs[0].roles
                : [...(existing.docs[0].roles || []), 'mediator'],
            },
            req, overrideAccess: false,
          })
          result.updated++
          log(payload.logger, 'mediadores', `Row ${i + 1}: "${name}" (${dni}) → updated user ${existing.docs[0].id}`)
        } else {
          await payload.create({
            collection: 'users',
            data: { name, username, roles: ['mediator'], password: username + normalize(name) },
            req, overrideAccess: false,
          })
          result.created++
          log(payload.logger, 'mediadores', `Row ${i + 1}: "${name}" (${dni}) → created user`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        result.errors.push({ row: i + 4, message: msg })
        log(payload.logger, 'mediadores', `Row ${i + 1}: "${name}" (${dni}) → ERROR: ${msg}`)
      }
    }
    log(payload.logger, 'mediadores', `Done: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`)
  } catch (err) {
    result.errors.push({ row: 0, message: err instanceof Error ? err.message : String(err) })
    console.error(`[import-csv] [mediadores] Fatal: ${err instanceof Error ? err.message : err}`)
  }
  revalidatePath('/admin/collections/users')
  return result
}

export async function importPadrinos(formData: FormData): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const { payload, req } = await authenticate()
    const text = await getFile(formData)
    if (!text) { result.errors.push({ row: 0, message: 'No se proporcionó archivo' }); return result }

    const { headers, rows } = parseCSV(text)
    const nameIdx = headers.indexOf('Nombre')
    const emailIdx = headers.indexOf('Email')
    const emailCartasIdx = headers.indexOf('Email para cartas')
    const empresaIdx = headers.indexOf('Empresa')
    const dniIdx = headers.indexOf('DNI')
    const cuitIdx = headers.indexOf('CUIT/CUIL')
    if (nameIdx === -1) {
      result.errors.push({ row: 0, message: 'Columna requerida no encontrada: Nombre' })
      return result
    }

    log(payload.logger, 'padrinos', `Import start: ${rows.length} rows`)
    for (let i = 0; i < rows.length; i++) {
      const name = rows[i][nameIdx]?.trim()
      if (!name) { result.skipped++; continue }

      const emailCartasVal = emailCartasIdx !== -1 ? rows[i][emailCartasIdx]?.trim() || '' : ''
      const email = emailCartasVal || (emailIdx !== -1 ? rows[i][emailIdx]?.trim() || '' : '')

      const organizationName = empresaIdx !== -1 ? rows[i][empresaIdx]?.trim() || '' : ''
      const nationalId = dniIdx !== -1 ? rows[i][dniIdx]?.trim() || '' : ''
      const laborTaxUniqueKey = cuitIdx !== -1 ? rows[i][cuitIdx]?.trim() || '' : ''

      try {
        const baseData: Partial<RequiredDataFromCollectionSlug<'sponsors'>> = { name }
        if (organizationName) baseData.organizationName = organizationName
        if (nationalId) baseData.nationalId = nationalId
        if (laborTaxUniqueKey) baseData.laborTaxUniqueKey = laborTaxUniqueKey

        if (email) {
          const orClause: Where[] = [
            { name: { equals: name } },
            ...(nationalId ? [{ nationalId: { equals: nationalId } }] : []),
            ...(laborTaxUniqueKey ? [{ laborTaxUniqueKey: { equals: laborTaxUniqueKey } }] : []),
          ]

          const existing = await payload.find({
            collection: 'sponsors',
            where: { email: { equals: email }, OR: orClause },
            req, overrideAccess: false, limit: 1, pagination: false,
          })
          if (existing.docs.length > 0) {
            await payload.update({
              collection: 'sponsors',
              id: existing.docs[0].id,
              data: baseData,
              req, overrideAccess: false,
            })
            result.updated++
            log(payload.logger, 'padrinos', `Row ${i + 1}: "${name}" (email=${email}) → updated sponsor ${existing.docs[0].id}`)
          } else {
            await payload.create({
              collection: 'sponsors', data: { ...baseData, email },
              req, overrideAccess: false,
            })
            result.created++
            log(payload.logger, 'padrinos', `Row ${i + 1}: "${name}" (email=${email}) → created sponsor`)
          }
        } else {
          await payload.create({
            collection: 'sponsors', data: baseData,
            req, overrideAccess: false,
          })
          result.created++
          log(payload.logger, 'padrinos', `Row ${i + 1}: "${name}" (no email) → created sponsor`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        result.errors.push({ row: i + 4, message: msg })
        log(payload.logger, 'padrinos', `Row ${i + 1}: "${name}" → ERROR: ${msg}`)
      }
    }
    log(payload.logger, 'padrinos', `Done: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`)
  } catch (err) {
    result.errors.push({ row: 0, message: err instanceof Error ? err.message : String(err) })
    console.error(`[import-csv] [padrinos] Fatal: ${err instanceof Error ? err.message : err}`)
  }
  revalidatePath('/admin/collections/sponsors')
  return result
}

const levelMap: Record<string, 'primary' | 'secondary' | 'tertiary'> = {
  Primario: 'primary',
  Secundario: 'secondary',
  Terciario: 'tertiary',
  Universitario: 'tertiary',
  'Tecnicaturas y Capacitación para el trabajo': 'tertiary',
  Posgrado: 'tertiary',
}

export async function importBecarios(formData: FormData): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const { payload, req } = await authenticate()
    const text = await getFile(formData)
    if (!text) {
      result.errors.push({ row: 0, message: 'No se proporcionó archivo' })
      return result
    }

    const { headers, rows } = parseCSV(text)
    const nameIdx = headers.indexOf('Nombre')
    const dniIdx = headers.indexOf('DNI')
    const nivelIdx = headers.indexOf('Nivel')
    const mediadorIdx = headers.indexOf('Mediador')
    const padrinoIdx = headers.indexOf('Padrino')
    if (nameIdx === -1 || dniIdx === -1 || nivelIdx === -1) {
      result.errors.push({
        row: 0,
        message: 'Columnas requeridas no encontradas: Nombre, DNI, Nivel',
      })
      return result
    }

    log(payload.logger, 'becarios', `Import start: ${rows.length} rows`)
    for (let i = 0; i < rows.length; i++) {
      const name = rows[i][nameIdx]?.trim()
      const dni = rows[i][dniIdx]?.trim()
      const nivel = rows[i][nivelIdx]?.trim()
      if (!name || !dni || !nivel) {
        result.skipped++
        continue
      }

      const educationLevel = levelMap[nivel]
      if (!educationLevel) {
        result.errors.push({ row: i + 4, message: `Nivel educativo desconocido: "${nivel}"` })
        log(payload.logger, 'becarios', `Row ${i + 1}: "${name}" → unknown level "${nivel}"`)
        continue
      }

      try {
        let mediatorId: number | undefined
        if (mediadorIdx !== -1) {
          const mediadorName = rows[i][mediadorIdx]?.trim()
          if (mediadorName) {
            const mediatorUsers = await payload.find({
              collection: 'users',
              where: {
                and: [{ name: { like: mediadorName } }, { roles: { contains: 'mediator' } }],
              },
              req,
              overrideAccess: false,
              limit: 1,
              pagination: false,
            })
            if (mediatorUsers.docs.length > 0) {
              mediatorId = mediatorUsers.docs[0].id
            }
          }
        }

        const sponsorIds: number[] = []
        if (padrinoIdx !== -1) {
          const raw = rows[i][padrinoIdx]?.trim()
          if (raw) {
            const seen = new Set<number>()
            const names = raw
              .replace(/ \/ \([^)]*\) - \d{1,2}\/\d{1,2}\/\d{2,4}/g, '')
              .replace(/ - \d{1,2}\/\d{1,2}\/\d{2,4}/g, '')
              .split(',').map(s => s.trim()).filter(Boolean)
            const all = names.length > 0
              ? [...names.slice(0, -1), ...names[names.length - 1].split(' y ').map(s => s.trim())]
              : []
            for (const name of all) {
              const clean = name.trim().replace(/\s+/g, ' ')
              if (!clean) continue
              const found = await payload.find({
                collection: 'sponsors',
                where: { name: { like: clean } },
                req,
                overrideAccess: false,
                limit: 1,
                pagination: false,
              })
              if (found.docs.length > 0) {
                const id = found.docs[0].id
                if (!seen.has(id)) { seen.add(id); sponsorIds.push(id) }
              } else {
                result.errors.push({ row: i + 4, message: `Padrino no encontrado: "${clean}"` })
              }
            }
          }
        }

        const existing = await payload.find({
          collection: 'scholarship-holders',
          where: { nationalId: { equals: dni } },
          req,
          overrideAccess: false,
          limit: 1,
          pagination: false,
        })
        const mediatorLog = mediatorId ? `mediator=${mediatorId}` : 'no mediator'
        const sponsorsLog =
          sponsorIds.length > 0 ? `sponsors=[${sponsorIds.join(',')}]` : 'no sponsors'

        if (existing.docs.length > 0) {
          const updateData: Partial<RequiredDataFromCollectionSlug<'scholarship-holders'>> = {
            name,
            educationLevel,
          }
          if (mediatorId) updateData.mediator = mediatorId
          if (sponsorIds.length > 0) updateData.sponsors = sponsorIds
          await payload.update({
            collection: 'scholarship-holders',
            id: String(existing.docs[0].id),
            data: updateData,
            req,
            overrideAccess: false,
          })
          result.updated++
          log(
            payload.logger,
            'becarios',
            `Row ${i + 1}: "${name}" (${dni}) → updated sh ${existing.docs[0].id} | ${mediatorLog} | ${sponsorsLog}`,
          )
        } else {
          const createData: RequiredDataFromCollectionSlug<'scholarship-holders'> = {
            nationalId: dni,
            name,
            educationLevel,
          }
          if (mediatorId) createData.mediator = mediatorId
          if (sponsorIds.length > 0) createData.sponsors = sponsorIds
          await payload.create({
            collection: 'scholarship-holders',
            data: createData,
            req,
            overrideAccess: false,
          })
          result.created++
          log(
            payload.logger,
            'becarios',
            `Row ${i + 1}: "${name}" (${dni}) → created | ${mediatorLog} | ${sponsorsLog}`,
          )
        }
      } catch (err) {
        result.errors.push({
          row: i + 4,
          message: err instanceof Error ? err.message : String(err),
        })
        log(
          payload.logger,
          'becarios',
          `Row ${i + 1}: "${name}" → ERROR: ${err instanceof Error ? err.message : err}`,
        )
      }
    }
    log(
      payload.logger,
      'becarios',
      `Done: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`,
    )
  } catch (err) {
    result.errors.push({ row: 0, message: err instanceof Error ? err.message : String(err) })
    console.error(`[import-csv] [becarios] Fatal: ${err instanceof Error ? err.message : err}`)
  }
  revalidatePath('/admin/collections/scholarship-holders')
  return result
}
