import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Map, BarChart2, Bell, ArrowRight, Radio, Route, Bot } from 'lucide-react'
import { fetchCobertura, fetchFlujos, fetchVertical } from '../api/client'
import type { CoberturaItem, Flujo, Indicador } from '../types'
import { useAuth } from '../context/AuthContext'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`rounded-2xl p-5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: '#1b1f21',
        border: '1px solid rgba(255,255,255,0.07)',
        transition: 'border-color 180ms ease-out',
      }}
      onClick={onClick}
      onMouseEnter={onClick ? (e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)' } : undefined}
      onMouseLeave={onClick ? (e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)' } : undefined}
    >
      {children}
    </div>
  )
}

function StatPill({ val, label, color = '#2fd9f4' }: { val: string | number; label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-mono text-xl font-medium" style={{ color, letterSpacing: '-0.03em' }}>{val}</span>
      <span className="text-[9px] uppercase tracking-widest mt-1 font-medium" style={{ color: '#3f5258' }}>{label}</span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [cobertura,   setCobertura]   = useState<CoberturaItem[]>([])
  const [flujos,      setFlujos]      = useState<Flujo[]>([])
  const [indicadores, setIndicadores] = useState<Indicador[]>([])
  const [lastChat,    setLastChat]    = useState<{ query: string; respuesta: string } | null>(null)

  useEffect(() => {
    fetchCobertura().then(setCobertura).catch(() => {})
    fetchFlujos(200).then(setFlujos).catch(() => {})
    fetchVertical('salud_mental').then(setIndicadores).catch(() => {})
    // Restore last AI chat from localStorage
    try {
      const stored = localStorage.getItem('appbit64_chat_history')
      if (stored) {
        const history = JSON.parse(stored)
        const last = history[history.length - 1]
        if (last) setLastChat({ query: last.query, respuesta: last.resultado.respuesta_ia })
      }
    } catch {}
  }, [])

  // Derived data
  const criticalCluster = [...cobertura].sort((a, b) => (b.pct_3g ?? 0) - (a.pct_3g ?? 0))[0]
  const avgPct3g = cobertura.length ? cobertura.reduce((s, c) => s + (c.pct_3g ?? 0), 0) / cobertura.length : 0
  const avgPct4g = cobertura.length ? cobertura.reduce((s, c) => s + (c.pct_4g ?? 0), 0) / cobertura.length : 0
  const avgPct5g = cobertura.length ? cobertura.reduce((s, c) => s + (c.pct_5g ?? 0), 0) / cobertura.length : 0

  const pieData = [
    { name: '3G', value: Math.round(avgPct3g * 100), fill: '#ef4444' },
    { name: '4G', value: Math.round(avgPct4g * 100), fill: '#f59e0b' },
    { name: '5G', value: Math.round(avgPct5g * 100), fill: '#2fd9f4' },
  ]

  const topFlujos = [...flujos]
    .filter(f => f.origem?.lat && f.destino?.lat)
    .sort((a, b) => b.n_usuarios - a.n_usuarios)
    .slice(0, 3)

  const topIndicadores = [...indicadores].sort((a, b) => b.valor - a.valor).slice(0, 5)

  const mapUrl = MAPBOX_TOKEN
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-48.5489,-27.5954,9,0/600x300@2x?access_token=${MAPBOX_TOKEN}`
    : null

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  })()

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8" style={{ color: '#dde4e6' }}>

      {/* Header */}
      <div className="mb-7">
        <p className="mb-1" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3f5258' }}>
          {greeting}
        </p>
        <h1 className="text-xl font-semibold" style={{ letterSpacing: '-0.02em' }}>
          {user?.name?.split(' ')[0] ?? 'Gestor'}
          <span style={{ color: '#3f5258', fontWeight: 400 }}> — Panel B2G · Florianópolis</span>
        </h1>
      </div>

      {/* Stats strip — dividers, no card */}
      <div
        className="grid grid-cols-4 mb-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 0' }}
      >
        <StatPill val={cobertura.length || 23}  label="clusters"  />
        <StatPill val={`${Math.round(avgPct3g * 100)}%`} label="en 3G" color="#ef4444" />
        <StatPill val={flujos.length || '17k+'}  label="flujos OD" color="#f59e0b" />
        <StatPill val={topIndicadores.length || 69} label="indicadores" color="#2fd9f4" />
      </div>

      {/* Bento grid */}
      <div className="flex flex-col gap-4">

        {/* Fila 1 — mapa ancho completo con alerta como overlay */}
        <div
          className="relative cursor-pointer rounded-2xl overflow-hidden"
          style={{ background: '#1b1f21', border: '1px solid rgba(255,255,255,0.07)', transition: 'border-color 180ms ease-out' }}
          onClick={() => navigate('/mapa')}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
        >
          {mapUrl ? (
            <>
              <img
                src={mapUrl} alt="Mapa de Florianópolis"
                className="w-full object-cover"
                style={{ height: 220, filter: 'brightness(0.75)' }}
              />
              <div
                className="absolute inset-0 flex items-end p-5"
                style={{ background: 'linear-gradient(to top, rgba(12,15,15,0.75), transparent 60%)' }}
              >
                <div className="flex items-center gap-2">
                  <Map size={14} style={{ color: '#2fd9f4' }} />
                  <span className="text-xs font-semibold" style={{ color: '#dde4e6' }}>
                    Ver mapa interactivo →
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-56 flex items-center justify-center" style={{ background: 'rgba(47,217,244,0.04)' }}>
              <div className="text-center">
                <Radio size={32} strokeWidth={1} style={{ color: '#2fd9f4', margin: '0 auto 8px' }} />
                <p className="text-xs" style={{ color: '#7a8c91' }}>Florianópolis, SC</p>
                <p className="text-[10px] mt-1" style={{ color: '#3f5258' }}>Click para abrir mapa interactivo</p>
              </div>
            </div>
          )}

          {/* Alerta crítica — pill flotante sobre el mapa */}
          {criticalCluster && (
            <div
              className="absolute top-4 right-4 rounded-xl px-4 py-3 cursor-pointer"
              style={{ background: 'rgba(14,16,18,0.92)', border: '1px solid rgba(239,68,68,0.3)', backdropFilter: 'blur(12px)' }}
              onClick={e => { e.stopPropagation(); navigate('/alertas') }}
            >
              <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#ef4444' }}>
                Alerta Crítica
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: '#ef4444', letterSpacing: '-0.04em' }}>
                {Math.round((criticalCluster.pct_3g ?? 0) * 100)}%
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: '#7a8c91' }}>
                {criticalCluster.cluster.replace(/_/g, ' ')} · 3G
              </div>
            </div>
          )}
        </div>

        {/* Fila 2 — asimétrica: 2/5 izquierda + 3/5 derecha */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          {/* Columna izquierda 2/5 — Red Móvil + Flujos */}
          <div className="md:col-span-2 flex flex-col gap-4">

            <Card onClick={() => navigate('/analytics')}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#7a8c91' }}>
                Red Móvil
              </p>
              {cobertura.length > 0 ? (
                <>
                  <div style={{ height: 110 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={30} outerRadius={48} dataKey="value" strokeWidth={0}>
                          {pieData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: 'rgba(12,15,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                          formatter={(v) => [`${v ?? 0}%`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around mt-1">
                    {pieData.map(d => (
                      <div key={d.name} className="text-center">
                        <div className="text-sm font-bold font-mono" style={{ color: d.fill }}>{d.value}%</div>
                        <div className="text-[9px]" style={{ color: '#3f5258' }}>{d.name}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-28 flex items-center justify-center">
                  <p className="text-xs" style={{ color: '#3f5258' }}>Cargando…</p>
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Route size={13} style={{ color: '#f59e0b' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#7a8c91' }}>
                  Flujos Críticos
                </span>
              </div>
              {topFlujos.length > 0 ? (
                <div className="space-y-3">
                  {topFlujos.map((f, i) => {
                    const orig = (f.origem.cluster ?? `Origen ${i+1}`).replace(/_/g, ' ')
                    const dest = (f.destino.cluster ?? `Destino ${i+1}`).replace(/_/g, ' ')
                    return (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] min-w-0" style={{ color: '#a8b8bd' }}>
                          <span className="truncate max-w-[60px]">{orig}</span>
                          <ArrowRight size={9} style={{ color: '#2fd9f4', flexShrink: 0 }} />
                          <span className="truncate max-w-[60px]">{dest}</span>
                        </div>
                        <span className="text-[11px] font-mono shrink-0 font-semibold" style={{ color: '#f59e0b' }}>
                          {f.n_usuarios.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs" style={{ color: '#3f5258' }}>Sin flujos disponibles</p>
              )}
            </Card>

          </div>

          {/* Columna derecha 3/5 — Indicadores + Última consulta IA */}
          <div className="md:col-span-3 flex flex-col gap-4">

            <Card onClick={() => navigate('/analytics')}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={13} style={{ color: '#2fd9f4' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#7a8c91' }}>
                  Indicadores — Salud Mental
                </span>
              </div>
              {topIndicadores.length > 0 ? (
                <div className="space-y-2">
                  {topIndicadores.map(ind => (
                    <div key={ind.cluster} className="flex justify-between items-center gap-2">
                      <span className="text-[11px] truncate" style={{ color: '#a8b8bd' }}>
                        {ind.cluster.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] font-mono font-semibold shrink-0"
                        style={{ color: ind.valor > 0.7 ? '#ef4444' : '#eab308' }}>
                        {(ind.valor * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: '#3f5258' }}>Sin datos</p>
              )}
            </Card>

            <Card onClick={() => navigate('/mapa')}>
              <div className="flex items-center gap-2 mb-3">
                <Bot size={13} style={{ color: '#2fd9f4' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#7a8c91' }}>
                  Última Consulta IA
                </span>
              </div>
              {lastChat ? (
                <>
                  <div
                    className="rounded-xl px-3 py-2 mb-2 text-[11px]"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#7a8c91' }}
                  >
                    "{lastChat.query}"
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#a8b8bd' }}>
                    {lastChat.respuesta.slice(0, 140)}{lastChat.respuesta.length > 140 ? '…' : ''}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-[11px]" style={{ color: '#2fd9f4' }}>
                    Nueva consulta en el mapa <ArrowRight size={11} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 items-center py-4 text-center">
                  <Bot size={26} strokeWidth={1} style={{ color: '#2fd9f4', opacity: 0.4 }} />
                  <p className="text-xs" style={{ color: '#3f5258' }}>
                    Haz una consulta en el mapa para verla aquí.
                  </p>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: '#2fd9f4' }}>
                    Ir al mapa <ArrowRight size={11} />
                  </div>
                </div>
              )}
            </Card>

          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mt-6">
        {[
          { label: 'Ver Mapa',      to: '/mapa',      Icon: Map       },
          { label: 'Analytics',     to: '/analytics', Icon: BarChart2 },
          { label: 'Ver Alertas',   to: '/alertas',   Icon: Bell      },
        ].map(({ label, to, Icon }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            style={{ background: 'rgba(47,217,244,0.08)', border: '1px solid rgba(47,217,244,0.2)', color: '#2fd9f4' }}
          >
            <Icon size={13} />
            {label}
            <ArrowRight size={11} />
          </button>
        ))}
      </div>
    </div>
  )
}
