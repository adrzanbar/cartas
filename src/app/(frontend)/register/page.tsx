'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { register } from '@/actions/register'

export default function Page() {
  const [errors, setErrors] = useState<any>({})
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    setErrors({})
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const formElement = e.currentTarget

    startTransition(async () => {
      const result = await register(formData)

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors)
        } else if (result.message) {
          setMessage({ text: result.message, type: 'error' })
        }
      } else {
        setMessage({ text: result.message!, type: 'success' })
        formElement.reset()
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Registro de Becarios
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Solo para estudiantes de nivel terciario
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700">
                Documento de identidad
              </label>
              <input
                id="nationalId"
                name="nationalId"
                type="text"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors"
              />
              {errors?.nationalId?.errors && (
                <p className="mt-1 text-sm text-red-600">{errors.nationalId.errors[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors"
              />
              {errors?.email?.errors && (
                <p className="mt-1 text-sm text-red-600">{errors.email.errors[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors"
              />
              {errors?.password?.errors && (
                <p className="mt-1 text-sm text-red-600">{errors.password.errors[0]}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="passwordConfirmation"
                className="block text-sm font-medium text-gray-700"
              >
                Confirmar contraseña
              </label>
              <input
                id="passwordConfirmation"
                name="passwordConfirmation"
                type="password"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm transition-colors"
              />
              {errors?.passwordConfirmation?.errors && (
                <p className="mt-1 text-sm text-red-600">{errors.passwordConfirmation.errors[0]}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Procesando...' : 'Crear cuenta'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/admin/login" className="font-medium text-black hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
