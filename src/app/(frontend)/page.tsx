import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ExternalLink } from 'lucide-react'

// You can remove this import if you move the Nunito font import directly to your global layout or Next.js next/font
// import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="min-h-screen bg-[#0a3d38] font-['Nunito',system-ui,sans-serif] flex items-center justify-center relative overflow-hidden px-6 py-10">
      {/* Background Circles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full w-[500px] h-[500px] border-2 border-[#c8e446]/[0.08] -top-[120px] -right-[100px]" />
        <div className="absolute rounded-full w-[300px] h-[300px] bg-[#1a9e8e]/[0.15] -bottom-[60px] -left-[60px]" />
        <div className="absolute rounded-full w-[180px] h-[180px] border-2 border-[#c8e446]/[0.12] bottom-[80px] right-[10%]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[560px] flex flex-col gap-10">
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
            <span className="text-[28px] sm:text-[36px] font-black text-white leading-none tracking-[-1px]">
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
          <h1 className="text-[38px] sm:text-[52px] font-black text-white leading-[1.1] tracking-[-1.5px]">
            Sistema de gestión
            <br />
            de <em className="not-italic text-[#c8e446]">cartas</em>
          </h1>
          <p className="text-base font-semibold text-white/55 leading-[1.65] max-w-[420px]">
            Plataforma para el envío y seguimiento de cartas entre becarios y sus padrinos.
          </p>
        </div>

        {/* Actions / Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            asChild
            className="h-[52px] bg-[#c8e446] text-[#0a3d38] hover:bg-[#c8e446]/90 hover:-translate-y-[1px] font-extrabold px-6 rounded-[10px] text-[15px] transition-all"
          >
            <Link href={payloadConfig.routes.admin}>
              Ir al panel
              <ArrowRight className="ml-2 w-[18px] h-[18px] stroke-[2.5px]" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-[52px] bg-white/[0.08] text-white/85 border-white/[0.15] hover:bg-white/[0.12] hover:text-white hover:-translate-y-[1px] font-extrabold px-6 rounded-[10px] text-[15px] transition-all"
          >
            <a href="https://www.fonbec.org.ar/" target="_blank" rel="noopener noreferrer">
              Sitio web
              <ExternalLink className="ml-2 w-[18px] h-[18px] stroke-[2.5px]" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
