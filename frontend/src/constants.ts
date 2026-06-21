export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const VERTICALES = {
  salud_mental: { label: 'Salud Mental', icon: '❤️‍🩹', color: '#ef4444' },
  empleabilidad: { label: 'Empleabilidad', icon: '💼', color: '#f59e0b' },
  formaciones: { label: 'Formaciones', icon: '📚', color: '#2fd9f4' },
}

export const PERIODOS = {
  MADRUGADA: { label: 'Madrugada', icon: '🌙' },
  MANHA: { label: 'Manhã', icon: '🌅' },
  TARDE: { label: 'Tarde', icon: '☀️' },
  NOITE: { label: 'Noite', icon: '🌆' },
}

/** Colores del mapa según nivel de concentración de usuarios */
export const COLORES_CONCENTRACION = {
  baja: '#22c55e',
  media: '#eab308',
  alta: '#f97316',
  critica: '#ef4444',
  sin_datos: '#6b7280',
} as const

/** Umbrales de usuarios que definen cada nivel de concentración */
export const UMBRALES_CONCENTRACION = {
  baja: 500,
  media: 1_000,
  alta: 2_000,
} as const

/** Colores de acento para capas del mapa y elementos de la UI */
export const COLORES_UI = {
  primario: '#2fd9f4',
  fondo_mapa: '#0c0f0f',
  flujo_od: '#2fd9f4',
  resultado_ia: '#fde047',
  exclusion_3g: '#ef4444',
} as const

/** Versión y metadatos de la aplicación */
export const APP_META = {
  version: '1.0.0',
  nombre: 'App BiT 64',
  ciudad: 'Florianópolis',
  pais: 'Brasil',
} as const
