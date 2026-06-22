import { useState } from 'react'
import {
  Activity, Briefcase, GraduationCap,
  AlertTriangle, Radio, WifiOff, Route, ArrowRight,
  Lightbulb, Monitor, TrendingUp, X,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Indicador, Vertical, CoberturaItem, Flujo } from '../../types'
import type { DemograficoItem } from '../../api/client'

interface Props {
  vertical: Vertical
  indicadores: Indicador[]
  loading: boolean
  selectedCluster: string | null
  cobertura: CoberturaItem[]
  flujos?: Flujo[]
  demograficos?: DemograficoItem[]
  onVerticalChange: (v: Vertical) => void
  onVerMapa?: () => void
  onClearCluster?: () => void
  onClose?: () => void
  totalAntenas?: number
  clusters?: string[]
}

// ── Shared sub-components ────────────────────────────────────────────────────

function GlassCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: '#1b1f21',
        border: '1px solid rgba(255,255,255,0.07)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function ProgressBar({ pct, color, glow }: { pct: number; color: string; glow?: boolean }) {
  return (
    <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          boxShadow: glow ? `0 0 8px ${color}80` : undefined,
        }}
      />
    </div>
  )
}

// ── Activity Rings (CSS conic-gradient, no external lib) ─────────────────────

function ActivityRings({ outerPct, innerPct }: { outerPct: number; innerPct: number }) {
  const ringBase: CSSProperties = { position: 'absolute', borderRadius: '50%', transform: 'rotate(-90deg)' }
  return (
    <div style={{ width: 140, height: 140, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...ringBase, inset: 0, background: '#8aebff26', WebkitMask: 'radial-gradient(transparent 58%, black 60%)', mask: 'radial-gradient(transparent 58%, black 60%)' }} />
      <div style={{ ...ringBase, inset: 0, background: `conic-gradient(#8aebff ${outerPct}%, transparent ${outerPct}%)`, WebkitMask: 'radial-gradient(transparent 58%, black 60%)', mask: 'radial-gradient(transparent 58%, black 60%)', boxShadow: '0 0 12px rgba(138,235,255,0.35)' }} />
      <div style={{ ...ringBase, inset: '15%', background: '#ffb2b726', WebkitMask: 'radial-gradient(transparent 55%, black 58%)', mask: 'radial-gradient(transparent 55%, black 58%)' }} />
      <div style={{ ...ringBase, inset: '15%', background: `conic-gradient(#ffb2b7 ${innerPct}%, transparent ${innerPct}%)`, WebkitMask: 'radial-gradient(transparent 55%, black 58%)', mask: 'radial-gradient(transparent 55%, black 58%)', boxShadow: '0 0 12px rgba(255,178,183,0.35)' }} />
      <Activity size={22} strokeWidth={1.5} style={{ color: '#859397', position: 'relative', zIndex: 1 }} />
    </div>
  )
}

// ── SALUD MENTAL ─────────────────────────────────────────────────────────────

function SaludContent({ cobertura, indicadores, onVerMapa }: { cobertura: CoberturaItem[]; indicadores: Indicador[]; onVerMapa?: () => void }) {
  if (cobertura.length === 0) {
    if (!indicadores.length) return <EmptyState />
    return (
      <div className="flex flex-col gap-3 px-4 pb-4">
        <div
          className="rounded-2xl p-3 text-xs"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#fdba74' }}
        >
          Cobertura en tiempo real no disponible.
          Ejecuta <code style={{ color: '#fde047' }}>python etl/etl.py --mobilidade</code> para datos reales.
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#859397' }}>
          Indicadores de Exclusión Digital
        </p>
        {indicadores.slice(0, 5).map(ind => (
          <div key={ind.cluster} className="flex justify-between items-center text-xs gap-3">
            <span style={{ color: '#bbc9cd' }} className="truncate">{ind.cluster.replace(/_/g, ' ')}</span>
            <span className="font-mono shrink-0 font-semibold"
              style={{ color: ind.valor > 0.7 ? '#ef4444' : '#eab308' }}>
              {(ind.valor * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    )
  }

  const sorted   = [...cobertura].sort((a, b) => (b.pct_3g ?? 0) - (a.pct_3g ?? 0))
  const critico  = sorted[0]
  const pctAlert = Math.round((critico.pct_3g ?? 0) * 100)
  // % of clusters where more than 40% of sessions are on 3G = high digital exclusion risk
  const pctExcl  = Math.round(cobertura.filter(c => (c.pct_3g ?? 0) > 0.4).length / cobertura.length * 100)
  const avg5G    = cobertura.reduce((s, c) => s + (c.pct_5g ?? 0), 0) / cobertura.length
  const pct5G    = Math.round(avg5G * 100)

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {/* Alert card */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-2 transition-transform hover:scale-[1.01]"
        style={{ background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)' }}
      >
        <div className="flex items-center gap-2" style={{ color: '#ffb4ab' }}>
          <AlertTriangle size={16} strokeWidth={2} fill="rgba(255,180,171,0.2)" />
          <span className="text-sm font-semibold">Alerta Crítica</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: '#bbc9cd' }}>
          Clúster <strong style={{ color: '#e2e2e2' }}>{critico.cluster.replace(/_/g, ' ')}</strong>:{' '}
          {pctAlert}% de sesiones en 3G — sin soporte para telesalud.
        </p>
        <ProgressBar pct={pctAlert} color="#ffb4ab" glow />
      </div>

      {/* Activity Rings — Exclusión Digital + Cobertura 5G */}
      <GlassCard>
        <p className="text-xs font-semibold mb-4" style={{ color: '#e2e2e2' }}>Índices de Cobertura</p>
        <div className="flex items-center gap-5">
          <ActivityRings outerPct={pctExcl} innerPct={pct5G} />
          <div className="flex flex-col gap-3 flex-1">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#8aebff', boxShadow: '0 0 6px rgba(138,235,255,0.8)' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#8aebff' }}>Exclusión Digital</span>
              </div>
              <span className="text-xl font-bold ml-4" style={{ color: '#8aebff' }}>{pctExcl}%</span>
              <p className="text-[10px] ml-4 mt-0.5" style={{ color: '#3c494c' }}>clusters con &gt;40% sesiones 3G</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#ffb2b7', boxShadow: '0 0 6px rgba(255,178,183,0.8)' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#ffb2b7' }}>Cobertura 5G</span>
              </div>
              <span className="text-xl font-bold ml-4" style={{ color: '#ffb2b7' }}>{pct5G}%</span>
              <p className="text-[10px] ml-4 mt-0.5" style={{ color: '#3c494c' }}>promedio de sesiones</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Spatial impact */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-2">
          <Radio size={16} strokeWidth={1.5} style={{ color: '#2fd9f4' }} />
          <span className="text-sm font-semibold" style={{ color: '#e2e2e2' }}>Impacto Espacial</span>
        </div>
        <p className="text-xs leading-relaxed mb-4" style={{ color: '#859397' }}>
          La brecha digital en zonas con alta concentración de sesiones 3G correlaciona con episodios de crisis no atendidas por telesalud.
        </p>
        <button
          onClick={onVerMapa}
          className="w-full py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/20 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e2e2' }}
        >
          Ver Mapa de Calor
          <ArrowRight size={13} strokeWidth={2} />
        </button>
      </GlassCard>
    </div>
  )
}

// ── EMPLEABILIDAD ─────────────────────────────────────────────────────────────

function EmpleabilidadContent({
  indicadores,
  flujos = [],
  onVerMapa,
}: {
  indicadores: Indicador[]
  flujos: Flujo[]
  onVerMapa?: () => void
}) {
  const clustersUnicos = new Map<string, Indicador>()
  for (const ind of indicadores) {
    if (!clustersUnicos.has(ind.cluster)) clustersUnicos.set(ind.cluster, ind)
  }
  const clustersAfetados = clustersUnicos.size
  const sorted           = [...clustersUnicos.values()].sort((a, b) => b.valor - a.valor)
  const topCluster       = sorted[0]
  const metricaNombre    = (topCluster?.metrica ?? 'empleabilidade').replace(/_/g, ' ')

  // Flujos already arrive pre-filtered at ≥300 from the API — filter keeps only those with coordinates
  const topFlows = [...flujos]
    .filter(f => f.n_usuarios > 0 && f.origem?.lat && f.destino?.lat)
    .sort((a, b) => b.n_usuarios - a.n_usuarios)
    .slice(0, 3)
  const maxFlow = topFlows[0]?.n_usuarios ?? 1

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {/* Hero Impact card */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden flex flex-col gap-3 transition-transform hover:scale-[1.01]"
        style={{ background: '#1b1f21', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,180,171,0.15)' }} />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(255,180,171,0.15)' }}>
            <WifiOff size={18} strokeWidth={1.5} style={{ color: '#ffb4ab' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#e2e2e2' }}>Alerta de Impacto</span>
        </div>
        <div className="relative z-10">
          <div className="flex items-end gap-2">
            <div
              className="text-4xl font-bold tracking-tight leading-none"
              style={{ color: '#ffb4ab', fontVariantNumeric: 'tabular-nums' }}
            >
              {clustersAfetados}
            </div>
            <span className="text-sm font-semibold mb-0.5" style={{ color: '#859397' }}>clusters</span>
          </div>
          <p className="text-xs mt-1 flex items-center gap-1.5 flex-wrap" style={{ color: '#859397' }}>
            <span>con brecha de{' '}<em style={{ color: '#bbc9cd', fontStyle: 'normal' }}>{metricaNombre}</em></span>
            {topCluster?.es_sintetico && (
              <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0"
                style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>
                SINTÉTICO
              </span>
            )}
          </p>
          {topCluster && (
            <p
              className="text-[10px] mt-2 px-2.5 py-1 rounded-lg inline-block"
              style={{ background: 'rgba(255,180,171,0.1)', color: '#ffb4ab' }}
            >
              Más crítico: {topCluster.cluster.replace(/_/g, ' ')}{' '}
              ({topCluster.valor > 100
                ? Math.round(topCluster.valor).toLocaleString('pt-BR')
                : topCluster.valor.toFixed(3)})
            </p>
          )}
        </div>
        <button
          onClick={onVerMapa}
          className="relative z-10 w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/15 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e2e2' }}
        >
          Ver Zonas Afectadas
          <ArrowRight size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Corredores Críticos */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Route size={15} strokeWidth={1.5} style={{ color: '#2fd9f4' }} />
            <span className="text-sm font-semibold" style={{ color: '#e2e2e2' }}>Corredores Críticos</span>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#859397' }}
          >
            ≥ 300 usuarios
          </span>
        </div>

        {topFlows.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: '#3c494c' }}>Sin datos de flujo disponibles</p>
        ) : (
          <div className="flex flex-col gap-4">
            {topFlows.map((f, i) => {
              const pct    = Math.round((f.n_usuarios / maxFlow) * 100)
              const origin = (f.origem.cluster ?? `Origen ${i + 1}`).replace(/_/g, ' ')
              const dest   = (f.destino.cluster ?? `Destino ${i + 1}`).replace(/_/g, ' ')
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#859397' }}>Ruta {i + 1}</div>
                      <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#e2e2e2' }}>
                        <span className="truncate max-w-[80px]">{origin}</span>
                        <ArrowRight size={12} strokeWidth={1.5} style={{ color: '#2fd9f4', flexShrink: 0 }} />
                        <span className="truncate max-w-[80px]">{dest}</span>
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: '#3c494c' }}>
                        {f.n_usuarios.toLocaleString('pt-BR')} usuarios
                        {f.dist_km != null ? ` · ${f.dist_km.toFixed(1)} km` : ''}
                      </div>
                    </div>
                    <span
                      className="text-base font-bold ml-2 shrink-0"
                      style={{ color: pct > 85 ? '#ffd6a3' : '#2fd9f4' }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <ProgressBar pct={pct} color={pct > 85 ? '#ffd6a3' : '#2fd9f4'} glow />
                </div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

// ── FORMACIONES ───────────────────────────────────────────────────────────────

function FormacionesContent({ indicadores, cobertura, demograficos = [] }: { indicadores: Indicador[]; cobertura: CoberturaItem[]; demograficos?: DemograficoItem[] }) {
  const [alertState, setAlertState] = useState<'visible' | 'authorized' | 'ignored'>('visible')

  const sorted     = [...indicadores].sort((a, b) => b.valor - a.valor)
  const topCluster = sorted[0]
  const top2       = sorted.slice(0, 2).map(i => i.cluster.replace(/_/g, ' '))

  // Jóvenes 18-24 del endpoint /demograficos (datos reales si disponibles)
  const totalJovenes = demograficos.reduce((sum, d) => sum + (d.n_usuarios ?? 0), 0)

  // Brecha promedio calculada SOLO sobre clusters que tienen indicadores de formaciones
  const relevantClusters  = new Set(indicadores.map(i => i.cluster))
  const relevantCobertura = cobertura.filter(c => relevantClusters.has(c.cluster))
  const cobBase           = relevantCobertura.length > 0 ? relevantCobertura : cobertura

  const avgBrecha = cobBase.length > 0
    ? Math.round(cobBase.reduce((s, c) => s + (c.pct_3g ?? 0), 0) / cobBase.length * 100)
    : 0

  // Clusters con brecha real (pct_3g > 0.4) dentro del conjunto de formaciones
  const clustersConBrecha = cobBase.filter(c => (c.pct_3g ?? 0) > 0.4).length

  // Recomendación data-driven según severidad del cluster más crítico
  const topCob      = topCluster ? cobertura.find(c => c.cluster === topCluster.cluster) : null
  const isUrgente   = (topCob?.pct_3g ?? 0) > 0.5
  const recomendacao = isUrgente
    ? 'Recomendação: Desplegar aulas itinerantes de urgencia.'
    : 'Recomendação: Ampliar cobertura de banda larga nesta região.'

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {/* Infrastructure alert */}
      {alertState === 'visible' ? (
        <GlassCard style={{ border: '1px solid rgba(47,217,244,0.12)' }}>
          <div className="flex gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(47,217,244,0.1)', border: '1px solid rgba(47,217,244,0.2)' }}
            >
              <Lightbulb size={20} strokeWidth={1.5} style={{ color: '#2fd9f4' }} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold" style={{ color: '#8aebff' }}>Alerta de Infraestructura</span>
              <p className="text-xs leading-relaxed" style={{ color: '#859397' }}>
                Alta concentración en{' '}
                <strong style={{ color: '#e2e2e2' }}>{topCluster?.cluster.replace(/_/g, ' ') ?? '—'}</strong>{' '}
                sin acceso a banda ancha.{' '}
                <span style={{ color: '#2fd9f4' }}>{recomendacao}</span>
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setAlertState('authorized')}
                  className="px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{ background: '#2fd9f4', color: '#00363e' }}
                >
                  Autorizar
                </button>
                <button
                  onClick={() => setAlertState('ignored')}
                  className="px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:bg-white/20 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e2e2' }}
                >
                  Ignorar
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      ) : (
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
          style={{
            background: alertState === 'authorized' ? 'rgba(47,217,244,0.08)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span className="text-xs" style={{ color: alertState === 'authorized' ? '#2fd9f4' : '#3c494c' }}>
            {alertState === 'authorized' ? 'Alerta autorizada — en seguimiento' : 'Alerta descartada'}
          </span>
          <button
            onClick={() => setAlertState('visible')}
            className="text-[10px] underline shrink-0"
            style={{ color: '#3c494c' }}
          >
            Restaurar
          </button>
        </div>
      )}

      {/* Stats Bento 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Brecha conectividad — solo clusters de formaciones */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between aspect-square transition-colors hover:bg-white/10"
          style={{ background: '#252929', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <WifiOff size={22} strokeWidth={1.5} style={{ color: '#ffb13b' }} />
          <div>
            <div className="text-3xl font-bold tracking-tight" style={{ color: '#e2e2e2' }}>{avgBrecha}%</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: '#859397' }}>Brecha 3G</div>
            <div className="text-[9px] mt-0.5" style={{ color: '#3c494c' }}>prom. clusters analizados</div>
          </div>
        </div>

        {/* Clusters con brecha real (pct_3g > 0.4) */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between aspect-square transition-colors hover:bg-white/10"
          style={{ background: '#252929', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Monitor size={22} strokeWidth={1.5} style={{ color: '#ffb2b7' }} />
          <div>
            <div className="text-3xl font-bold tracking-tight" style={{ color: '#e2e2e2' }}>{clustersConBrecha}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: '#859397' }}>Clusters</div>
            <div className="text-[9px] mt-0.5" style={{ color: '#3c494c' }}>con 3G &gt; 40%</div>
          </div>
        </div>

        {/* Zonas prioritarias + jóvenes 18-24 — span-2 */}
        <div
          className="col-span-2 rounded-2xl p-4 relative overflow-hidden"
          style={{ background: '#1b1f21', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, rgba(47,217,244,0.08), transparent)' }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#2fd9f4' }}>
                Zonas Prioritarias
              </div>
              <div className="text-sm font-semibold truncate" style={{ color: '#e2e2e2' }}>
                {top2.length > 0 ? top2.join(' & ') : 'Sin datos'}
              </div>
              {totalJovenes > 0 && (
                <div className="text-[10px] mt-1" style={{ color: '#859397' }}>
                  {totalJovenes.toLocaleString('pt-BR')} jóvenes 18-24 sin conectividad
                </div>
              )}
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ml-3"
              style={{ border: '1px solid rgba(47,217,244,0.3)', background: 'rgba(12,15,15,0.5)' }}
            >
              <TrendingUp size={18} strokeWidth={1.5} style={{ color: '#2fd9f4' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Empty / Loading states ────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex items-center justify-center py-16 px-4">
      <p className="text-xs text-center" style={{ color: '#3c494c' }}>Sin datos — ejecuta el seed del backend primero</p>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="px-4 pb-4 flex flex-col gap-3 animate-pulse">
      <div className="h-24 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="h-40 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="h-28 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
  )
}

// ── Dataset header ────────────────────────────────────────────────────────────

function DatasetHeader({ onClose }: { totalAntenas: number; clusters: string[]; onClose?: () => void }) {
  return (
    <div className="px-4 pt-3 pb-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: '#2fd9f4' }}>
            App BiT 64
          </span>
          <span className="text-[10px]" style={{ color: '#3c494c' }}>
            B2G · Florianópolis
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(47,217,244,0.08)', color: '#859397', border: '1px solid rgba(47,217,244,0.15)' }}>
            Mar 2026
          </span>
          {onClose && (
            <button onClick={onClose} className="transition-opacity hover:opacity-60" style={{ color: '#3c494c' }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      <p className="text-[9px] mt-1" style={{ color: '#3f5258' }}>Vísent CDRView v2 · 16.8M eventos</p>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS: { id: Vertical; Icon: typeof Activity; label: string }[] = [
  { id: 'salud_mental',  Icon: Activity,      label: 'Salud' },
  { id: 'empleabilidad', Icon: Briefcase,     label: 'Empleo' },
  { id: 'formaciones',   Icon: GraduationCap, label: 'Formación' },
]

const VERTICAL_DESC: Record<Vertical, string> = {
  salud_mental:  'Exclusión digital y riesgo en zonas sin telesalud',
  empleabilidad: 'Brechas de movilidad laboral por cobertura móvil',
  formaciones:   'Acceso digital de jóvenes 18-24 en zonas críticas',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VerticalPanel({
  vertical, indicadores, loading, selectedCluster, cobertura,
  flujos = [], demograficos = [], onVerticalChange, onVerMapa, onClearCluster, onClose,
  totalAntenas = 0, clusters = [],
}: Props) {
  const clusterCob = selectedCluster ? cobertura.find(c => c.cluster === selectedCluster) : null
  const clusterInd = selectedCluster ? indicadores.find(i => i.cluster === selectedCluster) : null

  const VERTICAL_COLOR: Record<Vertical, string> = {
    salud_mental:  '#ef4444',
    empleabilidad: '#f59e0b',
    formaciones:   '#2fd9f4',
  }

  return (
    <div className="flex flex-col h-full" style={{ color: '#e2e2e2' }}>

      {/* Dataset header */}
      <DatasetHeader totalAntenas={totalAntenas} clusters={clusters} onClose={onClose} />

      {/* Tab bar — pill style */}
      <div className="flex gap-1 px-2 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(({ id, Icon, label }) => {
          const active = vertical === id
          return (
            <button
              key={id}
              onClick={() => onVerticalChange(id)}
              className="flex-1 flex flex-col items-center gap-1 py-2 text-xs font-semibold transition-all"
              style={{
                color:        active ? '#2fd9f4' : '#859397',
                background:   active ? 'rgba(47,217,244,0.10)' : 'transparent',
                borderRadius: 8,
              }}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Vertical description */}
      <div className="px-4 pt-3 pb-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <p className="text-[10px] leading-relaxed" style={{ color: '#4a5c62' }}>
          {VERTICAL_DESC[vertical]}
        </p>
      </div>

      {/* Vertical content */}
      <div className="flex-1 overflow-y-auto scrollbar-glass pt-4">
        {loading ? (
          <Skeleton />
        ) : vertical === 'salud_mental' ? (
          <SaludContent cobertura={cobertura} indicadores={indicadores} onVerMapa={onVerMapa} />
        ) : vertical === 'empleabilidad' ? (
          <EmpleabilidadContent indicadores={indicadores} flujos={flujos} onVerMapa={onVerMapa} />
        ) : (
          <FormacionesContent indicadores={indicadores} cobertura={cobertura} demograficos={demograficos} />
        )}
      </div>

      {/* Selected cluster detail */}
      {selectedCluster && (
        <div
          className="shrink-0 mx-3 mb-3 p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#2fd9f4' }}>
              Cluster seleccionado
            </p>
            {onClearCluster && (
              <button
                onClick={onClearCluster}
                className="transition-opacity hover:opacity-60"
                title="Deseleccionar cluster"
                style={{ color: '#3c494c' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <p className="text-sm font-semibold mb-3">{selectedCluster.replace(/_/g, ' ')}</p>

          {clusterInd && (
            <div className="mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex justify-between items-start text-xs gap-2">
                <span className="truncate" style={{ color: '#859397' }}>
                  {clusterInd.metrica.replace(/_/g, ' ')}
                </span>
                <span className="font-mono font-semibold shrink-0" style={{ color: VERTICAL_COLOR[vertical] }}>
                  {clusterInd.valor > 100
                    ? Math.round(clusterInd.valor).toLocaleString('pt-BR')
                    : clusterInd.valor.toFixed(3)}
                </span>
              </div>
              {clusterInd.es_sintetico && (
                <span className="text-[9px] mt-1 block" style={{ color: '#3c494c' }}>dato sintético</span>
              )}
            </div>
          )}

          {clusterCob && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#859397' }}>Red móvil</p>
              {[
                { label: '3G', value: clusterCob.pct_3g, color: '#ef4444' },
                { label: '4G', value: clusterCob.pct_4g, color: '#f59e0b' },
                { label: '5G', value: clusterCob.pct_5g, color: '#2fd9f4' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[11px] w-6 shrink-0 font-semibold" style={{ color }}>{label}</span>
                  <ProgressBar pct={(value ?? 0) * 100} color={color} />
                  <span className="text-[11px] font-mono w-10 text-right shrink-0" style={{ color }}>
                    {((value ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
              {clusterCob.download_gb != null && (
                <div className="flex justify-between text-xs pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#859397' }}>Download total</span>
                  <span className="font-mono font-semibold" style={{ color: '#2fd9f4' }}>
                    {clusterCob.download_gb.toFixed(1)} GB
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="shrink-0 px-4 py-2.5 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] tracking-wide" style={{ color: '#3c494c' }}>
          Vísent CDRView v2 · 16.8M eventos · Florianópolis
        </span>
      </div>
    </div>
  )
}
