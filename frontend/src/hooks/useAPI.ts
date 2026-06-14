import { useEffect, useState } from 'react'
import { api } from '../api/client'

export function useAPI<T>(url: string, skip?: boolean) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (skip) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.get(url)
        setData(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url, skip])

  return { data, loading, error }
}
