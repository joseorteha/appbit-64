import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Moon, Sunrise, Sun, Sunset, X, ChevronLeft, type LucideIcon } from 'lucide-react'
import {
  fetchMapa, fetchVertical, fetchFlujos, fetchConcentracion,
  fetchCobertura, fetchDemograficos, type DemograficoItem,
} from '../api/client'
import type { Antena, Flujo, ConcentracionItem, Indicador, Vertical, Periodo, CoberturaItem } from '../types'
import MapView from '../components/Map/MapView'
import VerticalPanel from '../components/Sidebar/VerticalPanel'
import QueryBar from '../components/AIQuery/QueryBar'
import NavDock from '../components/Nav/NavDock'
import AppNav from '../components/Layout/AppNav'

const PERIODOS: { id: Periodo; label: string; Icon: LucideIcon }[] = [
  { id: 'MADRUGADA', label: 'Madrugada', Icon: Moon    },
  { id: 'MANHA',     label: 'Manhã',     Icon: Sunrise },
  { id: 'TARDE',     label: 'Tarde',     Icon: Sun     },
  { id: 'NOITE',     label: 'Noite',     Icon: Sunset  },
]

export default function MapPage() {
  const [searchParams]                                   = useSearchParams()
  const [antenas,         setAntenas]         = useState<Antena[]>([])
  const [flujos,          setFlujos]          = useState<Flujo[]>([])
  const [concentracion,   setConcentracion]   = useState<ConcentracionItem[]>([])
  const [cobertura,       setCobertura]       = useState<CoberturaItem[]>([])
  const [indicadores,     setIndicadores]     = useState<Indicador[]>([])
  const [vertical,        setVertical]        = useState<Vertical>(() =>
    (localStorage.getItem('appbit64_vertical') as Vertical | null) ?? 'salud_mental'
  )
  const [periodo,         setPeriodo]         = useState<Periodo>(() =>
    (localStorage.getItem('appbit64_periodo') as Periodo | null) ?? 'MANHA'
  )
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
  const [loadingMap,      setLoadingMap]      = useState(true)
  const [loadingVert,     setLoadingVert]     = useState(false)
  const [mobilePanel,     setMobilePanel]     = useState(false)
  const [mapReset,        setMapReset]        = useState(0)
  const [queryClusters,   setQueryClusters]   = useState<string[]>([])
  const [demograficos,    setDemograficos]    = useState<DemograficoItem[]>([])
  const [showHint,        setShowHint]        = useState(true)
  const [queryOpen,       setQueryOpen]       = useState(false)
  const [panelOpen,       setPanelOpen]       = useState(true)
  const mapFlyToRef = useRef<((cluster: string) => void) | null>(null)

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

  // URL param ?cluster=xxx → fly to cluster on mount
  useEffect(() => {
    const c = searchParams.get('cluster')
    if (c && !loadingMap) {
      setSelectedCluster(c)
      setMobilePanel(true)
      mapFlyToRef.current?.(c)
    }
  }, [loadingMap, searchParams])

  useEffect(() => {
    fetchDemograficos('18-24').then(setDemograficos).catch(() => setDemograficos([]))
  }, [])

  useEffect(() => {
    fetchConcentracion(periodo).then(setConcentracion).catch(() => setConcentracion([]))
  }, [periodo])

  useEffect(() => {
    setLoadingVert(true)
    fetchVertical(vertical)
      .then(setIndicadores)
      .catch(() => setIndicadores([]))
      .finally(() => setLoadingVert(false))
  }, [vertical])

  const handleVerticalChange = useCallback((v: Vertical) => {
    setVertical(v); setMobilePanel(true); setSelectedCluster(null)
    try { localStorage.setItem('appbit64_vertical', v) } catch {}
  }, [])

  const handleClusterClick = useCallback((cluster: string) => {
    setSelectedCluster(cluster); setMobilePanel(true)
  }, [])

  const handleClearCluster  = useCallback(() => setSelectedCluster(null), [])
  const handleVerMapa       = useCallback(() => { setMobilePanel(false); setMapReset(p => p + 1) }, [])
  const handlePeriodoChange = useCallback((p: Periodo) => {
    setPeriodo(p)
    try { localStorage.setItem('appbit64_periodo', p) } catch {}
  }, [])
  const handleQueryResults  = useCallback((clusters: string[]) => setQueryClusters(clusters), [])
  const handleFlyToCluster  = useCallback((cluster: string) => mapFlyToRef.current?.(cluster), [])

  const sharedPanelProps = {
    vertical, indicadores, loading: loadingVert, selectedCluster,
    cobertura, flujos, demograficos,
    onVerticalChange: handleVerticalChange,
    onVerMapa:        handleVerMapa,
    onClearCluster:   handleClearCluster,
    totalAntenas:     antenas.length,
    clusters:         [...new Set(antenas.map(a => a.cluster))],
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '100dvh', background: '#0c0f0f' }}>

      {/* AppNav overlay (transparent on map) */}
      <div className="absolute top-0 left-0 right-0 z-[500]">
        <AppNav />
      </div>

      {/* Map */}
      <div className="absolute inset-0 z-0">
        <MapView
          antenas={antenas} flujos={flujos} concentracion={concentracion} cobertura={cobertura}
          onClusterClick={handleClusterClick} resetTrigger={mapReset}
          highlightClusters={queryClusters} flyToRef={mapFlyToRef}
        />
      </div>

      {/* Desktop: left vertical nav dock */}
      <div className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-[400]">
        <NavDock vertical={vertical} onChange={handleVerticalChange} />
      </div>

      {/* Desktop: AI button + panel — bottom-left, above period selector */}
      <div className="hidden md:block absolute z-[400]" style={{ bottom: '6.5rem', left: '1.5rem' }}>
        {queryOpen ? (
          <div className="w-[340px] max-w-[calc(100vw-1.5rem)]">
            <QueryBar
              onResults={handleQueryResults}
              onFlyTo={handleFlyToCluster}
              onClose={() => setQueryOpen(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setQueryOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl glass transition-all hover:brightness-110"
            style={{ border: '1px solid rgba(47,217,244,0.22)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="#2fd9f4" strokeWidth="1"/>
              <path d="M4.5 5.5C4.5 4.12 5.62 3 7 3s2.5 1.12 2.5 2.5c0 1.5-1.5 2-1.5 3H6c0-1-.5-1.5-1.5-2.5z" fill="#2fd9f4" fillOpacity=".8"/>
              <circle cx="7" cy="11" r=".75" fill="#2fd9f4"/>
            </svg>
            <span className="text-[12px] font-semibold" style={{ color: '#dde4e6', letterSpacing: '-0.01em' }}>
              Consultar IA
            </span>
          </button>
        )}
      </div>

      {/* Desktop: period selector — bottom-left */}
      <div className="hidden md:flex absolute bottom-6 left-6 z-[400]
                      items-center gap-0.5 px-2 py-1.5 rounded-dock glass"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        {PERIODOS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => handlePeriodoChange(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{ background: periodo === id ? '#2fd9f4' : 'transparent', color: periodo === id ? '#00363e' : '#859397' }}>
            <Icon size={13} strokeWidth={2} />{label}
          </button>
        ))}
      </div>

      {/* Desktop: right vertical panel (colapsable) */}
      {panelOpen ? (
        <div className="hidden md:flex absolute right-4 bottom-4 w-[380px] z-[400]
                        flex-col glass rounded-squircle overflow-hidden"
          style={{ top: '4.5rem', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
          <VerticalPanel {...sharedPanelProps} onClose={() => setPanelOpen(false)} />
        </div>
      ) : (
        <button
          onClick={() => setPanelOpen(true)}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-[400]
                     flex-col items-center gap-2 py-4 px-2.5 rounded-l-2xl glass transition-all hover:brightness-110"
          style={{ boxShadow: '-4px 0 20px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.09)', borderRight: 'none' }}
        >
          <ChevronLeft size={14} style={{ color: '#2fd9f4' }} />
          <span className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: '#859397', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Datos
          </span>
        </button>
      )}

      {/* Mobile: slide-up panel */}
      {mobilePanel && (
        <div className="md:hidden absolute bottom-[112px] left-0 right-0 z-[450]
                        glass rounded-t-3xl overflow-hidden"
          style={{ maxHeight: '55vh', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}>
          <div className="flex justify-center pt-2.5 pb-1">
            <button onClick={() => setMobilePanel(false)}
              className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div className="overflow-y-auto scrollbar-glass" style={{ maxHeight: 'calc(55vh - 2rem)' }}>
            <VerticalPanel {...sharedPanelProps} />
          </div>
        </div>
      )}

      {/* Mobile: period bar */}
      <div className="md:hidden absolute left-4 right-4 z-[400]
                      flex items-center gap-0.5 px-2 py-1.5 rounded-dock glass justify-center"
        style={{ bottom: mobilePanel ? '116px' : '68px' }}>
        {PERIODOS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => handlePeriodoChange(id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
            style={{ background: periodo === id ? '#2fd9f4' : 'transparent', color: periodo === id ? '#00363e' : '#859397' }}>
            <Icon size={11} strokeWidth={2} />{label}
          </button>
        ))}
      </div>

      {/* Mobile: bottom nav dock (hidden — AppNav handles mobile bottom nav) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 z-[500]">
        <NavDock vertical={vertical} onChange={handleVerticalChange} horizontal />
      </div>

      {/* Map legend — compact horizontal row, bottom-center */}
      <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-[400]
                      items-center gap-3 px-4 py-2 rounded-full glass text-[11px]"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
        {[
          { color: '#22c55e', label: 'Baja'   },
          { color: '#eab308', label: 'Media'  },
          { color: '#f97316', label: 'Alta'   },
          { color: '#ef4444', label: 'Crítica'},
        ].map(l => (
          <div key={l.color} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
            <span style={{ color: '#859397' }}>{l.label}</span>
          </div>
        ))}
        <div className="w-px h-3 mx-1" style={{ background: 'rgba(255,255,255,0.12)' }} />
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded" style={{ background: '#2fd9f4', opacity: 0.5 }} />
          <span style={{ color: '#859397' }}>Flujo OD</span>
        </div>
        {queryClusters.length > 0 && (
          <>
            <div className="w-px h-3 mx-1" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full border shrink-0" style={{ borderColor: '#fde047', background: 'transparent' }} />
              <span style={{ color: '#fde047' }}>IA ({queryClusters.length})</span>
            </div>
          </>
        )}
      </div>

      {/* Onboarding hint */}
      {showHint && !loadingMap && (
        <div className="absolute left-1/2 -translate-x-1/2 z-[350]" style={{ bottom: '30%' }}>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full text-xs glass"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#859397' }}>
              <span style={{ color: '#2fd9f4', fontWeight: 600 }}>Explora el mapa</span>{' · '}
              <span style={{ color: '#2fd9f4', fontWeight: 600 }}>Consulta la IA</span>{' · '}
              <span style={{ color: '#2fd9f4', fontWeight: 600 }}>Analiza los 3 indicadores</span>
            </span>
            <button onClick={() => setShowHint(false)} style={{ color: '#3c494c' }}><X size={12} /></button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loadingMap && (
        <div className="absolute inset-0 z-[600] flex items-center justify-center"
          style={{ background: 'rgba(12,15,15,0.85)' }}>
          <div className="glass rounded-squircle px-10 py-7 text-center" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.8)' }}>
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: '#2fd9f4', borderTopColor: 'transparent' }} />
            <p className="text-sm mb-1" style={{ color: '#e2e2e2' }}>App BiT 64</p>
            <p className="text-xs" style={{ color: '#859397' }}>Carregando dados de Florianópolis…</p>
          </div>
        </div>
      )}
    </div>
  )
}
