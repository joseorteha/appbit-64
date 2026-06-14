import { useEffect, useState, useCallback } from 'react'
import {
  fetchMapa,
  fetchVertical,
  fetchFlujos,
  fetchConcentracion,
  fetchCobertura,
} from './api/client'
import type { Antena, Flujo, ConcentracionItem, Indicador, Vertical, Periodo, CoberturaItem } from './types'
import MapView from './components/Map/MapView'
import VerticalPanel from './components/Sidebar/VerticalPanel'
import QueryBar from './components/AIQuery/QueryBar'
import NavDock from './components/Nav/NavDock'

const PERIODOS: { id: Periodo; label: string; icon: string }[] = [
  { id: 'MADRUGADA', label: 'Madrugada', icon: '🌙' },
  { id: 'MANHA',     label: 'Manhã',     icon: '🌅' },
  { id: 'TARDE',     label: 'Tarde',     icon: '☀️' },
  { id: 'NOITE',     label: 'Noite',     icon: '🌆' },
]

export default function App() {
  const [antenas,      setAntenas]      = useState<Antena[]>([])
  const [flujos,       setFlujos]       = useState<Flujo[]>([])
  const [concentracion,setConcentracion]= useState<ConcentracionItem[]>([])
  const [cobertura,    setCobertura]    = useState<CoberturaItem[]>([])
  const [indicadores,  setIndicadores]  = useState<Indicador[]>([])
  const [vertical,     setVertical]     = useState<Vertical>('salud_mental')
  const [periodo,      setPeriodo]      = useState<Periodo>('MANHA')
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
  const [loadingMap,   setLoadingMap]   = useState(true)
  const [loadingVert,  setLoadingVert]  = useState(false)
  const [mobilePanel,  setMobilePanel]  = useState(false)

  // Load map data once
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

  // Reload concentracion when period changes
  useEffect(() => {
    fetchConcentracion(periodo)
      .then(setConcentracion)
      .catch(() => setConcentracion([]))
  }, [periodo])

  // Reload indicators when vertical changes
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
  }, [])

  const handleClusterClick = useCallback((cluster: string) => {
    setSelectedCluster(cluster)
    setMobilePanel(true)
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#0c0f0f' }}>

      {/* ── MAP: absolute full screen ── */}
      <div className="absolute inset-0 z-0">
        <MapView
          antenas={antenas}
          flujos={flujos}
          concentracion={concentracion}
          cobertura={cobertura}
          onClusterClick={handleClusterClick}
        />
      </div>

      {/* ── DESKTOP ONLY: Left nav dock ── */}
      <div className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-[400]">
        <NavDock vertical={vertical} onChange={handleVerticalChange} />
      </div>

      {/* ── AI Query bar: top floating (adjusts for left dock on desktop) ── */}
      <div className="absolute top-4 z-[400]
                      left-4 right-4
                      md:left-[88px] md:right-[400px]">
        <QueryBar />
      </div>

      {/* ── DESKTOP ONLY: Period selector — bottom center scrubber ── */}
      <div
        className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-[400]
                   items-center gap-0.5 px-2 py-1.5 rounded-dock glass"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
      >
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: periodo === p.id ? '#2fd9f4' : 'transparent',
              color:      periodo === p.id ? '#00363e' : '#859397',
            }}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* ── DESKTOP ONLY: Right panel ── */}
      <div
        className="hidden md:flex absolute right-4 top-[4.5rem] bottom-4 w-[380px] z-[400]
                   flex-col glass rounded-squircle overflow-hidden"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
      >
        <VerticalPanel
          vertical={vertical}
          indicadores={indicadores}
          loading={loadingVert}
          selectedCluster={selectedCluster}
          cobertura={cobertura}
          onVerticalChange={handleVerticalChange}
        />
      </div>

      {/* ── MOBILE: Slide-up panel ── */}
      {mobilePanel && (
        <div
          className="md:hidden absolute bottom-14 left-0 right-0 z-[450]
                     glass rounded-t-3xl overflow-hidden"
          style={{ maxHeight: '58vh', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 pb-1">
            <button
              onClick={() => setMobilePanel(false)}
              className="w-10 h-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            />
          </div>
          <div className="overflow-y-auto scrollbar-glass" style={{ maxHeight: 'calc(58vh - 2rem)' }}>
            <VerticalPanel
              vertical={vertical}
              indicadores={indicadores}
              loading={loadingVert}
              selectedCluster={selectedCluster}
              cobertura={cobertura}
              onVerticalChange={handleVerticalChange}
            />
          </div>
        </div>
      )}

      {/* ── MOBILE: Bottom nav dock ── */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 z-[500]">
        <NavDock
          vertical={vertical}
          onChange={handleVerticalChange}
          horizontal
        />
      </div>

      {/* ── MOBILE: Period bar (above bottom nav when panel is open) ── */}
      {!mobilePanel && (
        <div
          className="md:hidden absolute bottom-14 left-4 right-4 z-[400]
                     flex items-center gap-0.5 px-2 py-1.5 rounded-dock glass justify-center"
        >
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
              style={{
                background: periodo === p.id ? '#2fd9f4' : 'transparent',
                color:      periodo === p.id ? '#00363e' : '#859397',
              }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Map legend: bottom right ── */}
      <div
        className="absolute bottom-6 right-4 md:right-[400px] z-[400] p-3 rounded-squircle glass text-xs"
        style={{ minWidth: 140 }}
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
          <span style={{ color: '#859397' }}>Flujo OD</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border-2 shrink-0" style={{ borderColor: '#ef4444', background: 'transparent' }} />
          <span style={{ color: '#859397' }}>Borde = % 3G</span>
        </div>
      </div>

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
