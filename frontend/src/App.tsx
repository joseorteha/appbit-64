import { useEffect, useState, useCallback, useRef } from 'react'
import { Moon, Sunrise, Sun, Sunset, X, type LucideIcon } from 'lucide-react'
import {
  fetchMapa,
  fetchVertical,
  fetchFlujos,
  fetchConcentracion,
  fetchCobertura,
  fetchDemograficos,
  type DemograficoItem,
} from './api/client'
import type { Antena, Flujo, ConcentracionItem, Indicador, Vertical, Periodo, CoberturaItem } from './types'
import MapView from './components/Map/MapView'
import VerticalPanel from './components/Sidebar/VerticalPanel'
import QueryBar from './components/AIQuery/QueryBar'
import NavDock from './components/Nav/NavDock'

const PERIODOS: { id: Periodo; label: string; Icon: LucideIcon }[] = [
  { id: 'MADRUGADA', label: 'Madrugada', Icon: Moon },
  { id: 'MANHA',     label: 'Manhã',     Icon: Sunrise },
  { id: 'TARDE',     label: 'Tarde',     Icon: Sun },
  { id: 'NOITE',     label: 'Noite',     Icon: Sunset },
]

export default function App() {
  const [antenas,         setAntenas]         = useState<Antena[]>([])
  const [flujos,          setFlujos]          = useState<Flujo[]>([])
  const [concentracion,   setConcentracion]   = useState<ConcentracionItem[]>([])
  const [cobertura,       setCobertura]       = useState<CoberturaItem[]>([])
  const [indicadores,     setIndicadores]     = useState<Indicador[]>([])
  const [vertical,        setVertical]        = useState<Vertical>('salud_mental')
  const [periodo,         setPeriodo]         = useState<Periodo>('MANHA')
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
  const [loadingMap,      setLoadingMap]      = useState(true)
  const [loadingVert,     setLoadingVert]     = useState(false)
  const [mobilePanel,     setMobilePanel]     = useState(false)
  // Counter-based trigger so MapView can watch it in a useEffect
  const [mapReset,        setMapReset]        = useState(0)
  // Clusters returned by the AI query — highlighted on map
  const [queryClusters,   setQueryClusters]   = useState<string[]>([])
  // Jóvenes 18-24 del endpoint /demograficos para FormacionesContent
  const [demograficos,    setDemograficos]    = useState<DemograficoItem[]>([])
  // Ref to MapView's flyToCluster function (populated by MapView via useEffect)
  const mapFlyToRef = useRef<((cluster: string) => void) | null>(null)
  // First-load onboarding hint — auto-dismisses after 5s
  const [showHint,        setShowHint]        = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    Promise.all([fetchMapa(), fetchFlujos(), fetchCobertura()])
      .then(([mapa, fl, cob]) => {
        setAntenas(mapa.antenas ?? [])
        setFlujos(fl ?? [])
        setCobertura(cob ?? [])
      })
      .catch(console.error)
      .finally(() => setLoadingMap(false))
  }, [])

  useEffect(() => {
    fetchDemograficos('18-24').then(setDemograficos).catch(() => setDemograficos([]))
  }, [])

  useEffect(() => {
    fetchConcentracion(periodo)
      .then(setConcentracion)
      .catch(() => setConcentracion([]))
  }, [periodo])

  useEffect(() => {
    setLoadingVert(true)
    fetchVertical(vertical)
      .then(setIndicadores)
      .catch(() => setIndicadores([]))
      .finally(() => setLoadingVert(false))
  }, [vertical])

  const handleVerticalChange = useCallback((v: Vertical) => {
    setVertical(v)
    setMobilePanel(true)
    // Clear cluster selection so stale detail doesn't persist across verticals
    setSelectedCluster(null)
  }, [])

  const handleClusterClick = useCallback((cluster: string) => {
    setSelectedCluster(cluster)
    setMobilePanel(true)
  }, [])

  const handleClearCluster = useCallback(() => {
    setSelectedCluster(null)
  }, [])

  // "Ver Mapa de Calor" / "Ver Zonas Afectadas": close mobile panel + reset camera to overview
  const handleVerMapa = useCallback(() => {
    setMobilePanel(false)
    setMapReset(prev => prev + 1)
  }, [])

  // QueryBar sends back cluster names from AI results → highlight on map
  const handleQueryResults = useCallback((clusters: string[]) => {
    setQueryClusters(clusters)
  }, [])

  // QueryBar sends first cluster → MapView flies to it
  const handleFlyToCluster = useCallback((cluster: string) => {
    mapFlyToRef.current?.(cluster)
  }, [])

  const sharedPanelProps = {
    vertical,
    indicadores,
    loading: loadingVert,
    selectedCluster,
    cobertura,
    flujos,
    demograficos,
    onVerticalChange:  handleVerticalChange,
    onVerMapa:         handleVerMapa,
    onClearCluster:    handleClearCluster,
    totalAntenas:      antenas.length,
    clusters:          [...new Set(antenas.map(a => a.cluster))],
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: '100dvh', background: '#0c0f0f' }}
    >
      {/* ── MAP: absolute full screen ── */}
      <div className="absolute inset-0 z-0">
        <MapView
          antenas={antenas}
          flujos={flujos}
          concentracion={concentracion}
          cobertura={cobertura}
          onClusterClick={handleClusterClick}
          resetTrigger={mapReset}
          highlightClusters={queryClusters}
          flyToRef={mapFlyToRef}
        />
      </div>

      {/* ── DESKTOP ONLY: Left nav dock ── */}
      <div className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-[400]">
        <NavDock vertical={vertical} onChange={handleVerticalChange} />
      </div>

      {/* ── AI Query bar: top floating ── */}
      <div className="absolute top-4 z-[400] left-4 right-4 md:left-[88px] md:right-[400px]">
        <QueryBar onResults={handleQueryResults} onFlyTo={handleFlyToCluster} />
      </div>

      {/* ── DESKTOP: Period selector — bottom center ── */}
      <div
        className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-[400]
                   items-center gap-0.5 px-2 py-1.5 rounded-dock glass"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
      >
        {PERIODOS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setPeriodo(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: periodo === id ? '#2fd9f4' : 'transparent',
              color:      periodo === id ? '#00363e' : '#859397',
            }}
          >
            <Icon size={13} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      {/* ── DESKTOP ONLY: Right panel ── */}
      <div
        className="hidden md:flex absolute right-4 top-[4.5rem] bottom-4 w-[380px] z-[400]
                   flex-col glass rounded-squircle overflow-hidden"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
      >
        <VerticalPanel {...sharedPanelProps} />
      </div>

      {/* ── MOBILE: Slide-up panel ── */}
      {mobilePanel && (
        <div
          className="md:hidden absolute bottom-[112px] left-0 right-0 z-[450]
                     glass rounded-t-3xl overflow-hidden"
          style={{ maxHeight: '55vh', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}
        >
          <div className="flex justify-center pt-2.5 pb-1">
            <button
              onClick={() => setMobilePanel(false)}
              className="w-10 h-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            />
          </div>
          <div className="overflow-y-auto scrollbar-glass" style={{ maxHeight: 'calc(55vh - 2rem)' }}>
            <VerticalPanel {...sharedPanelProps} />
          </div>
        </div>
      )}

      {/* ── MOBILE: Period bar (always visible, above bottom nav) ── */}
      <div
        className="md:hidden absolute left-4 right-4 z-[400]
                   flex items-center gap-0.5 px-2 py-1.5 rounded-dock glass justify-center"
        style={{ bottom: mobilePanel ? '116px' : '68px' }}
      >
        {PERIODOS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setPeriodo(id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
            style={{
              background: periodo === id ? '#2fd9f4' : 'transparent',
              color:      periodo === id ? '#00363e' : '#859397',
            }}
          >
            <Icon size={11} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      {/* ── MOBILE: Bottom nav dock ── */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 z-[500]">
        <NavDock
          vertical={vertical}
          onChange={handleVerticalChange}
          horizontal
        />
      </div>

      {/* ── Map legend: desktop only ── */}
      <div
        className="hidden md:block absolute bottom-6 right-4 md:right-[400px] z-[400] p-3 rounded-squircle glass text-xs"
        style={{ minWidth: 155 }}
      >
        <p className="font-semibold mb-2" style={{ color: '#bbc9cd' }}>Concentración</p>
        {[
          { color: '#22c55e', label: 'Baja (< 500)' },
          { color: '#eab308', label: 'Media (500–1k)' },
          { color: '#f97316', label: 'Alta (1k–2k)' },
          { color: '#ef4444', label: 'Crítica (> 2k)' },
        ].map((l) => (
          <div key={l.color} className="flex items-center gap-1.5 mt-1">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
            <span style={{ color: '#859397' }}>{l.label}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 flex items-center gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-5 h-0.5 rounded" style={{ background: '#2fd9f4', opacity: 0.5 }} />
          <span style={{ color: '#859397' }}>Flujo OD (≥300 usuarios)</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border-2 shrink-0" style={{ borderColor: '#ef4444', background: 'transparent' }} />
          <span style={{ color: '#859397' }}>Borde = exclusión 3G</span>
        </div>
        {queryClusters.length > 0 && (
          <div className="mt-1 flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border-2 shrink-0" style={{ borderColor: '#fde047', background: 'transparent' }} />
            <span style={{ color: '#fde047' }}>Resultado IA ({queryClusters.length})</span>
          </div>
        )}
      </div>

      {/* ── Onboarding hint — auto-dismisses in 5s ── */}
      {showHint && !loadingMap && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[350]"
          style={{ bottom: '30%' }}
        >
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-xs glass"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}
          >
            <span style={{ color: '#859397' }}>
              <span style={{ color: '#2fd9f4', fontWeight: 600 }}>Explora el mapa</span>
              {' · '}
              <span style={{ color: '#2fd9f4', fontWeight: 600 }}>Consulta la IA</span>
              {' · '}
              <span style={{ color: '#2fd9f4', fontWeight: 600 }}>Analiza los 3 indicadores</span>
            </span>
            <button onClick={() => setShowHint(false)} style={{ color: '#3c494c' }}>
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── Loading overlay ── */}
      {loadingMap && (
        <div
          className="absolute inset-0 z-[600] flex items-center justify-center"
          style={{ background: 'rgba(12,15,15,0.85)' }}
        >
          <div className="glass rounded-squircle px-10 py-7 text-center" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.8)' }}>
            <div
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: '#2fd9f4', borderTopColor: 'transparent' }}
            />
            <p className="text-sm mb-1" style={{ color: '#e2e2e2' }}>App BiT 64</p>
            <p className="text-xs" style={{ color: '#859397' }}>Carregando dados de Florianópolis…</p>
          </div>
        </div>
      )}
    </div>
  )
}
