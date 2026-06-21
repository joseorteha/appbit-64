interface Props {
  /** Tamaño del spinner en píxeles (por defecto 32) */
  size?: number
  /** Color del borde activo (por defecto el cyan de la app) */
  color?: string
  /** Texto opcional debajo del spinner */
  mensaje?: string
}

/**
 * Spinner de carga reutilizable con tamaño y color configurables.
 * Mantiene coherencia visual con el diseño glass de la aplicación.
 */
export default function LoadingSpinner({
  size = 32,
  color = '#2fd9f4',
  mensaje,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="rounded-full border-2 animate-spin"
        style={{
          width:          size,
          height:         size,
          borderColor:    color,
          borderTopColor: 'transparent',
        }}
      />
      {mensaje && (
        <p className="text-xs" style={{ color: '#859397' }}>
          {mensaje}
        </p>
      )}
    </div>
  )
}
