import type { ReactNode } from 'react'

type Variante = 'primario' | 'secundario' | 'exito' | 'advertencia' | 'error' | 'neutro'

const ESTILOS: Record<Variante, { fondo: string; texto: string; borde: string }> = {
  primario:    { fondo: 'rgba(47,217,244,0.15)',  texto: '#2fd9f4',  borde: 'rgba(47,217,244,0.3)' },
  secundario:  { fondo: 'rgba(133,147,151,0.15)', texto: '#bbc9cd',  borde: 'rgba(133,147,151,0.3)' },
  exito:       { fondo: 'rgba(34,197,94,0.15)',   texto: '#4ade80',  borde: 'rgba(34,197,94,0.3)' },
  advertencia: { fondo: 'rgba(234,179,8,0.15)',   texto: '#fbbf24',  borde: 'rgba(234,179,8,0.3)' },
  error:       { fondo: 'rgba(239,68,68,0.15)',   texto: '#f87171',  borde: 'rgba(239,68,68,0.3)' },
  neutro:      { fondo: 'rgba(255,255,255,0.06)', texto: '#859397',  borde: 'rgba(255,255,255,0.1)' },
}

interface Props {
  children: ReactNode
  variante?: Variante
  className?: string
}

/**
 * Etiqueta visual compacta para mostrar estados, categorías o contadores.
 * Usa el sistema de colores glass de la aplicación.
 */
export default function Badge({ children, variante = 'primario', className = '' }: Props) {
  const { fondo, texto, borde } = ESTILOS[variante]

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${className}`}
      style={{
        background: fondo,
        color:      texto,
        border:     `1px solid ${borde}`,
      }}
    >
      {children}
    </span>
  )
}
