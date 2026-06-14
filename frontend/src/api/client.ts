import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
})

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
