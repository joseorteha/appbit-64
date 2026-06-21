import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
})

// Interceptor de solicitudes: agrega cabeceras comunes
api.interceptors.request.use(
  (config) => {
    config.headers['Accept'] = 'application/json'
    config.headers['X-App-Version'] = '1.0.0'
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de respuestas: normaliza errores de la API
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const detalle = error.response?.data?.detail ?? error.message

      if (status === 404) {
        return Promise.reject(new Error(`Recurso no encontrado: ${detalle}`))
      }
      if (status === 422) {
        return Promise.reject(new Error(`Datos inválidos enviados al servidor: ${detalle}`))
      }
      if (status && status >= 500) {
        return Promise.reject(new Error(`Error interno del servidor (${status}): ${detalle}`))
      }
    }
    return Promise.reject(error)
  }
)

export async function fetchMapa() {
  const { data } = await api.get('/mapa')
  return data
}

export async function fetchVertical(vertical: string) {
  const { data } = await api.get(`/verticales/${vertical}`)
  return data
}

export async function fetchFlujos(minUsuarios = 300) {
  const { data } = await api.get('/flujos', { params: { min_usuarios: minUsuarios } })
  return data
}

export async function fetchConcentracion(periodo?: string) {
  const { data } = await api.get('/concentracion', { params: periodo ? { periodo } : {} })
  return data
}

export async function fetchCobertura() {
  const { data } = await api.get('/cobertura')
  return data
}

export async function postDatos(consulta: string, filtros?: Record<string, string>) {
  const { data } = await api.post('/datos', { consulta, filtros })
  return data
}

export interface DemograficoItem {
  cluster: string
  income_cluster: string | null
  age_group: string | null
  n_usuarios: number | null
  pct_flagship: number | null
}

export async function fetchDemograficos(age_group?: string): Promise<DemograficoItem[]> {
  const params = age_group ? `?age_group=${encodeURIComponent(age_group)}` : ''
  const { data } = await api.get<DemograficoItem[]>(`/demograficos${params}`)
  return data
}
