export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '—'
  return num.toLocaleString('pt-BR')
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '—'
  return `\${(value * 100).toFixed(decimals)}%`
}

export function formatClusterName(cluster: string): string {
  return cluster.replace(/_/g, ' ')
}
