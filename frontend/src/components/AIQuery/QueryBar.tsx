import { useState, useRef } from 'react'
import { Bot, ArrowRight, X, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { postDatos } from '../../api/client'
import type { DatosResponse } from '../../types'

const STORAGE_KEY = 'appbit64_chat_history'

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

function chipStyle(valor: number) {
  const isPercent = valor <= 1
  if (isPercent && valor > 0.6) return { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.22)' }
  if (isPercent && valor > 0.4) return { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.2)' }
  return { bg: 'rgba(47,217,244,0.08)', color: '#2fd9f4', border: 'rgba(47,217,244,0.15)' }
}

function ResultCard({
  entry, isLatest, onFlyTo,
}: { entry: ChatEntry; isLatest: boolean; onFlyTo?: (c: string) => void }) {
  const [open,    setOpen]    = useState(isLatest)
  const [showAI,  setShowAI]  = useState(false)
  const [showSQL, setShowSQL] = useState(false)
  const count = entry.resultado.datos.length

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${open ? 'rgba(47,217,244,0.15)' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 150ms ease-out' }}>

      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        style={{ background: open ? 'rgba(47,217,244,0.05)' : 'rgba(255,255,255,0.025)' }}
      >
        <Zap size={10} style={{ color: '#2fd9f4', flexShrink: 0, opacity: 0.7 }} />
        <span className="flex-1 text-[11px] truncate" style={{ color: open ? '#dde4e6' : '#7a8c91' }}>
          {entry.query}
        </span>
        <span className="text-[10px] font-mono shrink-0" style={{ color: '#3f5258' }}>{entry.ts}</span>
        {count > 0 && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: 'rgba(253,224,71,0.12)', color: '#fde047' }}>
            {count}
          </span>
        )}
        {open
          ? <ChevronUp  size={10} style={{ color: '#3f5258', flexShrink: 0 }} />
          : <ChevronDown size={10} style={{ color: '#3f5258', flexShrink: 0 }} />}
      </button>

      {/* Body — visible when open */}
      {open && (
        <div className="px-3 pb-2.5 pt-2" style={{ background: 'rgba(255,255,255,0.015)' }}>

          {/* Cluster chips */}
          {count > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {entry.resultado.datos.slice(0, 7).map((d, i) => {
                const s = chipStyle(d.valor)
                return (
                  <button
                    key={i}
                    onClick={() => onFlyTo?.(d.cluster)}
                    title={`Ir a ${d.cluster.replace(/_/g, ' ')}`}
                    className="text-[10px] px-2 py-0.5 rounded-full transition-all hover:brightness-125 active:scale-95"
                    style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                  >
                    {d.cluster.replace(/_/g, ' ')}
                    <span className="font-mono ml-1 opacity-60">
                      {d.valor > 100
                        ? Math.round(d.valor).toLocaleString('pt-BR')
                        : `${(d.valor * 100).toFixed(0)}%`}
                    </span>
                  </button>
                )
              })}
              {count > 7 && (
                <span className="text-[10px] self-center" style={{ color: '#3f5258' }}>
                  +{count - 7} más
                </span>
              )}
            </div>
          )}

          {/* Toggles row */}
          <div className="flex items-center gap-3">
            {entry.resultado.respuesta_ia && (
              <button
                onClick={() => setShowAI(v => !v)}
                className="flex items-center gap-1 text-[10px] transition-opacity hover:opacity-70"
                style={{ color: showAI ? '#2fd9f4' : '#7a8c91' }}
              >
                {showAI ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                Análisis IA
              </button>
            )}
            {entry.resultado.sql_generado && (
              <button
                onClick={() => setShowSQL(v => !v)}
                className="flex items-center gap-1 text-[10px] transition-opacity hover:opacity-70"
                style={{ color: showSQL ? '#2fd9f4' : '#3f5258' }}
              >
                {showSQL ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                SQL
              </button>
            )}
          </div>

          {/* AI text */}
          {showAI && entry.resultado.respuesta_ia && (
            <p className="text-[11px] leading-relaxed mt-1.5"
              style={{ color: '#a8b8bd', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
              {entry.resultado.respuesta_ia}
            </p>
          )}

          {/* SQL */}
          {showSQL && entry.resultado.sql_generado && (
            <pre className="mt-1.5 rounded-lg p-2 text-[10px] overflow-x-auto"
              style={{ background: 'rgba(0,0,0,0.35)', color: '#2fd9f4', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {entry.resultado.sql_generado}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

export default function QueryBar({ onResults, onFlyTo }: Props) {
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [history, setHistory] = useState<ChatEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const inputRef = useRef<HTMLInputElement>(null)

  const hasHistory = history.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      const res = await postDatos(q)
      const entry: ChatEntry = {
        id:       Date.now(),
        query:    q,
        resultado: res,
        ts:       new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      }
      setHistory(prev => {
        const next = [...prev.slice(-4), entry]
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
        return next
      })
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
    setError(null)
    onResults?.([])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  return (
    <div
      className="glass rounded-dock shadow-2xl overflow-hidden"
      style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
    >
      {/* Results section */}
      {hasHistory && (
        <>
          <div
            className="flex items-center justify-between px-3 pt-2 pb-1.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-1.5">
              <Bot size={11} style={{ color: '#2fd9f4' }} />
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#3f5258' }}>
                {history.length} consulta{history.length !== 1 ? 's' : ''} guardada{history.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-[10px] hover:opacity-60 transition-opacity"
              style={{ color: '#3f5258' }}
            >
              <X size={10} />
              Limpiar
            </button>
          </div>

          <div className="px-2 py-2 max-h-60 overflow-y-auto scrollbar-glass flex flex-col gap-1.5">
            {history.map((entry, i) => (
              <ResultCard
                key={entry.id}
                entry={entry}
                isLatest={i === history.length - 1}
                onFlyTo={onFlyTo}
              />
            ))}
            {error && (
              <div className="rounded-xl p-2.5 text-[11px]"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                {error}
              </div>
            )}
          </div>
        </>
      )}

      {/* Error before first query */}
      {error && !hasHistory && (
        <div className="px-3 pt-3">
          <div className="rounded-xl p-2.5 text-[11px]"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            {error}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5">
        <Bot
          size={16}
          strokeWidth={1.5}
          style={{ color: '#2fd9f4', flexShrink: 0, marginLeft: 2 }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Pregunta sobre los datos…"
          className="input-glass flex-1 min-w-0"
          style={{ background: 'transparent', border: 'none', borderRadius: 0, padding: '0 0.25rem', boxShadow: 'none' }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary shrink-0 flex items-center gap-1.5"
        >
          {loading
            ? <span className="w-3.5 h-3.5 border-2 border-[#00363e] border-t-transparent rounded-full animate-spin inline-block" />
            : <ArrowRight size={14} />}
          <span className="hidden sm:inline">{loading ? 'Analizando' : 'Consultar'}</span>
        </button>
      </form>

      {/* Example chips — only when no history */}
      {!hasHistory && !loading && (
        <div className="flex gap-1.5 px-4 pb-3 pt-0 overflow-x-auto scrollbar-none">
          {EJEMPLOS.map(ej => (
            <button
              key={ej}
              onClick={() => { setQuery(ej); inputRef.current?.focus() }}
              className="shrink-0 text-[11px] rounded-full px-2.5 py-1 transition-all hover:text-white/90"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#859397', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {ej}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
