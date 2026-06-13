import { createContext, useContext, useState, useCallback, useRef } from 'react'

export const MODEL_DEFAULTS = {
  wireframe: false,
  wireframeColor: '#ffffff',
  color: '#ffffff',
  roughness: 0.5,
  metalness: 0.5,
  resolution: 1,
  lighting: false,
  shadows: false,
  lightColor: '#ffffff',
  lightStrength: 2,
  backgroundColor: '#111111',
  showGroundPlane: false,
  groundPlane: { solid: false, color: '#ffffff', receiveShadows: true },
  gravity: false,
  texture: { enabled: false, url: '', scale: 1, repeat: { x: 1, y: 1 }, offset: { x: 0, y: 0 } },
  bumpMap: { enabled: false, url: '', strength: 0.5 },
}

// Theme defaults that diverge from MODEL_DEFAULTS (which uses the dark theme value).
export const GROUND_PLANE_THEME_COLORS = { dark: '#ffffff', light: '#000000' }

const ModelSettingsContext = createContext(null)

export function ModelSettingsProvider({ children }) {
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

export function useModelSettings() {
  return useContext(ModelSettingsContext)
}
