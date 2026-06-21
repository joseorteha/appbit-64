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
/**
 * Convierte bytes a una cadena legible (KB, MB, GB).
 * Útil para mostrar el uso de datos de las antenas.
 */
export function formatBytes(bytes: number | null | undefined, decimales = 1): string {
  if (bytes === null || bytes === undefined) return '—'
  if (bytes === 0) return '0 B'
  const unidades = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024))
  const valor = bytes / Math.pow(1024, i)
  return `${valor.toFixed(decimales)} ${unidades[i]}`
}

/**
 * Convierte gigabytes a una cadena legible.
 * Los datos de cobertura del backend ya vienen en GB.
 */
export function formatGB(gb: number | null | undefined, decimales = 2): string {
  if (gb === null || gb === undefined) return '—'
  return `${gb.toFixed(decimales)} GB`
}

export function getConcentracionLabel(nUsuarios: number | null | undefined): string {
  if (nUsuarios === null || nUsuarios === undefined) return 'Desconocida'
  if (nUsuarios < 500) return 'Baja'
  if (nUsuarios < 1000) return 'Media'
  if (nUsuarios < 2000) return 'Alta'
  return 'Crítica'
}
