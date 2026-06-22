import { useState, useRef, useEffect } from 'react'
import { X, Send, MapPin, ChevronDown, ChevronUp, Code2, Zap } from 'lucide-react'
import { postDatos } from '../../api/client'
import type { DatosResponse } from '../../types'

const STORAGE_KEY = 'appbit64_chat_history'

const EJEMPLOS = [
  '¿Dónde falta conectividad para salud mental?',
  '¿Qué zonas tienen alta concentración laboral?',
  '¿Dónde hay más jóvenes sin acceso a formación?',
  '¿Cuáles son los clusters con mayor congestionamiento?',
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
  onClose?: () => void
}

function clusterColor(valor: number) {
  const p = valor <= 1
  if (p && valor > 0.6) return '#ef4444'
  if (p && valor > 0.4) return '#f97316'
  return '#2fd9f4'
}

function EntryBlock({ entry, onFlyTo }: { entry: ChatEntry; onFlyTo?: (c: string) => void }) {
  const [showSQL, setShowSQL] = useState(false)
  const count = entry.resultado.datos.length

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
      {/* Query row */}
      <div className="flex items-start gap-2 mb-2">
        <Zap size={10} style={{ color: '#2fd9f4', marginTop: 3, flexShrink: 0 }} />
        <p className="text-[11px] font-semibold leading-snug" style={{ color: '#859397' }}>
          {entry.query}
        </p>
        <span className="ml-auto text-[10px] font-mono shrink-0" style={{ color: '#3f5258' }}>
          {entry.ts}
        </span>
      </div>

      {/* AI response text */}
      {entry.resultado.respuesta_ia && (
        <p className="text-[12px] leading-relaxed mb-3" style={{ color: '#c8d6da' }}>
          {entry.resultado.respuesta_ia}
        </p>
      )}

      {/* Cluster list */}
      {count > 0 && (
        <div className="mb-2">
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#3f5258' }}>
            Zonas identificadas
          </p>
          {entry.resultado.datos.slice(0, 6).map((d, i) => {
            const color = clusterColor(d.valor)
            return (
              <button
                key={i}
                onClick={() => onFlyTo?.(d.cluster)}
                className="w-full flex items-center gap-2 py-1.5 text-left transition-all hover:brightness-110 active:opacity-70"
                style={{ borderBottom: i < Math.min(count, 6) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              >
                <MapPin size={10} style={{ color, flexShrink: 0 }} />
                <span className="flex-1 text-[11.5px] truncate" style={{ color: '#a8b8bd' }}>
                  {d.cluster.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono tabular-nums" style={{ color }}>
                  {d.valor > 100
                    ? Math.round(d.valor).toLocaleString('pt-BR')
                    : `${(d.valor * 100).toFixed(0)}%`}
                </span>
              </button>
            )
          })}
          {count > 6 && (
            <p className="text-[10px] mt-1" style={{ color: '#3f5258' }}>+{count - 6} más</p>
          )}
        </div>
      )}

      {/* SQL toggle */}
      {entry.resultado.sql_generado && (
        <div>
          <button
            onClick={() => setShowSQL(v => !v)}
            className="flex items-center gap-1 text-[10px] transition-opacity hover:opacity-80"
            style={{ color: showSQL ? '#2fd9f4' : '#3f5258' }}
          >
            <Code2 size={9} />
            {showSQL ? 'Ocultar SQL' : 'Ver SQL'}
            {showSQL ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
          </button>
          {showSQL && (
            <pre className="mt-1.5 rounded-lg p-2.5 text-[10px] overflow-x-auto"
              style={{ background: 'rgba(0,0,0,0.5)', color: '#2fd9f4', border: '1px solid rgba(47,217,244,0.1)' }}>
              {entry.resultado.sql_generado}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

export default function QueryBar({ onResults, onFlyTo, onClose }: Props) {
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<ChatEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const inputRef  = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  // Focus input when panel opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q || loading) return
    setLoading(true)
    setQuery('')
    try {
      const res = await postDatos(q)
      const entry: ChatEntry = {
        id: Date.now(),
        query: q,
        resultado: res,
        ts: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      }
      setHistory(prev => {
        const next = [...prev.slice(-9), entry]
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
        return next
      })
      if (res.datos.length > 0) {
        const clusters = res.datos.map((d: { cluster: string }) => d.cluster)
        onResults?.(clusters)
        if (clusters[0]) onFlyTo?.(clusters[0])
      }
    } catch {
      const entry: ChatEntry = {
        id: Date.now(),
        query: q,
        resultado: {
          respuesta_ia: 'No se pudo conectar con el agente. Verifica que el backend esté disponible.',
          datos: [],
          fuentes: [],
          sql_generado: null,
        },
        ts: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      }
      setHistory(prev => {
        const next = [...prev.slice(-9), entry]
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setHistory([])
    onResults?.([])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const isEmpty = history.length === 0 && !loading

  return (
    <div
      className="glass shadow-2xl overflow-hidden flex flex-col"
      style={{
        borderRadius: 16,
        maxHeight: 460,
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
      }}
    >
      {/* ── Header ─────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="6.5" stroke="#2fd9f4" strokeWidth="1"/>
          <path d="M4.5 5.5C4.5 4.12 5.62 3 7 3s2.5 1.12 2.5 2.5c0 1.5-1.5 2-1.5 3H6c0-1-.5-1.5-1.5-2.5z" fill="#2fd9f4" fillOpacity=".8"/>
          <circle cx="7" cy="11" r=".75" fill="#2fd9f4"/>
        </svg>
        <span className="flex-1 text-[12px] font-semibold" style={{ color: '#dde4e6', letterSpacing: '-0.01em' }}>
          Consultar IA
        </span>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="text-[10px] px-2 py-0.5 rounded-md transition-opacity hover:opacity-70 mr-1"
            style={{ color: '#3f5258', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            Limpiar
          </button>
        )}
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg transition-opacity hover:opacity-70"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          title="Cerrar"
        >
          <X size={12} style={{ color: '#7a8c91' }} />
        </button>
      </div>

      {/* ── Results / empty state ───────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-glass min-h-0 flex flex-col gap-0">

        {isEmpty && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: '#3f5258' }}>
              Ejemplos
            </p>
            {EJEMPLOS.map(ej => (
              <button
                key={ej}
                onClick={() => { setQuery(ej); inputRef.current?.focus() }}
                className="flex items-center gap-2 w-full text-left text-[11.5px] py-2 transition-all hover:brightness-110"
                style={{ color: '#859397', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span style={{ color: '#3f5258' }}>→</span>
                {ej}
              </button>
            ))}
          </div>
        )}

        {history.map(entry => (
          <EntryBlock key={entry.id} entry={entry} onFlyTo={onFlyTo} />
        ))}

        {/* Loading row */}
        {loading && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={10} style={{ color: '#2fd9f4', flexShrink: 0 }} />
              <p className="text-[11px]" style={{ color: '#3f5258' }}>
                {query || 'Analizando…'}
              </p>
            </div>
            <div className="flex gap-1.5 items-center py-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full animate-bounce"
                  style={{ background: '#2fd9f4', opacity: 0.6, animationDelay: `${i * 150}ms` }}
                />
              ))}
              <span className="text-[11px] ml-1" style={{ color: '#3f5258' }}>Procesando consulta…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Escribe tu pregunta sobre los datos…"
          autoComplete="off"
          disabled={loading}
          className="flex-1 min-w-0 text-[12px] bg-transparent outline-none"
          style={{ color: '#dde4e6', caretColor: '#2fd9f4' }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: query.trim() && !loading ? '#2fd9f4' : 'rgba(255,255,255,0.07)' }}
        >
          <Send size={12} style={{ color: query.trim() && !loading ? '#0c1a1e' : '#3f5258' }} />
        </button>
      </form>
    </div>
  )
}
