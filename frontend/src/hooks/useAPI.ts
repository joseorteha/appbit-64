import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../api/client'

interface UseAPIOptions {
  /** Parámetros de query string que se envían con la petición GET */
  params?: Record<string, string | number | boolean | undefined>
  /** Si es `true`, no se ejecuta la petición automáticamente */
  skip?: boolean
}

interface UseAPIResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** Lanza manualmente una nueva petición conservando la URL y params actuales */
  refetch: () => void
}

/**
 * Hook genérico para consumir endpoints GET de la API.
 * Soporta parámetros de consulta, omisión condicional y refetch manual.
 */
export function useAPI<T>(url: string, options: UseAPIOptions = {}): UseAPIResult<T> {
  const { params, skip } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Usamos un contador para forzar re-fetch sin cambiar la URL ni los params
  const [refetchCount, setRefetchCount] = useState(0)

  // Ref para cancelar peticiones en vuelo cuando el componente se desmonta
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (skip) return

    // Cancelar cualquier petición anterior en vuelo
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const response = await api.get<T>(url, {
        params,
        signal: abortControllerRef.current.signal,
      })
      setData(response.data)
    } catch (err) {
      // No reportar errores de cancelación intencional
      if (err instanceof Error && err.name === 'CanceledError') return
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [url, params, skip, refetchCount]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [fetchData])

  const refetch = useCallback(() => setRefetchCount((c) => c + 1), [])

  return { data, loading, error, refetch }
}
