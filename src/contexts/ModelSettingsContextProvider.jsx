import { useCallback, useRef, useState } from 'react'

import { MODEL_DEFAULTS } from '@/constants/modelSettings.js'
import { ModelSettingsContext } from './ModelSettingsContext.jsx'

export function ModelSettingsContextProvider({ children }) {
  const [modelSettings, setModelSettings] = useState(MODEL_DEFAULTS)

  // Tracks whether backgroundColor has ever been explicitly set by the user.
  // When false, theme changes are allowed to update the background automatically.
  const backgroundIsDefaultRef = useRef(true)
  const [backgroundIsDefault, setBackgroundIsDefault] = useState(true)

  // Same pattern for ground plane color.
  const groundPlaneColorIsDefaultRef = useRef(true)
  const [groundPlaneColorIsDefault, setGroundPlaneColorIsDefault] = useState(true)

  const update = useCallback((patch) => {
    if ('backgroundColor' in patch) {
      backgroundIsDefaultRef.current = false
      setBackgroundIsDefault(false)
    }
    if (patch.groundPlane && 'color' in patch.groundPlane) {
      groundPlaneColorIsDefaultRef.current = false
      setGroundPlaneColorIsDefault(false)
    }
    setModelSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const reset = useCallback(() => {
    backgroundIsDefaultRef.current = true
    setBackgroundIsDefault(true)
    groundPlaneColorIsDefaultRef.current = true
    setGroundPlaneColorIsDefault(true)
    setModelSettings(MODEL_DEFAULTS)
  }, [])

  // Called when the theme changes. Only updates backgroundColor if the user
  // hasn't explicitly overridden it.
  const resetToThemeBackground = useCallback((themeColor) => {
    if (backgroundIsDefaultRef.current) {
      setModelSettings(prev => ({ ...prev, backgroundColor: themeColor }))
    }
  }, [])

  // Called when the user explicitly resets the background to the theme default.
  const resetBackground = useCallback((themeColor) => {
    backgroundIsDefaultRef.current = true
    setBackgroundIsDefault(true)
    setModelSettings(prev => ({ ...prev, backgroundColor: themeColor }))
  }, [])

  // Called when the theme changes. Only updates ground plane color if the user
  // hasn't explicitly overridden it.
  const resetToThemeGroundPlane = useCallback((themeColor) => {
    if (groundPlaneColorIsDefaultRef.current) {
      setModelSettings(prev => ({
        ...prev,
        groundPlane: { ...prev.groundPlane, color: themeColor },
      }))
    }
  }, [])

  // Called when the user explicitly resets the ground plane to the theme default.
  const resetGroundPlane = useCallback((themeColor) => {
    groundPlaneColorIsDefaultRef.current = true
    setGroundPlaneColorIsDefault(true)
    setModelSettings(prev => ({
      ...prev,
      groundPlane: { ...prev.groundPlane, color: themeColor },
    }))
  }, [])

  return (
    <ModelSettingsContext.Provider value={{
      modelSettings, update, reset,
      backgroundIsDefault, resetToThemeBackground, resetBackground,
      groundPlaneColorIsDefault, resetToThemeGroundPlane, resetGroundPlane,
    }}>
      {children}
    </ModelSettingsContext.Provider>
  )
}
