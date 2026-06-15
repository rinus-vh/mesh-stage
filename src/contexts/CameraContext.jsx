import { createContext, useContext } from 'react'

export const CameraContext = createContext(null)

export function useCameraContext() {
  return useContext(CameraContext)
}
