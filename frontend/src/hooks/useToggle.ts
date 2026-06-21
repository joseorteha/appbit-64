import { useState, useCallback } from 'react'

/**
 * Hook para manejar estados booleanos con funciones de control claras.
 * Evita el patrón repetitivo de `setState(prev => !prev)`.
 *
 * @param valorInicial - Estado inicial del toggle (por defecto `false`)
 * @returns [valor, toggle, setTrue, setFalse]
 */
export function useToggle(
  valorInicial = false,
): [boolean, () => void, () => void, () => void] {
  const [valor, setValor] = useState(valorInicial)

  const toggle   = useCallback(() => setValor(v => !v), [])
  const setTrue  = useCallback(() => setValor(true), [])
  const setFalse = useCallback(() => setValor(false), [])

  return [valor, toggle, setTrue, setFalse]
}
