import { useState, useEffect } from 'react'

/**
 * Hook para persistir y leer valores en localStorage con tipado genérico.
 * Sincroniza automáticamente cuando cambia la clave o el valor en otros tabs.
 */
export function useLocalStorage<T>(clave: string, valorInicial: T): [T, (valor: T) => void] {
  const [valor, setValorEstado] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(clave)
      return item ? (JSON.parse(item) as T) : valorInicial
    } catch {
      return valorInicial
    }
  })

  const setValor = (nuevoValor: T) => {
    try {
      setValorEstado(nuevoValor)
      window.localStorage.setItem(clave, JSON.stringify(nuevoValor))
    } catch (error) {
      console.error(`Error al guardar en localStorage la clave "${clave}":`, error)
    }
  }

  // Sincronizar con otros tabs/ventanas del navegador
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === clave && e.newValue !== null) {
        try {
          setValorEstado(JSON.parse(e.newValue) as T)
        } catch {
          // valor inválido, ignorar
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [clave])

  return [valor, setValor]
}
