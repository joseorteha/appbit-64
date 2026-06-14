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
