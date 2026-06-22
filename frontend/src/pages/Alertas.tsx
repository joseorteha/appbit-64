import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Map, Circle, AlertTriangle, Download, Filter } from 'lucide-react'
import { fetchCobertura } from '../api/client'
import type { CoberturaItem } from '../types'

type Severity = 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO'
type AlertStatus = 'Activa' | 'Revisada' | 'Resuelta'

interface Alert {
  id: string
  cluster: string
  severity: Severity
  title: string
  metric: string
  value: number
  valueLabel: string
  status: AlertStatus
}

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
  CRÍTICO: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', icon: AlertTriangle },
  ALTO:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',  icon: AlertTriangle },
  MEDIO:   { color: '#eab308', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.18)',  icon: AlertTriangle },
  BAJO:    { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.18)', icon: Circle },
}

const STATUS_ORDER: AlertStatus[] = ['Activa', 'Revisada', 'Resuelta']
const SEVERITY_ORDER: Severity[] = ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO']
const STORAGE_KEY = 'appbit64_alert_states'

function deriveAlerts(cobertura: CoberturaItem[]): Alert[] {
  const alerts: Alert[] = []

  for (const c of cobertura) {
    const pct3g = c.pct_3g ?? 0
    const cong  = c.congestionamento_medio ?? 0
    const drop  = c.drop_pct_medio ?? 0

    if (pct3g > 0.6) {
      alerts.push({
        id: `${c.cluster}_3g_critico`,
        cluster: c.cluster,
        severity: 'CRÍTICO',
        title: 'Sin soporte telesalud',
        metric: 'pct_3g',
        value: pct3g,
        valueLabel: `${(pct3g * 100).toFixed(1)}% en 3G`,
        status: 'Activa',
      })
    } else if (pct3g > 0.4) {
      alerts.push({
        id: `${c.cluster}_3g_alto`,
        cluster: c.cluster,
        severity: 'ALTO',
        title: 'Brecha de conectividad',
        metric: 'pct_3g',
        value: pct3g,
        valueLabel: `${(pct3g * 100).toFixed(1)}% en 3G`,
        status: 'Activa',
      })
    }

    if (cong > 0.6) {
      alerts.push({
        id: `${c.cluster}_cong_medio`,
        cluster: c.cluster,
        severity: 'MEDIO',
        title: 'Red congestionada',
        metric: 'congestionamento_medio',
        value: cong,
        valueLabel: `${(cong * 100).toFixed(1)}% congestión`,
        status: 'Activa',
      })
    }

    if (drop > 0.05) {
      alerts.push({
        id: `${c.cluster}_drop_bajo`,
        cluster: c.cluster,
        severity: 'BAJO',
        title: 'Tasa de caída elevada',
        metric: 'drop_pct_medio',
        value: drop,
        valueLabel: `${(drop * 100).toFixed(1)}% drops`,
        status: 'Activa',
      })
    }
  }

  return alerts.sort((a, b) =>
    SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  )
}

function exportCSV(alerts: Alert[]) {
  const header = 'cluster,severity,title,metric,value,status'
  const body   = alerts.map(a =>
    `"${a.cluster}","${a.severity}","${a.title}","${a.metric}",${a.value},"${a.status}"`
  ).join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `alertas_appbit64_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function Alertas() {
  const navigate  = useNavigate()
  const [cobertura, setCobertura]         = useState<CoberturaItem[]>([])
  const [loading,   setLoading]           = useState(true)
  const [statuses,  setStatuses]          = useState<Record<string, AlertStatus>>({})
  const [filterSev, setFilterSev]         = useState<Severity | 'TODAS'>('TODAS')
  const [filterCluster, setFilterCluster] = useState('')

  useEffect(() => {
    fetchCobertura()
      .then(setCobertura)
      .catch(() => {})
      .finally(() => setLoading(false))
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setStatuses(JSON.parse(saved))
    } catch {}
  }, [])

  const baseAlerts = useMemo(() => deriveAlerts(cobertura), [cobertura])

  const alerts = useMemo(() =>
    baseAlerts
      .map(a => ({ ...a, status: statuses[a.id] ?? a.status }))
      .filter(a => filterSev === 'TODAS' || a.severity === filterSev)
      .filter(a => !filterCluster || a.cluster.toLowerCase().includes(filterCluster.toLowerCase())),
    [baseAlerts, statuses, filterSev, filterCluster]
  )

  function cycleStatus(id: string) {
    setStatuses(prev => {
      const cur = prev[id] ?? 'Activa'
      const next = STATUS_ORDER[(STATUS_ORDER.indexOf(cur) + 1) % STATUS_ORDER.length]
      const updated = { ...prev, [id]: next }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  const counts = useMemo(() =>
    SEVERITY_ORDER.reduce((acc, s) => ({
      ...acc,
      [s]: baseAlerts.filter(a => (statuses[a.id] ?? a.status) !== 'Resuelta' && a.severity === s).length,
    }), {} as Record<Severity, number>),
    [baseAlerts, statuses]
  )

  const statusColor: Record<AlertStatus, string> = {
    Activa:   '#ef4444',
    Revisada: '#f59e0b',
    Resuelta: '#22c55e',
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-6 md:px-8 animate-pulse">
        <div className="h-6 w-24 rounded mb-6" style={{ background: '#1b1f21' }} />
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 rounded-xl" style={{ background: '#1b1f21' }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 rounded-xl mb-2" style={{ background: '#1b1f21' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8" style={{ color: '#dde4e6' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Bell size={20} style={{ color: '#2fd9f4' }} />
          <h1 className="text-xl font-bold">Alertas</h1>
        </div>
        <button
          onClick={() => exportCSV(alerts)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
          style={{ background: 'rgba(47,217,244,0.08)', border: '1px solid rgba(47,217,244,0.2)', color: '#2fd9f4' }}
        >
          <Download size={12} />
          Exportar CSV
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {SEVERITY_ORDER.map(s => {
          const cfg = SEVERITY_CONFIG[s]
          return (
            <button
              key={s}
              onClick={() => setFilterSev(f => f === s ? 'TODAS' : s)}
              className="rounded-xl py-3 text-center transition-all hover:scale-[1.02]"
              style={{
                background: filterSev === s ? cfg.bg : '#1b1f21',
                border: `1px solid ${filterSev === s ? cfg.border : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <div className="text-xl font-bold" style={{ color: cfg.color }}>{counts[s]}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: cfg.color }}>
                {s}
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="flex items-center gap-1.5">
          <Filter size={12} style={{ color: '#7a8c91' }} />
          <span className="text-xs" style={{ color: '#7a8c91' }}>Filtros:</span>
        </div>
        <input
          type="text"
          value={filterCluster}
          onChange={e => setFilterCluster(e.target.value)}
          placeholder="Buscar cluster…"
          className="rounded-full px-3 py-1 text-xs"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#dde4e6',
            outline: 'none',
            minWidth: 160,
          }}
        />
        {filterSev !== 'TODAS' && (
          <button
            onClick={() => setFilterSev('TODAS')}
            className="text-xs px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#7a8c91', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            × Limpiar filtro
          </button>
        )}
        <span className="text-xs ml-auto" style={{ color: '#3f5258' }}>
          {alerts.length} alertas · click en estado para cambiar
        </span>
      </div>

      {/* Alerts list */}
      <div className="flex flex-col gap-2">
        {alerts.length === 0 && (
          <div className="text-center py-20 rounded-2xl"
            style={{ background: '#1b1f21', border: '1px solid rgba(255,255,255,0.07)' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 16px' }}>
              <circle cx="24" cy="24" r="23" stroke="rgba(34,197,94,0.2)" strokeWidth="1.5" />
              <path d="M16 24l6 6 10-12" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm font-semibold mb-2" style={{ color: '#dde4e6' }}>Sin alertas activas</p>
            <p className="text-xs" style={{ color: '#7a8c91', maxWidth: 260, margin: '0 auto' }}>
              {filterSev !== 'TODAS' || filterCluster
                ? 'Ninguna alerta coincide con los filtros seleccionados.'
                : 'Todos los clusters están dentro de umbrales normales.'}
            </p>
            {(filterSev !== 'TODAS' || filterCluster) && (
              <button
                onClick={() => { setFilterSev('TODAS'); setFilterCluster('') }}
                className="mt-4 text-xs px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#7a8c91', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
        {alerts.map(alert => {
          const cfg    = SEVERITY_CONFIG[alert.severity]
          const status = statuses[alert.id] ?? alert.status
          return (
            <div
              key={alert.id}
              className="rounded-xl p-4 flex items-center gap-4 transition-all hover:brightness-110"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              {/* Severity badge */}
              <div className="shrink-0">
                <span
                  className="text-[9px] font-bold px-2 py-1 rounded-full"
                  style={{ background: cfg.color + '22', color: cfg.color, letterSpacing: '0.05em' }}
                >
                  {alert.severity}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold" style={{ color: '#dde4e6' }}>{alert.title}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[11px]" style={{ color: '#7a8c91' }}>
                    {alert.cluster.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] font-mono font-semibold" style={{ color: cfg.color }}>
                    {alert.valueLabel}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/mapa?cluster=${encodeURIComponent(alert.cluster)}`)}
                  className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full transition-all hover:scale-105"
                  style={{ background: 'rgba(47,217,244,0.08)', color: '#2fd9f4', border: '1px solid rgba(47,217,244,0.2)' }}
                >
                  <Map size={10} />
                  Ver mapa
                </button>
                <button
                  onClick={() => cycleStatus(alert.id)}
                  className="text-[10px] px-2.5 py-1 rounded-full transition-all hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: statusColor[status],
                    border: `1px solid ${statusColor[status]}44`,
                  }}
                >
                  {status}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info note */}
      <p className="text-[10px] text-center mt-6" style={{ color: '#3f5258' }}>
        Los estados (Activa / Revisada / Resuelta) se guardan localmente en este navegador.
        Reglas: pct_3g &gt; 60% → CRÍTICO · 40–60% → ALTO · congestión &gt; 60% → MEDIO · drops &gt; 5% → BAJO
      </p>
    </div>
  )
}
