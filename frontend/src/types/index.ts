export interface Antena {
  ecgi: string
  cluster: string
  municipio: string | null
  lat: number
  lon: number
}

export interface MapaResponse {
  antenas: Antena[]
  clusters: string[]
  total_antenas: number
}

export interface Indicador {
  cluster: string
  metrica: string
  valor: number
  periodo: string | null
  fuente: string | null
  es_sintetico: boolean
}

export interface PontoFluxo {
  lat: number
  lon: number
  cluster: string | null
}

// Backend returns Portuguese field names (origem/destino)
export interface Flujo {
  origem: PontoFluxo
  destino: PontoFluxo
  n_usuarios: number
  dist_km: number | null
  periodo_predominante: string | null
}

export interface ConcentracionItem {
  ecgi: string | null
  cluster: string | null
  municipio: string | null
  lat: number | null
  lon: number | null
  day_date: string | null
  periodo: string
  n_usuarios: number | null
  congestionamento_medio: number | null
  drop_pct_medio: number | null
  n_sessoes?: number | null
  download_bytes?: number | null
  upload_bytes?: number | null
}

export interface CoberturaItem {
  cluster: string
  total_sessoes: number | null
  pct_3g: number | null
  pct_4g: number | null
  pct_5g: number | null
  drop_pct_medio: number | null
  congestionamento_medio: number | null
  download_gb: number | null
}

export interface DatoItem {
  cluster: string
  valor: number
  metrica: string
  fuente: string
}

export interface DatosResponse {
  respuesta_ia: string
  datos: DatoItem[]
  fuentes: string[]
  sql_generado: string | null
}

export type Vertical = 'salud_mental' | 'empleabilidad' | 'formaciones'
export type Periodo = 'MADRUGADA' | 'MANHA' | 'TARDE' | 'NOITE'

export interface VerticalConfig {
  id: Vertical
  label: string
  icon: string
  color: string
  descripcion: string
}

export interface AppConfig {
  version: string
  nombre: string
  ciudad: string
  pais: string
}
