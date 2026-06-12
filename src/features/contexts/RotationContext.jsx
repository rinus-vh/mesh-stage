import { createContext, useContext, useState, useCallback } from 'react'

export const ROTATION_DEFAULTS = { x: 0, y: 0, z: 0 }

const RotationContext = createContext(null)

export function RotationProvider({ children }) {
  const [rotation, setRotation] = useState(ROTATION_DEFAULTS)

  const setAxisDeg = useCallback((axis, deg) => {
    setRotation(prev => ({ ...prev, [axis]: (deg * Math.PI) / 180 }))
  }, [])

  const resetRotation = useCallback(() => {
    setRotation(ROTATION_DEFAULTS)
  }, [])

  return (
    <RotationContext.Provider value={{ rotation, setAxisDeg, resetRotation }}>
      {children}
    </RotationContext.Provider>
  )
}

export function useRotation() {
  return useContext(RotationContext)
}
