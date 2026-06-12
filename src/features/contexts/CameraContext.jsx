import { createContext, useContext, useState, useCallback, useRef } from 'react'

export const CAMERA_DEFAULTS = { zoom: 5, orbitX: 0, orbitY: 15, height: 0 }

const CameraContext = createContext(null)

export function CameraProvider({ children }) {
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
    <CameraContext.Provider value={{
      zoom, orbitX, orbitY, height,
      setZoom, setOrbitX, setOrbitY, setHeight,
      cameraRef, controlsRef, glRef,
      handleZoomChange, handleOrbitChange, handleHeightChange,
      resetCamera,
    }}>
      {children}
    </CameraContext.Provider>
  )
}

export function useCamera() {
  return useContext(CameraContext)
}
