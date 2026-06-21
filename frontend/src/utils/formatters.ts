export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '—'
  return num.toLocaleString('pt-BR')
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '—'
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatClusterName(cluster: string): string {
  return cluster.replace(/_/g, ' ')
}

/**
 * Devuelve el color hex correspondiente al nivel de concentración de usuarios.
 * Coincide con la leyenda visual del mapa interactivo.
 */
export function getConcentracionColor(nUsuarios: number | null | undefined): string {
  if (nUsuarios === null || nUsuarios === undefined) return '#6b7280'
  if (nUsuarios < 500) return '#22c55e' // Baja
  if (nUsuarios < 1000) return '#eab308' // Media
  if (nUsuarios < 2000) return '#f97316' // Alta
  return '#ef4444' // Crítica
}

/**
 * Devuelve la etiqueta textual del nivel de concentración.
 */
export function getConcentracionLabel(nUsuarios: number | null | undefined): string {
  if (nUsuarios === null || nUsuarios === undefined) return 'Desconocida'
  if (nUsuarios < 500) return 'Baja'
  if (nUsuarios < 1000) return 'Media'
  if (nUsuarios < 2000) return 'Alta'
  return 'Crítica'
}
