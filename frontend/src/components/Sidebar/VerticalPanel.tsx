import type { Indicador, Vertical, CoberturaItem } from '../../types'

interface Props {
  vertical: Vertical
  indicadores: Indicador[]
  loading: boolean
  selectedCluster: string | null
  cobertura: CoberturaItem[]
  onVerticalChange: (v: Vertical) => void
}

const VERTICAL_META: Record<Vertical, {
  label: string
  icon: string
  color: string
  metricaLabel: string
  description: string
}> = {
  salud_mental: {
    label: 'Salud Mental',
    icon: '❤️‍🩹',
    color: '#ef4444',
    metricaLabel: 'Índice exclusión digital',
    description: 'Cobertura 3G = mayor riesgo de exclusión al acceso remoto de salud',
  },
  empleabilidad: {
    label: 'Empleabilidad',
    icon: '💼',
    color: '#f59e0b',
    metricaLabel: 'Concentración laboral',
    description: 'Alta concentración en horario laboral + bajo ingreso = oportunidad de intervención',
  },
  formaciones: {
    label: 'Formaciones',
    icon: '📚',
    color: '#2fd9f4',
    metricaLabel: 'Brecha educativa',
    description: 'Jóvenes 18-34 en zonas sin conectividad ni programas tech presenciales',
  },
}

const TABS: { id: Vertical; icon: string; label: string }[] = [
  { id: 'salud_mental',  icon: '❤️‍🩹', label: 'Salud' },
  { id: 'empleabilidad', icon: '💼',    label: 'Empleo' },
  { id: 'formaciones',   icon: '📚',    label: 'Formación' },
]

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / (max || 1)) * 100)
  return (
    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="h-3 rounded w-32" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-3 rounded w-10" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

export default function VerticalPanel({
  vertical, indicadores, loading, selectedCluster, cobertura, onVerticalChange
}: Props) {
  const meta = VERTICAL_META[vertical]
  const sorted = [...indicadores].sort((a, b) => b.valor - a.valor).slice(0, 10)
  const maxVal = sorted[0]?.valor ?? 1

  const clusterCob = selectedCluster
    ? cobertura.find((c) => c.cluster === selectedCluster)
    : null

  const clusterInd = selectedCluster
    ? indicadores.find((i) => i.cluster === selectedCluster)
    : null

  return (
    <div className="flex flex-col h-full text-[#e2e2e2] scrollbar-glass">

      {/* Tab bar */}
      <div className="flex border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onVerticalChange(t.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-semibold transition-all"
            style={{
              color: vertical === t.id ? '#2fd9f4' : '#859397',
              borderBottom: vertical === t.id ? '2px solid #2fd9f4' : '2px solid transparent',
            }}
          >
            <span className="text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 shrink-0">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#859397' }}>
          {meta.metricaLabel}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#859397' }}>
          {meta.description}
        </p>
      </div>

      {/* Ranking list */}
      <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2 scrollbar-glass">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          : sorted.length === 0
            ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-xs text-center" style={{ color: '#859397' }}>
                  Sin datos — ejecuta el seed primero
                </p>
              </div>
            )
            : sorted.map((ind, i) => (
              <div key={ind.cluster} className="flex items-center gap-2.5 group">
                <span className="text-[10px] w-4 text-right shrink-0 font-mono" style={{ color: '#3c494c' }}>
                  {i + 1}
                </span>
                <span
                  className="text-xs w-[130px] shrink-0 truncate"
                  title={ind.cluster}
                  style={{ color: ind.cluster === selectedCluster ? '#2fd9f4' : '#bbc9cd' }}
                >
                  {ind.cluster.replace(/_/g, ' ')}
                </span>
                <Bar value={ind.valor} max={maxVal} color={meta.color} />
                <span className="text-xs font-mono w-16 text-right shrink-0" style={{ color: '#e2e2e2' }}>
                  {ind.valor > 100
                    ? Math.round(ind.valor).toLocaleString('pt-BR')
                    : ind.valor.toFixed(3)}
                </span>
              </div>
            ))
        }
      </div>

      {/* Selected cluster detail */}
      {selectedCluster && (
        <div className="shrink-0 mx-3 mb-3 p-4 rounded-squircle glass-card">
          <p className="text-xs font-bold mb-2" style={{ color: '#2fd9f4' }}>
            CLUSTER SELECCIONADO
          </p>
          <p className="text-sm font-semibold mb-3">
            {selectedCluster.replace(/_/g, ' ')}
          </p>

          {clusterInd && (
            <div className="flex justify-between text-xs mb-3">
              <span style={{ color: '#859397' }}>{meta.metricaLabel}</span>
              <span className="font-mono font-semibold" style={{ color: meta.color }}>
                {clusterInd.valor > 100
                  ? Math.round(clusterInd.valor).toLocaleString('pt-BR')
                  : clusterInd.valor.toFixed(3)}
              </span>
            </div>
          )}

          {clusterCob && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#859397' }}>
                Red móvil
              </p>
              {[
                { label: '3G (exclusión)', value: clusterCob.pct_3g, color: '#ef4444' },
                { label: '4G', value: clusterCob.pct_4g, color: '#f59e0b' },
                { label: '5G', value: clusterCob.pct_5g, color: '#2fd9f4' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[11px] w-20 shrink-0" style={{ color: '#bbc9cd' }}>{label}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${((value ?? 0) * 100).toFixed(0)}%`, background: color }}
                    />
                  </div>
                  <span className="text-[11px] font-mono w-10 text-right" style={{ color }}>
                    {((value ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] tracking-wide" style={{ color: '#3c494c' }}>
          🤝 Mentorías · ⭐ Experiencias — Próximamente
        </span>
      </div>
    </div>
  )
}
