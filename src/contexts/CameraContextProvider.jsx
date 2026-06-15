import { useCallback, useRef, useState } from 'react'

import { CAMERA_DEFAULTS } from '@/constants/cameraDefaults.js'
import { CameraContext } from './CameraContext.jsx'

export function CameraContextProvider({ children }) {
  const [zoom,   setZoom]   = useState(CAMERA_DEFAULTS.zoom)
  const [orbitX, setOrbitX] = useState(CAMERA_DEFAULTS.orbitX)
  const [orbitY, setOrbitY] = useState(CAMERA_DEFAULTS.orbitY)
  const [height, setHeight] = useState(CAMERA_DEFAULTS.height)

  const cameraRef   = useRef(null)
  const controlsRef = useRef(null)
  const glRef       = useRef(null)  // WebGLRenderer — domElement is the <canvas> for export

  const handleZoomChange   = useCallback((z)    => setZoom(z),         [])
  const handleOrbitChange  = useCallback((x, y) => { setOrbitX(x); setOrbitY(y) }, [])
  const handleHeightChange = useCallback((h)    => setHeight(h),       [])

  const resetCamera = useCallback(() => {
    setZoom(CAMERA_DEFAULTS.zoom)
    setOrbitX(CAMERA_DEFAULTS.orbitX)
    setOrbitY(CAMERA_DEFAULTS.orbitY)
    setHeight(CAMERA_DEFAULTS.height)
  }, [])

  return (
    <CameraContext.Provider
      value={{
        zoom, orbitX, orbitY, height,
        setZoom, setOrbitX, setOrbitY, setHeight,
        cameraRef, controlsRef, glRef,
        handleZoomChange, handleOrbitChange, handleHeightChange,
        resetCamera,
      }}
    >
      {children}
    </CameraContext.Provider>
  )
}
