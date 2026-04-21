import type {
  Access,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  Where,
} from 'payload'
import { isAdmin, isMediator, isReviewer, isScholarshipHolder } from './Users'
import { ScholarshipHolder } from '@/payload-types'

const access: Access<ScholarshipHolder> = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user) || isReviewer(user)) return true
  const or: Where[] = []
  if (isScholarshipHolder(user)) {
    or.push({ user: { equals: user.id } })
  }
  if (isMediator(user)) {
    or.push({ mediator: { equals: user.id } })
  }
  if (or.length === 0) return false
  return { or }
}

const normalize = (str: string) => str.toLowerCase().replaceAll(' ', '')

const createUser: CollectionBeforeChangeHook<ScholarshipHolder> = async ({
  data,
  operation,
  req: { payload },
}) => {
  if (operation !== 'create') return data
  if (data.educationLevel !== 'tertiary') return data
  if (!data.nationalId || !data.name) return data
  const user = await payload.create({
    collection: 'users',
    data: {
      name: data.name,
      username: normalize(data.nationalId),
      roles: ['scholarshipHolder'],
      password: normalize(data.nationalId + data.name),
    },
  })
  data.user = user.id
  return data
}

const updateUser: CollectionAfterChangeHook<ScholarshipHolder> = async ({
  doc,
  previousDoc,
  operation,
  req: { payload },
}) => {
  if (operation === 'update' && doc.user) {
    if (doc.nationalId !== previousDoc.nationalId) {
      const userId = typeof doc.user === 'object' ? doc.user.id : doc.user
      try {
        await payload.update({
          collection: 'users',
          id: userId,
          data: {
            username: normalize(doc.nationalId),
          },
        })
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        payload.logger.error(`Could not update linked user ${userId}: ${errorMessage}`)
      }
    }
  }
  return doc
}

const deleteUser: CollectionAfterDeleteHook<ScholarshipHolder> = async ({
  doc,
  req: { payload },
}) => {
  if (doc.user) {
    const userId = typeof doc.user === 'object' ? doc.user.id : doc.user
    try {
      await payload.delete({
        collection: 'users',
        id: userId,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      payload.logger.error(`Could not delete linked user ${userId}: ${errorMessage}`)
    }
  }
  return doc
}

export const ScholarshipHolders: CollectionConfig = {
  slug: 'scholarship-holders',
  fields: [
    {
      name: 'nationalId',
      type: 'text',
      label: { es: 'Documento de identidad' },
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      label: { es: 'Nombre' },
      required: true,
    },
    {
      name: 'educationLevel',
      type: 'select',
      label: { es: 'Nivel educativo' },
      required: true,
      options: [
        { label: { es: 'Primario' }, value: 'primary' },
        { label: { es: 'Secundario' }, value: 'secondary' },
        { label: { es: 'Terciario' }, value: 'tertiary' },
      ],
    },
    {
      name: 'sponsors',
      type: 'relationship',
      label: { es: 'Padrinos' },
      relationTo: 'sponsors',
      hasMany: true,
    },
    {
      name: 'mediator',
      type: 'relationship',
      relationTo: 'users',
      filterOptions: () => ({ roles: { contains: 'mediator' } }),
      label: { es: 'Mediador' },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      filterOptions: () => ({ roles: { contains: 'scholarshipHolder' } }),
      label: { es: 'Usuario' },
    },
  ],
  access: {
    create: ({ req: { user } }) => (user ? isAdmin(user) : false),
    read: access,
    update: ({ req: { user } }) => (user ? isAdmin(user) : false),
    delete: ({ req: { user } }) => (user ? isAdmin(user) : false),
  },
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => !isAdmin(user),
    group: {
      es: 'Personas',
    },
    hideAPIURL: true,
  },
  hooks: {
    beforeChange: [createUser],
    afterChange: [updateUser],
    afterDelete: [deleteUser],
  },
  labels: {
    singular: { es: 'Becario' },
    plural: { es: 'Becarios' },
  },
}
