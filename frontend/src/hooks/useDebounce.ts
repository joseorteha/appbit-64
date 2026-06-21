import { useState, useEffect } from 'react'

/**
 * Retrasa la actualización de un valor hasta que el usuario deje de
 * modificarlo durante `delay` milisegundos. Útil para evitar llamadas
 * excesivas a la API al escribir en campos de búsqueda.
 *
 * @param valor - El valor que se quiere debounce-ar
 * @param delay - Tiempo en ms antes de propagar el nuevo valor (por defecto 400ms)
 */
export function useDebounce<T>(valor: T, delay = 400): T {
  const [valorDebounced, setValorDebounced] = useState<T>(valor)

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setValorDebounced(valor)
    }, delay)

    return () => clearTimeout(temporizador)
  }, [valor, delay])

  return valorDebounced
}
