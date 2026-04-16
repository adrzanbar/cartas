import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import { Nunito } from 'next/font/google'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
})

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const btnBase =
    'inline-flex items-center gap-2 py-[14px] px-6 rounded-[10px] text-[15px] font-extrabold no-underline transition-all duration-150 hover:opacity-[0.88] hover:-translate-y-[1px] active:translate-y-0 active:opacity-75 cursor-pointer'

  return (
    <div
      className={`min-h-screen bg-[#0a3d38] flex items-center justify-center relative overflow-hidden py-10 px-6 ${nunito.className}`}
    >
      {/* Background Circles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full w-[500px] h-[500px] border-2 border-[#c8e446]/[0.08] -top-[120px] -right-[100px]" />
        <div className="absolute rounded-full w-[300px] h-[300px] bg-[#1a9e8e]/15 -bottom-[60px] -left-[60px]" />
        <div className="absolute rounded-full w-[180px] h-[180px] border-2 border-[#c8e446]/[0.12] bottom-[80px] right-[10%]" />
      </div>

      <div className="relative z-10 max-w-[560px] w-full flex flex-col gap-10">
        {/* Logo Block */}
        <div className="flex items-center gap-4">
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
          <div className="flex flex-col">
            <span className="text-[28px] min-[480px]:text-[36px] font-black text-white leading-none tracking-[-1px]">
              FONBEC
            </span>
            <span className="text-xs font-semibold text-white/55 mt-0.5 tracking-[0.02em]">
              Fondo de Becas para Estudiantes
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col gap-4">
          {user ? (
            <p className="text-sm font-semibold text-[#c8e446] tracking-[0.04em]">
              Bienvenido, <strong className="font-extrabold">{user.email}</strong>
            </p>
          ) : null}
          <h1 className="text-[38px] min-[480px]:text-[52px] font-black text-white leading-[1.1] tracking-[-1.5px]">
            Sistema de gestión
            <br />
            de <em className="not-italic text-[#c8e446]">cartas</em>
          </h1>
          <p className="text-base font-semibold text-white/55 leading-[1.65] max-w-[420px]">
            Plataforma para el envío y seguimiento de cartas entre becarios y sus padrinos.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <a href={payloadConfig.routes.admin} className={`${btnBase} bg-[#c8e446] text-[#0a3d38]`}>
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

          {!user && (
            <Link
              href="/register"
              className={`${btnBase} bg-white/[0.08] text-white/85 border border-white/15`}
            >
              <span>Registro de Becarios</span>
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </Link>
          )}

          <a
            href="https://www.fonbec.org.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnBase} bg-white/[0.08] text-white/85 border border-white/15`}
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
