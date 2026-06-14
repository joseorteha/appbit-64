import { useState, useRef } from 'react'
import { postDatos } from '../../api/client'
import type { DatosResponse } from '../../types'

const EJEMPLOS = [
  '¿Dónde falta conectividad para salud mental?',
  '¿Qué zonas tienen alta concentración laboral?',
  '¿Dónde hay más jóvenes sin acceso a formación?',
  '¿Qué clusters tienen más exclusión digital?',
]

export default function QueryBar() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<DatosResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [showSQL, setShowSQL] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setLoading(true)
    setError(null)
    setResultado(null)
    setExpanded(true)

    try {
      const data = await postDatos(q)
      setResultado(data)
    } catch {
      setError('No se pudo conectar con el agente IA. ¿Está el backend corriendo en :8000?')
    } finally {
      setLoading(false)
    }
  }

  function handleExample(ej: string) {
    setQuery(ej)
    inputRef.current?.focus()
  }

  function handleClose() {
    setExpanded(false)
    setResultado(null)
    setError(null)
  }

  return (
    <div className="glass rounded-dock shadow-2xl overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
      {/* Search row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5">
        <span className="text-lg shrink-0 pl-1">🤖</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pregunta en lenguaje natural sobre los datos…"
          className="input-glass flex-1"
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: 0,
            padding: '0 0.25rem',
            boxShadow: 'none',
          }}
          disabled={loading}
        />
        {(resultado || error) && (
          <button
            type="button"
            onClick={handleClose}
            className="text-lg shrink-0 transition-opacity hover:opacity-60"
            style={{ color: '#859397' }}
          >
            ✕
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary shrink-0 flex items-center gap-1.5"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-[#00363e] border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            '→'
          )}
          {loading ? 'Analizando' : 'Consultar'}
        </button>
      </form>

      {/* Example queries (show when not expanded) */}
      {!expanded && !loading && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3 pt-0">
          {EJEMPLOS.map((ej) => (
            <button
              key={ej}
              onClick={() => handleExample(ej)}
              className="text-[11px] rounded-full px-2.5 py-1 transition-all hover:text-white/90"
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

      {/* AI Response */}
      {expanded && resultado && (
        <div className="px-4 pb-4 space-y-3 max-h-60 overflow-y-auto scrollbar-glass">
          <div
            className="rounded-2xl p-3 text-sm leading-relaxed"
            style={{ background: 'rgba(47,217,244,0.06)', border: '1px solid rgba(47,217,244,0.15)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#2fd9f4' }}>
              Respuesta IA
            </p>
            <p style={{ color: '#e2e2e2' }}>{resultado.respuesta_ia}</p>
          </div>

          {resultado.datos.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#859397' }}>
                Datos relevantes
              </p>
              {resultado.datos.slice(0, 5).map((d, i) => (
                <div key={i} className="flex justify-between text-xs gap-4">
                  <span style={{ color: '#bbc9cd' }} className="truncate">{d.cluster.replace(/_/g, ' ')}</span>
                  <span className="font-mono shrink-0" style={{ color: '#2fd9f4' }}>
                    {d.valor > 100 ? Math.round(d.valor).toLocaleString('pt-BR') : d.valor.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {resultado.fuentes.length > 0 && (
            <p className="text-[10px]" style={{ color: '#3c494c' }}>
              Fuentes: {resultado.fuentes.join(' · ')}
            </p>
          )}

          {resultado.sql_generado && (
            <div>
              <button
                onClick={() => setShowSQL(!showSQL)}
                className="text-[10px] underline"
                style={{ color: '#3c494c' }}
              >
                {showSQL ? 'Ocultar SQL' : 'Ver SQL generado'}
              </button>
              {showSQL && (
                <pre
                  className="mt-1 rounded-xl p-2 text-[10px] overflow-x-auto scrollbar-glass"
                  style={{ background: 'rgba(0,0,0,0.4)', color: '#2fd9f4' }}
                >
                  {resultado.sql_generado}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {expanded && error && (
        <div className="px-4 pb-4">
          <div
            className="rounded-2xl p-3 text-xs"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
          >
            {error}
          </div>
        </div>
      )}
    </div>
  )
}
