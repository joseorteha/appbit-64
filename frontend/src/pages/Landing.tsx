import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Activity, Briefcase, GraduationCap, ArrowRight } from 'lucide-react'
import GoogleLoginButton from '../components/Auth/GoogleLoginButton'
import { useAuth } from '../context/AuthContext'

const HAS_GOOGLE = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)

const STATS = [
  { val: '132',   label: 'antenas monitoreadas' },
  { val: '16.8M', label: 'eventos CDR analizados' },
  { val: '3',     label: 'verticales de impacto social' },
]

const FEATURES = [
  {
    Icon: Activity, color: '#ef4444',
    title: 'Salud Mental',
    desc: 'Detecta zonas sin acceso a telesalud por alta concentración de sesiones en redes 2G/3G.',
    kpi: 'Índice de exclusión digital por cluster',
  },
  {
    Icon: Briefcase, color: '#f59e0b',
    title: 'Empleabilidad',
    desc: 'Brechas de movilidad laboral basadas en flujos OD entre clusters con corredores críticos.',
    kpi: 'Corredores con ≥ 300 usuarios diarios',
  },
  {
    Icon: GraduationCap, color: '#2fd9f4',
    title: 'Formaciones',
    desc: 'Jóvenes 18–24 en zonas con brecha digital sin acceso adecuado a educación online.',
    kpi: 'Población joven sin conectividad 4G/5G',
  },
]

export default function Landing() {
  const { user, devLogin } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to="/dashboard" replace />

  function handleDevLogin() {
    devLogin()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e1012', color: '#dde4e6' }}>

      {/* Faint grid — sutil, no dominante */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(47,217,244,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(47,217,244,0.025) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
            <rect x="0" y="12" width="6" height="8" rx="1.5" fill="#ef4444" />
            <rect x="9" y="6"  width="6" height="14" rx="1.5" fill="#f59e0b" />
            <rect x="18" y="0" width="6" height="20" rx="1.5" fill="#2fd9f4" />
          </svg>
          <span className="text-sm font-semibold tracking-tight" style={{ color: '#dde4e6' }}>
            App BiT <span style={{ color: '#2fd9f4', fontWeight: 400 }}>64</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs hidden md:block" style={{ color: '#3f5258' }}>
            Hackathon No Country · Equipo 64
          </span>
          {!HAS_GOOGLE && (
            <button onClick={handleDevLogin}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:opacity-80"
              style={{ background: '#1b1f21', border: '1px solid rgba(255,255,255,0.1)', color: '#7a8c91' }}>
              Modo demo →
            </button>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex-1 px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-5xl mx-auto md:grid md:grid-cols-5 md:gap-12 md:items-center">

          {/* Left — contenido editorial (3/5) */}
          <div className="md:col-span-3 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: '#1b1f21', border: '1px solid rgba(255,255,255,0.08)', color: '#7a8c91' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
              Panel B2G — Florianópolis, SC · Brasil
            </div>

            <h1 className="font-bold leading-none mb-5"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em', color: '#dde4e6' }}>
              Decisiones públicas<br />
              basadas en <span style={{ color: '#2fd9f4' }}>evidencia real</span>.
            </h1>

            <p className="text-sm mb-8 leading-relaxed max-w-md" style={{ color: '#7a8c91' }}>
              Cruzamos datos de movilidad CDR con indicadores sociales para identificar
              zonas de exclusión digital antes de lanzar programas municipales.
            </p>

            <div className="flex flex-col items-start gap-3">
              {HAS_GOOGLE ? (
                <GoogleLoginButton onError={setError} size="lg" />
              ) : (
                <button onClick={handleDevLogin}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: '#2fd9f4', color: '#003640' }}>
                  Entrar en modo demo
                  <ArrowRight size={14} />
                </button>
              )}
              {error && <p className="text-xs" style={{ color: '#fca5a5' }}>{error}</p>}
              <p className="text-xs" style={{ color: '#3f5258' }}>
                {HAS_GOOGLE ? 'Solo para gestores autorizados del programa App BiT' : 'Configura VITE_GOOGLE_CLIENT_ID para login real'}
              </p>
            </div>
          </div>

          {/* Right — visual abstracto de red/clusters (2/5) */}
          <div className="hidden md:flex md:col-span-2 items-center justify-center">
            <svg viewBox="0 0 280 260" fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', maxWidth: 280, opacity: 0.85 }}>
              {/* Conexiones */}
              <line x1="140" y1="130" x2="60" y2="60"   stroke="#2fd9f4" strokeWidth="0.8" strokeOpacity="0.25"/>
              <line x1="140" y1="130" x2="220" y2="70"  stroke="#2fd9f4" strokeWidth="0.8" strokeOpacity="0.25"/>
              <line x1="140" y1="130" x2="80" y2="200"  stroke="#2fd9f4" strokeWidth="0.8" strokeOpacity="0.25"/>
              <line x1="140" y1="130" x2="210" y2="195" stroke="#2fd9f4" strokeWidth="0.8" strokeOpacity="0.25"/>
              <line x1="60"  y1="60"  x2="220" y2="70"  stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
              <line x1="80"  y1="200" x2="210" y2="195" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
              <line x1="60"  y1="60"  x2="80"  y2="200" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
              {/* Nodo central — crítico */}
              <circle cx="140" cy="130" r="18" fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth="1.5"/>
              <circle cx="140" cy="130" r="6"  fill="#ef4444" fillOpacity="0.8"/>
              {/* Cluster NW */}
              <circle cx="60"  cy="60"  r="12" fill="rgba(47,217,244,0.08)" stroke="#2fd9f4" strokeWidth="1"/>
              <circle cx="60"  cy="60"  r="4"  fill="#2fd9f4" fillOpacity="0.6"/>
              {/* Cluster NE */}
              <circle cx="220" cy="70"  r="10" fill="rgba(34,197,94,0.08)"  stroke="#22c55e" strokeWidth="1"/>
              <circle cx="220" cy="70"  r="3.5" fill="#22c55e" fillOpacity="0.6"/>
              {/* Cluster SW */}
              <circle cx="80"  cy="200" r="11" fill="rgba(245,158,11,0.08)" stroke="#f59e0b" strokeWidth="1"/>
              <circle cx="80"  cy="200" r="4"  fill="#f59e0b" fillOpacity="0.6"/>
              {/* Cluster SE */}
              <circle cx="210" cy="195" r="9"  fill="rgba(34,197,94,0.08)"  stroke="#22c55e" strokeWidth="1"/>
              <circle cx="210" cy="195" r="3"  fill="#22c55e" fillOpacity="0.6"/>
              {/* Labels */}
              <text x="140" y="158" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace" opacity="0.7">68% 3G</text>
              <text x="60"  y="46"  textAnchor="middle" fill="#2fd9f4" fontSize="7" fontFamily="monospace" opacity="0.6">cluster_07</text>
              <text x="220" y="56"  textAnchor="middle" fill="#22c55e" fontSize="7" fontFamily="monospace" opacity="0.6">cluster_12</text>
              {/* Glow fondo */}
              <circle cx="140" cy="130" r="60" fill="radial-gradient(circle, rgba(239,68,68,0.03) 0%, transparent 70%)" fillOpacity="0.03"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── Stats — línea horizontal, no cards ── */}
      <section className="relative z-10 px-6 md:px-12 pb-16">
        <div className="max-w-3xl mx-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
          <div className="grid grid-cols-3 gap-6 text-center">
            {STATS.map(({ val, label }) => (
              <div key={label}>
                <div className="font-mono text-xl font-medium mb-1" style={{ color: '#dde4e6', letterSpacing: '-0.03em' }}>{val}</div>
                <div className="text-xs" style={{ color: '#3f5258' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features — sin tarjetas, lista editorial ── */}
      <section className="relative z-10 px-6 md:px-12 pb-20">
        <div className="max-w-3xl mx-auto space-y-0">
          {FEATURES.map(({ Icon, color, title, desc, kpi }, i) => (
            <div key={title}
              className="flex items-start gap-5 py-7"
              style={{ borderTop: i === 0 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.04)' }}>
              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={16} strokeWidth={1.5} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: '#dde4e6' }}>{title}</span>
                  <span className="text-xs" style={{ color: '#3f5258' }}>{kpi}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#7a8c91' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-6 md:px-12 py-5 flex items-center justify-between flex-wrap gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-xs" style={{ color: '#3f5258' }}>No Country · App BiT 2026 · S06-26-AB-64</span>
        <span className="text-xs" style={{ color: '#3f5258' }}>Dataset Vísent CDRView — Florianópolis</span>
      </footer>
    </div>
  )
}
