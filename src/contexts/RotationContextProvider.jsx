import { useCallback, useState } from 'react'

import { ROTATION_DEFAULTS } from '@/constants/rotationDefaults.js'
import { RotationContext } from './RotationContext.jsx'

export function RotationContextProvider({ children }) {
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
