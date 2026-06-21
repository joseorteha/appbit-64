import { AlertTriangle, X, RefreshCw } from 'lucide-react'

interface Props {
  mensaje: string
  /** Texto del botón de reintento. Si se omite, no se muestra el botón. */
  onReintentar?: () => void
  /** Callback al cerrar el banner */
  onCerrar?: () => void
  /** Contexto opcional para ayudar al usuario a diagnosticar el error */
  contexto?: string
}

/**
 * Banner de error que se muestra cuando falla una llamada a la API.
 * Ofrece acciones de reintento y cierre de forma clara.
 */
export default function ErrorBanner({ mensaje, onReintentar, onCerrar, contexto }: Props) {
  return (
    <div
      className="flex items-start gap-3 rounded-squircle p-3 text-xs"
      role="alert"
      style={{
        background: 'rgba(239,68,68,0.08)',
        border:     '1px solid rgba(239,68,68,0.25)',
      }}
    >
      <AlertTriangle
        size={16}
        strokeWidth={2}
        className="shrink-0 mt-0.5"
        style={{ color: '#f87171' }}
      />

      <div className="flex-1 min-w-0">
        <p style={{ color: '#fca5a5' }}>{mensaje}</p>
        {contexto && (
          <p className="mt-1 text-[10px]" style={{ color: '#859397' }}>
            {contexto}
          </p>
        )}
        {onReintentar && (
          <button
            onClick={onReintentar}
            className="mt-2 flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ color: '#f87171' }}
          >
            <RefreshCw size={11} />
            <span>Reintentar</span>
          </button>
        )}
      </div>

      {onCerrar && (
        <button
          onClick={onCerrar}
          className="shrink-0 hover:opacity-60 transition-opacity"
          style={{ color: '#859397' }}
          aria-label="Cerrar error"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
