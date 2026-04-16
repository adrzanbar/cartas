'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { z } from 'zod'

const schema = z
  .object({
    nationalId: z
      .string()
      .min(2, { message: 'El documento de identidad debe tener al menos 2 caracteres.' }),
    email: z.email({ message: 'Por favor, ingresa un correo electrónico válido.' }),
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    passwordConfirmation: z
      .string()
      .min(8, { message: 'La confirmación de la contraseña debe tener al menos 8 caracteres.' }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Las contraseñas no coinciden.',
    path: ['passwordConfirmation'],
  })

export async function register(formData: FormData) {
  const data = {
    nationalId: formData.get('nationalId'),
    email: formData.get('email'),
    password: formData.get('password'),
    passwordConfirmation: formData.get('passwordConfirmation'),
  }

  const valid = schema.safeParse(data)

  if (!valid.success) {
    const errorTree = z.treeifyError(valid.error)
    return {
      success: false,
      errors: errorTree.properties,
    }
  }

  const { nationalId, email, password } = valid.data

  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.find({
      collection: 'scholarship-holders',
      where: {
        nationalId: {
          equals: nationalId,
        },
        educationLevel: {
          equals: 'tertiary',
        },
      },
      pagination: false,
      depth: 0,
      limit: 1,
    })

    if (result.totalDocs > 0) {
      const scholarshipHolder = result.docs[0]

      try {
        const user = await payload.create({
          collection: 'users',
          data: {
            email,
            password,
            nationalId: scholarshipHolder.nationalId as string,
            name: scholarshipHolder.name as string,
            roles: ['editor'],
          },
          overrideAccess: true,
        })

        // 3. Crear el registro de mediación vinculando ambos IDs
        await payload.create({
          collection: 'scholarship-holder-mediations',
          data: {
            user: user.id,
            scholarshipHolder: scholarshipHolder.id,
          },
          overrideAccess: true, // Sigue siendo necesario porque el usuario no ha iniciado sesión
        })
      } catch (creationError) {
        console.error('Error al crear usuario o mediación:', creationError)
      }
    }

    return {
      success: true,
      message:
        'Si el Documento de identidad proporcionado corresponde a un estudiante elegible y el correo es correcto, tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
    }
  } catch (error) {
    console.error('Registration processing error:', error)
    return {
      success: false,
      message:
        'Ocurrió un error inesperado al procesar tu registro. Por favor, inténtalo de nuevo más tarde.',
    }
  }
}
