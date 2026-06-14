import * as THREE from 'three'
import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'

import { useCamera } from './contexts/CameraContext.jsx'
import { useTimeline } from './contexts/TimelineContext.jsx'
import { useRotation } from './contexts/RotationContext.jsx'
import { useEffectiveModelSettings } from './contexts/useAnimatable.js'
import { Model } from './Model.jsx'

import styles from './ViewCanvas.module.css'

// Drives the camera from the timeline sample when camera tracks exist.
function CameraAnimator({ sampleRef, controlsRef, active }) {
  useFrame(() => {
    if (!active) return
    const controls = controlsRef.current
    if (!controls) return
    const s = sampleRef.current ?? {}
    const z = s['camera.zoom']
    const ox = s['camera.orbitX']
    const oy = s['camera.orbitY']
    if (z === undefined && ox === undefined && oy === undefined) return

    const cam = controls.object
    const sph = new THREE.Spherical().setFromVector3(cam.position)
    const radius = z !== undefined ? 11 - z : sph.radius
    const theta = ox !== undefined ? THREE.MathUtils.degToRad(ox) : sph.theta
    const phi = oy !== undefined ? THREE.MathUtils.degToRad(90 - oy) : sph.phi
    cam.position.setFromSpherical(new THREE.Spherical(radius, phi, theta))
    controls.update()
  })
  return null
}

export function ViewCanvas({ modelRef, modelUrl }) {
  const { cameraRef, controlsRef, glRef, handleZoomChange, handleOrbitChange, orbitX, orbitY, zoom, height } = useCamera()
  const { rotation } = useRotation()
  const { sampleRef, tracks } = useTimeline()
  const modelSettings = useEffectiveModelSettings()

  const isUpdatingFromKnobs = useRef(false)
  const sceneRef = useRef(null)

  const hasCameraTracks = tracks.some(t => t.path.startsWith('camera.') && !t.muted)

  useEffect(() => {
    if (!sceneRef.current) return
    if (modelSettings.transparentBackground) {
      sceneRef.current.background = null
    } else {
      sceneRef.current.background = new THREE.Color(modelSettings.backgroundColor)
    }
  }, [modelSettings.backgroundColor, modelSettings.transparentBackground])

  // Manual orbit knob → camera (only relevant when the timeline isn't driving the camera).
  useEffect(() => {
    if (hasCameraTracks || !controlsRef.current || isUpdatingFromKnobs.current) return
    const controls = controlsRef.current
    const camera = controls.object
    const offset = camera.position.clone().sub(controls.target)
    const sph = new THREE.Spherical().setFromVector3(offset)
    const currentOrbitX = THREE.MathUtils.radToDeg(sph.theta)
    const currentOrbitY = 90 - THREE.MathUtils.radToDeg(sph.phi)
    // Skip if OrbitControls already positioned the camera here (avoids feedback jitter).
    if (Math.abs(currentOrbitX - orbitX) < 0.01 && Math.abs(currentOrbitY - orbitY) < 0.01) return
    isUpdatingFromKnobs.current = true
    const radius = offset.length()
    const theta = THREE.MathUtils.degToRad(orbitX)
    const phi   = THREE.MathUtils.degToRad(90 - orbitY)
    const newOffset = new THREE.Vector3().setFromSpherical(new THREE.Spherical(radius, phi, theta))
    camera.position.copy(controls.target).add(newOffset)
    controls.update()
    isUpdatingFromKnobs.current = false
  }, [orbitX, orbitY, controlsRef, hasCameraTracks])

  // Height shifts the orbit target (and camera in tandem) along Y so the radius is preserved.
  useEffect(() => {
    if (!controlsRef.current) return
    isUpdatingFromKnobs.current = true
    const controls = controlsRef.current
    const prevY = controls.target.y
    const delta = height - prevY
    controls.target.set(0, height, 0)
    controls.object.position.y += delta
    controls.update()
    isUpdatingFromKnobs.current = false
  }, [height, controlsRef])

  useEffect(() => {
    if (hasCameraTracks || !controlsRef.current || isUpdatingFromKnobs.current) return
    const camera = controlsRef.current.object
    const currentZoom = 11 - camera.position.length()
    // Skip if OrbitControls already positioned the camera here (avoids feedback jitter).
    if (Math.abs(currentZoom - zoom) < 0.001) return
    isUpdatingFromKnobs.current = true
    const dir = camera.position.clone().normalize()
    camera.position.copy(dir.multiplyScalar(11 - zoom))
    controlsRef.current.update()
    isUpdatingFromKnobs.current = false
  }, [zoom, controlsRef, hasCameraTracks])

  return (
    <div className={cx(styles.viewCanvas_root, modelSettings.transparentBackground && styles.isTransparent)}>
      <Canvas
        camera={{ position: [0, 0, 11 - zoom], fov: 50 }}
        gl={{ preserveDrawingBuffer: true, alpha: true }}
        shadows={modelSettings.shadows && !modelSettings.wireframe}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ camera, scene, gl }) => {
          cameraRef.current = camera
          sceneRef.current = scene
          glRef.current = gl
          scene.background = modelSettings.transparentBackground ? null : new THREE.Color(modelSettings.backgroundColor)
        }}
      >
        <ambientLight intensity={0.5} />

        {modelSettings.lighting && !modelSettings.wireframe && (
          <spotLight
            position={[5, 5, 5]}
            angle={0.3}
            penumbra={1}
            intensity={modelSettings.lightStrength}
            color={modelSettings.lightColor}
            castShadow={modelSettings.shadows}
            shadow-mapSize={[2048, 2048]}
          />
        )}

        {modelSettings.materialPreset === 'chrome' && (
          <Environment preset='studio' />
        )}

        <Suspense fallback={null}>
          <Model
            ref={modelRef}
            url={modelUrl}
            baseRotation={rotation}
            sampleRef={sampleRef}
            {...{ modelSettings }}
          />
        </Suspense>

        <CameraAnimator sampleRef={sampleRef} controlsRef={controlsRef} active={hasCameraTracks} />

        <OrbitControls
          makeDefault
          ref={controlsRef}
          enabled={!hasCameraTracks}
          enableDamping={false}
          enablePan={false}
          minDistance={1}
          maxDistance={10}
          onChange={() => {
            if (!controlsRef.current || isUpdatingFromKnobs.current || hasCameraTracks) return
            const camera = controlsRef.current.object
            const newZoom = 11 - camera.position.length()
            const spherical = new THREE.Spherical().setFromVector3(camera.position)
            const newOrbitX = THREE.MathUtils.radToDeg(spherical.theta)
            const newOrbitY = 90 - THREE.MathUtils.radToDeg(spherical.phi)
            handleZoomChange(newZoom)
            handleOrbitChange(newOrbitX, newOrbitY)
          }}
        />
      </Canvas>
    </div>
  )
}
