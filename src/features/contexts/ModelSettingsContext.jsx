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
  groundPlane: { solid: false, color: '#444444', receiveShadows: true },
  gravity: false,
  texture: { enabled: false, url: '', scale: 1, repeat: { x: 1, y: 1 }, offset: { x: 0, y: 0 } },
  bumpMap: { enabled: false, url: '', strength: 0.5 },
}

const ModelSettingsContext = createContext(null)

export function ModelSettingsProvider({ children }) {
  const [modelSettings, setModelSettings] = useState(MODEL_DEFAULTS)

  // Tracks whether backgroundColor has ever been explicitly set by the user.
  // When false, theme changes are allowed to update the background automatically.
  const backgroundIsDefaultRef = useRef(true)
  const [backgroundIsDefault, setBackgroundIsDefault] = useState(true)

  const update = useCallback((patch) => {
    if ('backgroundColor' in patch) {
      backgroundIsDefaultRef.current = false
      setBackgroundIsDefault(false)
    }
    setModelSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const reset = useCallback(() => {
    backgroundIsDefaultRef.current = true
    setBackgroundIsDefault(true)
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

  return (
    <ModelSettingsContext.Provider value={{ modelSettings, update, reset, backgroundIsDefault, resetToThemeBackground, resetBackground }}>
      {children}
    </ModelSettingsContext.Provider>
  )
}

export function useModelSettings() {
  return useContext(ModelSettingsContext)
}
