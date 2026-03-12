import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Sistema de gestión de cartas para becarios y padrinos.',
  title: 'FONBEC Cartas',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
