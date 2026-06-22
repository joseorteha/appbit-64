import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'
import { BarChart2, ChevronUp, ChevronDown, Map } from 'lucide-react'
import { fetchCobertura, fetchFlujos, fetchConcentracion } from '../api/client'
import type { CoberturaItem, Flujo, ConcentracionItem } from '../types'

type SortDir = 'asc' | 'desc'
type SortCol = keyof CoberturaItem

const COLORS = { primary: '#2fd9f4', secondary: '#ffb2b7', warn: '#f59e0b', danger: '#ef4444' }

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(12,15,15,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    fontSize: 11,
    color: '#dde4e6',
  },
}

function GlassCard({ children, title, className = '' }: { children: React.ReactNode; title: string; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
      style={{ background: '#1b1f21', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: '#7a8c91' }}>{title}</p>
      {children}
    </div>
  )
}

function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: '#1b1f21', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="h-2.5 w-24 rounded mb-4" style={{ background: 'rgba(255,255,255,0.07)' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 rounded mb-2" style={{ background: 'rgba(255,255,255,0.05)', width: `${60 + i * 12}%` }} />
      ))}
    </div>
  )
}

export default function Analytics() {
  const navigate = useNavigate()
  const [cobertura,   setCobertura]   = useState<CoberturaItem[]>([])
  const [flujos,      setFlujos]      = useState<Flujo[]>([])
  const [concentracion, setConcentracion] = useState<{ periodo: string; avg: number }[]>([])
  const [sortCol,     setSortCol]     = useState<SortCol>('pct_3g')
  const [sortDir,     setSortDir]     = useState<SortDir>('desc')
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      fetchCobertura(),
      fetchFlujos(50),
    ]).then(([cob, fl]) => {
      setCobertura(cob)
      setFlujos(fl)
    }).catch(console.error)

    // Fetch concentracion for all 4 periods
    Promise.all(['MADRUGADA', 'MANHA', 'TARDE', 'NOITE'].map(p =>
      fetchConcentracion(p).then((data: ConcentracionItem[]) => {
        const avg = data.length ? data.reduce((s, c) => s + (c.n_usuarios ?? 0), 0) / data.length : 0
        return { periodo: p === 'MANHA' ? 'Manhã' : p === 'MADRUGADA' ? 'Madrugada' : p === 'TARDE' ? 'Tarde' : 'Noite', avg: Math.round(avg) }
      })
    )).then(setConcentracion).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Pie chart data
  const avgPct3g = cobertura.length ? cobertura.reduce((s, c) => s + (c.pct_3g ?? 0), 0) / cobertura.length : 0
  const avgPct4g = cobertura.length ? cobertura.reduce((s, c) => s + (c.pct_4g ?? 0), 0) / cobertura.length : 0
  const avgPct5g = cobertura.length ? cobertura.reduce((s, c) => s + (c.pct_5g ?? 0), 0) / cobertura.length : 0
  const pieData  = [
    { name: '3G', value: Math.round(avgPct3g * 100), fill: COLORS.danger   },
    { name: '4G', value: Math.round(avgPct4g * 100), fill: COLORS.warn     },
    { name: '5G', value: Math.round(avgPct5g * 100), fill: COLORS.primary  },
  ]

  // Bar chart: exclusion by cluster
  const exclusionData = [...cobertura]
    .sort((a, b) => (b.pct_3g ?? 0) - (a.pct_3g ?? 0))
    .slice(0, 20)
    .map(c => ({
      cluster: c.cluster.replace(/_/g, ' ').replace('cluster ', '').slice(0, 14),
      pct_3g:  Math.round((c.pct_3g ?? 0) * 100),
      pct_5g:  Math.round((c.pct_5g ?? 0) * 100),
    }))

  // Top flujos
  const topFlujos = [...flujos]
    .filter(f => f.origem?.lat && f.destino?.lat)
    .sort((a, b) => b.n_usuarios - a.n_usuarios)
    .slice(0, 10)
    .map(f => ({
      label: `${(f.origem.cluster ?? '?').replace(/_/g, ' ').slice(0, 10)} → ${(f.destino.cluster ?? '?').replace(/_/g, ' ').slice(0, 10)}`,
      n_usuarios: f.n_usuarios,
    }))

  // Table
  function toggleSort(col: SortCol) {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const sortedTable = [...cobertura].sort((a, b) => {
    const va = (a[sortCol] ?? 0) as number
    const vb = (b[sortCol] ?? 0) as number
    return sortDir === 'desc' ? vb - va : va - vb
  })

  const SortIcon = ({ col }: { col: SortCol }) => col !== sortCol ? null :
    sortDir === 'desc' ? <ChevronDown size={12} style={{ display: 'inline' }} /> : <ChevronUp size={12} style={{ display: 'inline' }} />

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-6 md:px-8">
        <div className="h-6 w-32 rounded mb-6 animate-pulse" style={{ background: '#1b1f21' }} />
        <div className="grid grid-cols-3 gap-0 mb-6 animate-pulse"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 0' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-8 w-16 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <div className="h-2 w-28 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <SkeletonCard rows={6} />
          <SkeletonCard rows={4} />
          <SkeletonCard rows={4} />
          <SkeletonCard rows={4} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8" style={{ color: '#dde4e6' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart2 size={20} style={{ color: '#2fd9f4' }} />
          <h1 className="text-xl font-bold">Analytics</h1>
        </div>
        <button
          onClick={() => navigate('/mapa')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
          style={{ background: 'rgba(47,217,244,0.08)', border: '1px solid rgba(47,217,244,0.2)', color: '#2fd9f4' }}
        >
          <Map size={12} />
          Ver en Mapa
        </button>
      </div>

      {/* KPI strip */}
      {cobertura.length > 0 && (
        <div className="grid grid-cols-3 mb-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 0' }}>
          <div className="text-center">
            <div className="text-3xl font-bold font-mono" style={{ color: '#ef4444', letterSpacing: '-0.04em' }}>
              {cobertura.filter(c => (c.pct_3g ?? 0) > 0.6).length}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: '#3f5258' }}>
              Clusters en exclusión crítica
            </div>
          </div>
          <div className="text-center"
            style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-3xl font-bold font-mono" style={{ color: '#f59e0b', letterSpacing: '-0.04em' }}>
              {Math.round(avgPct3g * 100)}%
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: '#3f5258' }}>
              Promedio 3G · todos los clusters
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold font-mono" style={{ color: '#2fd9f4', letterSpacing: '-0.04em' }}>
              {topFlujos.length > 0 ? topFlujos[0].n_usuarios.toLocaleString('pt-BR') : '—'}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: '#3f5258' }}>
              Usuarios · flujo más denso
            </div>
          </div>
        </div>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* 1. Exclusión Digital por Cluster */}
        <GlassCard title="Exclusión Digital por Cluster (% sesiones 3G)" className="lg:col-span-2">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exclusionData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="cluster" tick={{ fill: '#7a8c91', fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={48} />
                <YAxis tick={{ fill: '#7a8c91', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [`${v ?? 0}%`, '']} />
                <Bar dataKey="pct_3g" name="3G %" radius={[4,4,0,0]}>
                  {exclusionData.map((entry) => (
                    <Cell key={entry.cluster} fill={entry.pct_3g > 60 ? COLORS.danger : entry.pct_3g > 40 ? COLORS.warn : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* 2. Concentración por Periodo */}
        <GlassCard title="Concentración promedio por Período">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={concentracion} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="periodo" tick={{ fill: '#7a8c91', fontSize: 11 }} />
                <YAxis tick={{ fill: '#7a8c91', fontSize: 10 }} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [Number(v ?? 0).toLocaleString('pt-BR'), 'avg usuarios']} />
                <Line type="monotone" dataKey="avg" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* 3. Distribución red móvil — Pie */}
        <GlassCard title="Distribución de Red Móvil (promedio todos los clusters)">
          <div style={{ height: 220 }} className="flex items-center">
            <div style={{ flex: 1, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0}>
                    {pieData.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [`${v ?? 0}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 pr-4">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.fill }} />
                  <div>
                    <div className="text-sm font-bold" style={{ color: d.fill }}>{d.value}%</div>
                    <div className="text-[10px]" style={{ color: '#3f5258' }}>{d.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* 4. Top flujos */}
        <GlassCard title="Top Flujos OD por usuarios" className="lg:col-span-2">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topFlujos} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#7a8c91', fontSize: 10 }} />
                <YAxis type="category" dataKey="label" width={160} tick={{ fill: '#a8b8bd', fontSize: 10 }} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [Number(v ?? 0).toLocaleString('pt-BR'), 'usuarios']} />
                <Bar dataKey="n_usuarios" fill={COLORS.warn} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Data table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#1b1f21', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#7a8c91' }}>
            Datos por Cluster — cobertura
          </p>
          <span className="text-[10px]" style={{ color: '#3f5258' }}>
            {cobertura.length} clusters · click en encabezado para ordenar
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { col: 'cluster' as SortCol,              label: 'Cluster'     },
                  { col: 'pct_3g' as SortCol,               label: '3G %'        },
                  { col: 'pct_4g' as SortCol,               label: '4G %'        },
                  { col: 'pct_5g' as SortCol,               label: '5G %'        },
                  { col: 'download_gb' as SortCol,          label: 'Download GB' },
                  { col: 'total_sessoes' as SortCol,        label: 'Sesiones'    },
                  { col: 'congestionamento_medio' as SortCol, label: 'Congestión' },
                ].map(({ col, label }) => (
                  <th
                    key={col}
                    onClick={() => toggleSort(col)}
                    className="px-4 py-2.5 text-left cursor-pointer hover:opacity-80 select-none"
                    style={{ color: col === sortCol ? '#2fd9f4' : '#7a8c91', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {label} <SortIcon col={col} />
                  </th>
                ))}
                <th className="px-4 py-2.5" style={{ color: '#7a8c91', fontSize: 10 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {sortedTable.map((c, i) => (
                <tr key={c.cluster} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: '#dde4e6' }}>
                    {c.cluster.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-2.5 font-mono"
                    style={{ color: (c.pct_3g ?? 0) > 0.6 ? COLORS.danger : (c.pct_3g ?? 0) > 0.4 ? COLORS.warn : '#22c55e' }}>
                    {((c.pct_3g ?? 0) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: COLORS.warn }}>
                    {((c.pct_4g ?? 0) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: COLORS.primary }}>
                    {((c.pct_5g ?? 0) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: '#a8b8bd' }}>
                    {(c.download_gb ?? 0).toFixed(1)}
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: '#a8b8bd' }}>
                    {(c.total_sessoes ?? 0).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: (c.congestionamento_medio ?? 0) > 0.6 ? COLORS.danger : '#a8b8bd' }}>
                    {((c.congestionamento_medio ?? 0) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => navigate(`/mapa?cluster=${encodeURIComponent(c.cluster)}`)}
                      className="text-[10px] hover:opacity-70 transition-opacity"
                      style={{ color: '#2fd9f4' }}
                    >
                      Ver en mapa →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
