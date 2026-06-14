import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet'
import type { Antena, Flujo, ConcentracionItem, CoberturaItem } from '../../types'

interface Props {
  antenas: Antena[]
  flujos: Flujo[]
  concentracion: ConcentracionItem[]
  cobertura: CoberturaItem[]
  onClusterClick?: (cluster: string) => void
}

const FLORIPA_CENTER: [number, number] = [-27.59, -48.55]

// Heat color by concentration of people
function heatColor(n: number): string {
  if (n > 2000) return '#ef4444'
  if (n > 1000) return '#f97316'
  if (n > 500)  return '#eab308'
  return '#22c55e'
}

// Color tint for 3G coverage (exclusion = more red)
function exclusionColor(pct3g: number | null): string {
  if (pct3g === null) return '#6366f1'
  if (pct3g > 0.6) return '#ef4444'   // critical exclusion
  if (pct3g > 0.4) return '#f97316'
  if (pct3g > 0.2) return '#eab308'
  return '#2fd9f4'                     // good coverage
}

export default function MapView({ antenas, flujos, concentracion, cobertura, onClusterClick }: Props) {
  // Index concentracion by ecgi (pick highest n_usuarios across periods)
  const concMap = new Map<string, ConcentracionItem>()
  for (const c of concentracion) {
    if (!c.ecgi) continue
    const prev = concMap.get(c.ecgi)
    if (!prev || (c.n_usuarios ?? 0) > (prev.n_usuarios ?? 0)) {
      concMap.set(c.ecgi, c)
    }
  }

  // Index cobertura by cluster
  const cobMap = new Map<string, CoberturaItem>()
  for (const c of cobertura) cobMap.set(c.cluster, c)

  return (
    <MapContainer
      center={FLORIPA_CENTER}
      zoom={12}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />

      {/* Flow lines between clusters */}
      {flujos.slice(0, 150).map((f, i) => {
        if (!f.origem?.lat || !f.destino?.lat) return null
        const weight = Math.max(1, Math.log10(f.n_usuarios + 1) * 1.5)
        return (
          <Polyline
            key={i}
            positions={[
              [f.origem.lat, f.origem.lon],
              [f.destino.lat, f.destino.lon],
            ]}
            color="#2fd9f4"
            weight={weight}
            opacity={0.25}
          />
        )
      })}

      {/* Antenna markers */}
      {antenas.map((a) => {
        const conc = concMap.get(a.ecgi)
        const cob  = cobMap.get(a.cluster)
        const n    = conc?.n_usuarios ?? 0
        const color  = heatColor(n)
        const exclColor = exclusionColor(cob?.pct_3g ?? null)
        const radius = Math.max(5, Math.min(22, n / 150 + 5))

        return (
          <CircleMarker
            key={a.ecgi}
            center={[a.lat, a.lon]}
            radius={radius}
            fillColor={color}
            color={exclColor}
            fillOpacity={0.72}
            weight={2}
            eventHandlers={{ click: () => onClusterClick?.(a.cluster) }}
          >
            <Popup>
              <div className="text-sm space-y-1 min-w-[160px]">
                <p className="font-bold text-base">{a.cluster.replace(/_/g, ' ')}</p>
                {a.municipio && (
                  <p style={{ color: '#859397', fontSize: 12 }}>{a.municipio}</p>
                )}
                {conc && (
                  <div className="pt-1 space-y-0.5">
                    <p>
                      <span style={{ color: '#859397' }}>Pessoas: </span>
                      <strong>{(conc.n_usuarios ?? 0).toLocaleString('pt-BR')}</strong>
                    </p>
                    <p>
                      <span style={{ color: '#859397' }}>Período: </span>
                      {conc.periodo}
                    </p>
                    {conc.congestionamento_medio !== null && (
                      <p>
                        <span style={{ color: '#859397' }}>Congestion: </span>
                        {conc.congestionamento_medio?.toFixed(3)}
                      </p>
                    )}
                  </div>
                )}
                {cob && (
                  <div className="pt-1 border-t border-white/10 space-y-0.5">
                    <p style={{ color: '#859397', fontSize: 11, fontWeight: 600 }}>COBERTURA RED</p>
                    <p>
                      <span style={{ color: '#ef4444' }}>3G: </span>
                      <strong>{((cob.pct_3g ?? 0) * 100).toFixed(1)}%</strong>
                      <span style={{ color: '#859397', fontSize: 11 }}> (exclusión)</span>
                    </p>
                    <p>
                      <span style={{ color: '#2fd9f4' }}>4G: </span>
                      {((cob.pct_4g ?? 0) * 100).toFixed(1)}%
                    </p>
                    <p>
                      <span style={{ color: '#8aebff' }}>5G: </span>
                      {((cob.pct_5g ?? 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
