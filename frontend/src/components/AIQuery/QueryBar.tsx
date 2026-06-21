import { useState, useRef } from 'react'
import { Bot, ArrowRight, X } from 'lucide-react'
import { postDatos } from '../../api/client'
import type { DatosResponse } from '../../types'

const EJEMPLOS = [
  '¿Dónde falta conectividad para salud mental?',
  '¿Qué zonas tienen alta concentración laboral?',
  '¿Dónde hay más jóvenes sin acceso a formación?',
  '¿Qué clusters tienen más exclusión digital?',
  '¿Cuáles son los clusters con mayor congestionamiento?',
  '¿Qué zonas tienen peor cobertura 4G o 5G?',
  '¿Dónde se concentran los flujos de mayor distancia?',
  '¿Qué clusters tienen indicadores críticos en empleabilidad?',
]

interface ChatEntry {
  id: number
  query: string
  resultado: DatosResponse
  ts: string
}

interface Props {
  onResults?: (clusters: string[]) => void
  onFlyTo?: (cluster: string) => void
}

export default function QueryBar({ onResults, onFlyTo }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<ChatEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    setExpanded(true)
    try {
      const res = await postDatos(q)
      const entry: ChatEntry = {
        id: Date.now(),
        query: q,
        resultado: res,
        ts: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      }
      setHistory((prev) => [...prev.slice(-4), entry])
      setQuery('')
      if (res.datos.length > 0) {
        const clusters = res.datos.map((d: { cluster: string }) => d.cluster)
        onResults?.(clusters)
        if (clusters[0]) onFlyTo?.(clusters[0])
      }
    } catch {
      setError('No se pudo conectar con el agente IA. ¿Está el backend corriendo en :8000?')
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setHistory([])
    setExpanded(false)
    setError(null)
    onResults?.([])
  }

  return (
    <div
      className="glass rounded-dock shadow-2xl overflow-hidden"
      style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
    >
      {/* Chat header — only when history exists */}
      {expanded && history.length > 0 && (
        <div
          className="flex items-center justify-between px-4 pt-2 pb-1"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-[10px] uppercase tracking-wider" style={{ color: '#859397' }}>
            Conversación IA
          </span>
          <button
            onClick={handleClear}
            className="text-[10px] hover:opacity-60 transition-opacity"
            style={{ color: '#3c494c' }}
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Chat bubbles */}
      {expanded && history.length > 0 && (
        <div className="px-3 py-3 max-h-72 overflow-y-auto scrollbar-glass flex flex-col gap-3">
          {history.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1.5">
              {/* User bubble — right aligned */}
              <div className="flex justify-end">
                <div
                  className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-xs"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e2e2' }}
                >
                  <span style={{ color: '#859397', fontSize: 10, marginRight: 6 }}>{entry.ts}</span>
                  {entry.query}
                </div>
              </div>

              {/* AI bubble — left aligned */}
              <div
                className="max-w-[95%] rounded-2xl rounded-tl-sm p-3 text-xs"
                style={{
                  background: 'rgba(47,217,244,0.06)',
                  border: '1px solid rgba(47,217,244,0.15)',
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: '#2fd9f4' }}
                >
                  Respuesta IA
                  {entry.resultado.datos.length > 0 && (
                    <span
                      className="ml-1.5 px-1.5 py-0.5 rounded text-[9px]"
                      style={{ background: 'rgba(253,224,71,0.15)', color: '#fde047' }}
                    >
                      {entry.resultado.datos.length} clusters resaltados
                    </span>
                  )}
                </p>
                <p style={{ color: '#e2e2e2' }}>{entry.resultado.respuesta_ia}</p>

                {entry.resultado.datos.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {entry.resultado.datos.slice(0, 3).map((d, i) => (
                      <div key={i} className="flex justify-between text-[10px]">
                        <span style={{ color: '#bbc9cd' }}>{d.cluster.replace(/_/g, ' ')}</span>
                        <span className="font-mono" style={{ color: '#2fd9f4' }}>
                          {d.valor > 100
                            ? Math.round(d.valor).toLocaleString('pt-BR')
                            : d.valor.toFixed(3)}
                        </span>
                      </div>
                    ))}
                    {entry.resultado.datos.length > 3 && (
                      <p className="text-[10px]" style={{ color: '#3c494c' }}>
                        +{entry.resultado.datos.length - 3} más
                      </p>
                    )}
                  </div>
                )}

                {entry.resultado.sql_generado && (
                  <details className="mt-2">
                    <summary
                      className="text-[10px] cursor-pointer hover:opacity-70"
                      style={{ color: '#3c494c' }}
                    >
                      Ver SQL generado
                    </summary>
                    <pre
                      className="mt-1 rounded-xl p-2 text-[10px] overflow-x-auto scrollbar-glass"
                      style={{ background: 'rgba(0,0,0,0.4)', color: '#2fd9f4' }}
                    >
                      {entry.resultado.sql_generado}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}

          {/* Error inline — when there's already history */}
          {error && (
            <div
              className="rounded-2xl p-3 text-xs"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}

      {/* Error state — first query failed before any history */}
      {expanded && error && history.length === 0 && (
        <div className="px-3 pt-3">
          <div
            className="rounded-2xl p-3 text-xs"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5',
            }}
          >
            {error}
          </div>
        </div>
      )}

      {/* Search row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5">
        <Bot
          size={18}
          strokeWidth={1.5}
          style={{ color: '#2fd9f4', flexShrink: 0, marginLeft: 4 }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pregunta sobre los datos…"
          className="input-glass flex-1 min-w-0"
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: 0,
            padding: '0 0.25rem',
            boxShadow: 'none',
          }}
          disabled={loading}
        />
        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 hover:opacity-60 transition-opacity"
            style={{ color: '#859397' }}
          >
            <X size={16} />
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary shrink-0 flex items-center gap-1.5"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-[#00363e] border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <ArrowRight size={14} />
          )}
          <span className="hidden sm:inline">{loading ? 'Analizando' : 'Consultar'}</span>
        </button>
      </form>

      {/* Example queries — only when no conversation yet */}
      {!expanded && !loading && (
        <div className="flex gap-1.5 px-4 pb-3 pt-0 overflow-x-auto scrollbar-none">
          {EJEMPLOS.map((ej) => (
            <button
              key={ej}
              onClick={() => {
                setQuery(ej)
                inputRef.current?.focus()
              }}
              className="shrink-0 text-[11px] rounded-full px-2.5 py-1 transition-all hover:text-white/90"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#859397',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {ej}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
