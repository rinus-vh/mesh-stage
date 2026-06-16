import { createContext, useContext } from 'react'

export const ModelSettingsContext = createContext(null)

export function useModelSettingsContext() {
  return useContext(ModelSettingsContext)
}
