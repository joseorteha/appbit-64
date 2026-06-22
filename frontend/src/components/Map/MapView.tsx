import { useMemo, useEffect, useRef, useState, useCallback, Component, type MutableRefObject } from 'react'
import type { ReactNode } from 'react'
import { LocateFixed } from 'lucide-react'
import MapGL, { Layer, Source, useControl } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import { MapboxOverlay } from '@deck.gl/mapbox'
import type { MapboxOverlayProps } from '@deck.gl/mapbox'
import { ScatterplotLayer, ArcLayer } from '@deck.gl/layers'
import type { Antena, Flujo, ConcentracionItem, CoberturaItem } from '../../types'

interface Props {
  antenas: Antena[]
  flujos: Flujo[]
  concentracion: ConcentracionItem[]
  cobertura: CoberturaItem[]
  onClusterClick?: (cluster: string) => void
  resetTrigger?: number
  highlightClusters?: string[]
  flyToRef?: MutableRefObject<((cluster: string) => void) | null>
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

// Safety net: catches any remaining deck.gl WebGL errors before they bubble to
// React's root and leak raw GLSL shader source onto the screen.
class DeckErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err: Error) {
    if (!err.message?.includes('#version') && !err.message?.includes('WebGL')) {
      console.error('[MapView] deck.gl error:', err)
    }
  }
  render() { return this.state.failed ? null : this.props.children }
}

const INITIAL_VIEW = {
  longitude: -48.55, latitude: -27.595, zoom: 11, pitch: 52, bearing: -15,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BUILDINGS_LAYER: any = {
  id: '3d-buildings', source: 'composite', 'source-layer': 'building',
  type: 'fill-extrusion', minzoom: 14, filter: ['==', 'extrude', 'true'],
  paint: {
    'fill-extrusion-color': '#1a1d1d',
    'fill-extrusion-height': ['get', 'height'],
    'fill-extrusion-base': ['get', 'min_height'],
    'fill-extrusion-opacity': 0.72,
  },
}

// Mapbox native heatmap paint — mirrors the former deck.gl HeatmapLayer color range.
// Uses Mapbox's own GPU pipeline which works on all devices without WebGL 2.0.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HEAT_PAINT: any = {
  'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 2000, 1],
  'heatmap-intensity': 1.1,
  'heatmap-radius': 55,
  'heatmap-opacity': 0.85,
  'heatmap-color': [
    'interpolate', ['linear'], ['heatmap-density'],
    0,   'rgba(34,197,94,0)',
    0.1, 'rgba(34,197,94,0.4)',
    0.3, 'rgba(234,179,8,0.65)',
    0.5, 'rgba(249,115,22,0.75)',
    0.7, 'rgba(239,68,68,0.88)',
    1.0, 'rgba(153,27,27,1)',
  ],
}

function heatRgba(n: number): [number, number, number, number] {
  if (n > 2000) return [239, 68, 68, 230]
  if (n > 1000) return [249, 115, 22, 210]
  if (n > 500)  return [234, 179, 8, 190]
  return             [34, 197, 94, 170]
}

function exclusionColor(pct3g: number | null): [number, number, number, number] {
  if (pct3g === null) return [47, 217, 244, 80]
  if (pct3g > 0.6)   return [239, 68, 68, 200]
  if (pct3g > 0.4)   return [249, 115, 22, 180]
  if (pct3g > 0.2)   return [234, 179, 8, 160]
  return [47, 217, 244, 140]
}

function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props))
  overlay.setProps(props)
  return null
}

export default function MapView({
  antenas, flujos, concentracion, cobertura, onClusterClick,
  resetTrigger = 0, highlightClusters = [], flyToRef,
}: Props) {
  const [pulse, setPulse] = useState(1.0)
  const rafRef = useRef<number>(0)
  const mapRef = useRef<MapRef>(null)

  useEffect(() => {
    let t = 0
    const tick = () => {
      t += 0.022
      setPulse(1 + 0.14 * Math.sin(t))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const concMap = useMemo(() => {
    const m = new Map<string, ConcentracionItem>()
    for (const c of concentracion) {
      if (!c.ecgi) continue
      const prev = m.get(c.ecgi)
      if (!prev || (c.n_usuarios ?? 0) > (prev.n_usuarios ?? 0)) m.set(c.ecgi, c)
    }
    return m
  }, [concentracion])

  const cobMap = useMemo(() => {
    const m = new Map<string, CoberturaItem>()
    for (const c of cobertura) m.set(c.cluster, c)
    return m
  }, [cobertura])

  // GeoJSON for the Mapbox-native heatmap layer (works on all devices/GPUs)
  const heatGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: concentracion
      .filter(c => c.lat != null && c.lon != null && (c.n_usuarios ?? 0) > 0)
      .map(c => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [c.lon!, c.lat!] },
        properties: { weight: c.n_usuarios! },
      })),
  }), [concentracion])

  const significantFlows = useMemo(
    () => flujos.filter(f => f.n_usuarios > 0 && f.origem?.lat && f.destino?.lat).slice(0, 120),
    [flujos]
  )

  const highlightData = useMemo(() => {
    if (!highlightClusters.length) return []
    const set  = new Set(highlightClusters)
    const seen = new Set<string>()
    return antenas.filter(a => {
      if (!set.has(a.cluster) || seen.has(a.cluster)) return false
      seen.add(a.cluster)
      return true
    })
  }, [antenas, highlightClusters])

  const resetView = useCallback(() => {
    mapRef.current?.flyTo({
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom, pitch: INITIAL_VIEW.pitch, bearing: INITIAL_VIEW.bearing, duration: 1800,
    })
  }, [])

  useEffect(() => {
    if (resetTrigger > 0) resetView()
  }, [resetTrigger, resetView])

  const flyToCluster = useCallback((antenna: Antena) => {
    onClusterClick?.(antenna.cluster)
    mapRef.current?.flyTo({
      center: [antenna.lon, antenna.lat],
      zoom: 15.2, pitch: 65, bearing: -22, duration: 2200, essential: true,
    })
  }, [onClusterClick])

  useEffect(() => {
    if (!flyToRef) return
    flyToRef.current = (cluster: string) => {
      const antenna = antenas.find(a => a.cluster === cluster)
      if (antenna) flyToCluster(antenna)
    }
  }, [flyToRef, antenas, flyToCluster])

  // deck.gl layers: ScatterplotLayer + ArcLayer only.
  // HeatmapLayer removed — replaced by Mapbox-native <Layer type="heatmap"> below,
  // which uses Mapbox's own GPU pipeline and works identically on all devices.
  const layers = useMemo(() => [
    new ScatterplotLayer({
      id: 'halo', data: antenas,
      getPosition: (a: Antena) => [a.lon, a.lat],
      getRadius: (a: Antena) => {
        const conc = concMap.get(a.ecgi)
        const base = conc ? Math.max(130, Math.min(500, (conc.n_usuarios ?? 0) / 3.5)) : 130
        return base * pulse * 1.7
      },
      getFillColor: [0,0,0,0],
      getLineColor: (a: Antena) => exclusionColor(cobMap.get(a.cluster)?.pct_3g ?? null),
      lineWidthMinPixels: 1, lineWidthMaxPixels: 2,
      stroked: true, filled: false, pickable: false,
      radiusUnits: 'meters', radiusMinPixels: 3,
      updateTriggers: { getRadius: [pulse, concMap], getLineColor: [cobMap] },
    }),
    new ScatterplotLayer({
      id: 'dots', data: antenas,
      getPosition: (a: Antena) => [a.lon, a.lat],
      getRadius: (a: Antena) => {
        const conc = concMap.get(a.ecgi)
        const base = conc ? Math.max(90, Math.min(380, (conc.n_usuarios ?? 0) / 4.5)) : 90
        return base * (0.96 + 0.04 * pulse)
      },
      getFillColor: (a: Antena) => {
        const conc = concMap.get(a.ecgi)
        return conc ? heatRgba(conc.n_usuarios ?? 0) : [148, 163, 184, 130]
      },
      getLineColor: [255,255,255,20], lineWidthMinPixels: 0.5,
      stroked: true, pickable: true,
      radiusUnits: 'meters', radiusMinPixels: 4, radiusMaxPixels: 26,
      onClick: (info: { object?: Antena }) => { if (info.object) flyToCluster(info.object) },
      updateTriggers: { getRadius: [pulse, concMap], getFillColor: [concMap] },
    }),
    ...(significantFlows.length > 0 ? [
      new ArcLayer({
        id: 'arcs', data: significantFlows,
        getSourcePosition: (f: Flujo) => [f.origem.lon, f.origem.lat],
        getTargetPosition: (f: Flujo) => [f.destino.lon, f.destino.lat],
        getWidth: (f: Flujo) => Math.max(0.8, Math.log10(f.n_usuarios + 1) * 1.3),
        getSourceColor: [47,217,244,150], getTargetColor: [138,235,255,50],
        getHeight: 0.3, widthMinPixels: 1, widthMaxPixels: 5, pickable: false,
      })
    ] : []),
    ...(highlightData.length > 0 ? [
      new ScatterplotLayer({
        id: 'highlight', data: highlightData,
        getPosition: (a: Antena) => [a.lon, a.lat],
        getRadius: 900,
        getFillColor: [253, 224, 71, 0],
        getLineColor: [253, 224, 71, 220],
        lineWidthMinPixels: 2, lineWidthMaxPixels: 3,
        stroked: true, filled: true,
        radiusUnits: 'meters', radiusMinPixels: 8,
        pickable: false,
      })
    ] : []),
  ], [antenas, significantFlows, highlightData, concMap, cobMap, pulse, flyToCluster])

  const getTooltip = useCallback((info: { object?: Antena }) => {
    const object = info.object
    if (!object?.ecgi) return null
    const conc = concMap.get(object.ecgi)
    const cob  = cobMap.get(object.cluster)
    return {
      html: `<div style="font-family:Inter,sans-serif;background:rgba(18,20,20,0.97);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:14px 16px;color:#e2e2e2;min-width:190px;box-shadow:0 12px 40px rgba(0,0,0,0.8)">
        <div style="font-weight:700;font-size:13px;margin-bottom:2px;color:#8aebff">${(object.cluster ?? '').replace(/_/g,' ')}</div>
        ${object.municipio ? `<div style="color:#859397;font-size:11px;margin-bottom:8px">${object.municipio}</div>` : ''}
        ${conc ? `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><span style="color:#859397">Pessoas</span><strong style="color:#2fd9f4">${(conc.n_usuarios??0).toLocaleString('pt-BR')}</strong></div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><span style="color:#859397">Período</span><span>${conc.periodo}</span></div>${conc.congestionamento_medio!=null?`<div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:#859397">Congestão</span><span>${conc.congestionamento_medio.toFixed(3)}</span></div>`:''}`:''}
        ${cob ? (() => {
          const p3=((cob.pct_3g??0)*100),p4=((cob.pct_4g??0)*100),p5=((cob.pct_5g??0)*100)
          const bar=(pct:number,color:string)=>`<div style="flex:1;background:rgba(255,255,255,0.07);border-radius:3px;height:5px;overflow:hidden"><div style="width:${Math.min(100,pct)}%;height:100%;background:${color};border-radius:3px"></div></div>`
          return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.07)"><div style="font-size:10px;font-weight:600;color:#859397;letter-spacing:.08em;margin-bottom:8px">RED MÓVIL</div><div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span style="color:#ef4444;font-size:11px;min-width:20px">3G</span>${bar(p3,'#ef4444')}<strong style="color:#ef4444;font-size:11px;min-width:38px;text-align:right">${p3.toFixed(1)}%</strong></div><div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span style="color:#f59e0b;font-size:11px;min-width:20px">4G</span>${bar(p4,'#f59e0b')}<span style="color:#e2e2e2;font-size:11px;min-width:38px;text-align:right">${p4.toFixed(1)}%</span></div><div style="display:flex;align-items:center;gap:6px"><span style="color:#2fd9f4;font-size:11px;min-width:20px">5G</span>${bar(p5,'#2fd9f4')}<span style="color:#2fd9f4;font-size:11px;min-width:38px;text-align:right">${p5.toFixed(1)}%</span></div></div>`
        })() : ''}
      </div>`,
      style: { background: 'none', border: 'none', padding: '0' },
    }
  }, [concMap, cobMap])

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{position:'absolute',inset:0,background:'#0c0f0f',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:'#859397',fontFamily:'Inter,sans-serif',fontSize:14}}>
        <span style={{color:'#2fd9f4',fontSize:20,fontWeight:700}}>Mapbox token requerido</span>
        <span>Agrega <code style={{color:'#8aebff'}}>VITE_MAPBOX_TOKEN=pk.ey...</code> en <code>frontend/.env</code></span>
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MapGL
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        terrain={{ source: 'mapbox-dem', exaggeration: 1.4 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Terrain DEM + 3D buildings — Mapbox-native, supported on all devices */}
        <Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} maxzoom={14} />
        <Layer {...BUILDINGS_LAYER} />

        {/* Heatmap via Mapbox-native layer — replaces the former deck.gl HeatmapLayer.
            Mapbox's pipeline handles WebGL compatibility across all GPUs/browsers. */}
        {heatGeoJSON.features.length > 0 && (
          <Source id="heat-src" type="geojson" data={heatGeoJSON}>
            <Layer id="heat-mapbox" type="heatmap" paint={HEAT_PAINT} />
          </Source>
        )}

        {/* deck.gl overlay: ScatterplotLayer (circles + halos) + ArcLayer (flows).
            DeckErrorBoundary prevents any future deck.gl errors from leaking to screen. */}
        <DeckErrorBoundary>
          <DeckGLOverlay layers={layers} getTooltip={getTooltip} />
        </DeckErrorBoundary>
      </MapGL>

      <button
        onClick={resetView}
        title="Volver a vista general"
        style={{
          position: 'absolute', bottom: 96, right: 16, zIndex: 500,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(18,20,20,0.88)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#859397', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)',
        }}
      >
        <LocateFixed size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}
