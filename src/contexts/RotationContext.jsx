import { createContext, useContext } from 'react'

export const RotationContext = createContext(null)

export function useRotationContext() {
  return useContext(RotationContext)
}
