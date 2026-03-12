import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="page">
      <div className="bg-circles">
        <div className="circle circle-1" />
        <div className="circle circle-2" />
        <div className="circle circle-3" />
      </div>

      <div className="content">
        <div className="logo-block">
          <svg
            width="64"
            height="64"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="18" cy="18" r="13" stroke="#c8e446" strokeWidth="3" fill="none" />
            <circle cx="18" cy="18" r="7" fill="#c8e446" />
            <circle
              cx="38"
              cy="22"
              r="17"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="3"
              fill="none"
            />
            <circle cx="38" cy="22" r="11" fill="#c8e446" />
          </svg>
          <div className="logo-text">
            <span className="logo-name">FONBEC</span>
            <span className="logo-sub">Fondo de Becas para Estudiantes</span>
          </div>
        </div>

        <div className="hero">
          {user ? (
            <p className="greeting">
              Bienvenido, <strong>{user.email}</strong>
            </p>
          ) : null}
          <h1>
            Sistema de gestión
            <br />
            de <em>cartas</em>
          </h1>
          <p className="description">
            Plataforma para el envío y seguimiento de cartas entre becarios y sus padrinos.
          </p>
        </div>

        <div className="actions">
          <a href={payloadConfig.routes.admin} className="btn btn-primary">
            <span>Ir al panel</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="https://www.fonbec.org.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <span>Sitio web</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
