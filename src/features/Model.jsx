import * as THREE from 'three'
import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

// ─── Ground plane ─────────────────────────────────────────────────────────────

function GroundPlane({ settings, shadows }) {
  const { solid, color, receiveShadows } = settings

  const material = useMemo(() => {
    if (solid) {
      return new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide })
    }
    return new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    })
  }, [solid, color])

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1.5, 0]}
      receiveShadow={receiveShadows && shadows}
      {...{ material }}
    >
      <planeGeometry args={[10, 10, 10, 10]} />
    </mesh>
  )
}

// ─── Model ────────────────────────────────────────────────────────────────────

// When gravity is on the model rests on the ground plane (y = -1.5).
// After normalisation the model's bounding box spans [-1, +1], so its bottom
// sits at y = -1. Shifting by -0.5 lands the bottom exactly on the plane.
const GRAVITY_Y_OFFSET = -0.5

/**
 * @param props.modelSettings effective (base + animated) model settings
 * @param props.baseRotation  static pose per axis in radians { x, y, z }
 * @param props.sampleRef      ref holding the timeline's live sample map
 */
export const Model = forwardRef(function Model({ url, fileType, baseRotation, modelSettings, sampleRef }, ref) {
  const groupRef = useRef(null)
  const [model, setModel] = useState(null)
  const [originalGeometries, setOriginalGeometries] = useState(new Map())
  const yOffsetRef = useRef(0)

  useImperativeHandle(ref, () => groupRef.current, [])

  const { wireframe, resolution, shadows, wireframeColor } = modelSettings
  const tex = modelSettings.texture
  const bump = modelSettings.bumpMap

  useEffect(() => {
    const loader = fileType === 'obj' ? new OBJLoader() : new FBXLoader()
    loader.loadAsync(url).then(loaded => {
      const box = new THREE.Box3().setFromObject(loaded)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const scale = 2 / Math.max(size.x, size.y, size.z)
      loaded.scale.setScalar(scale)
      loaded.position.sub(center.multiplyScalar(scale))

      const geometries = new Map()
      loaded.traverse(child => {
        if (child instanceof THREE.Mesh) {
          geometries.set(child.uuid, child.geometry.clone())
        }
      })
      setOriginalGeometries(geometries)
      setModel(loaded)
    }).catch(err => console.error('Model load error:', err))
  }, [url, fileType])

  // ── Structural rebuild: geometry, material kind, maps. Keyed on coarse props
  //    that genuinely require recreating objects — NOT the per-frame scalars. ──
  useEffect(() => {
    if (!model) return
    const loader = new THREE.TextureLoader()

    model.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const orig = originalGeometries.get(child.uuid)
      if (!orig) return

      const geo = orig.clone()
      const vertCount = Math.floor(orig.attributes.position.count * resolution)
      geo.setDrawRange(0, vertCount)

      const oldWf = child.children.find(c => c instanceof THREE.LineSegments)
      if (oldWf) { oldWf.geometry.dispose(); child.remove(oldWf) }

      if (wireframe) {
        const edges = new THREE.EdgesGeometry(orig)
        edges.setDrawRange(0, Math.floor(edges.attributes.position.count * resolution))
        const wfMat = new THREE.LineBasicMaterial({ color: wireframeColor ?? '#ffffff' })
        const wf = new THREE.LineSegments(edges, wfMat)
        child.add(wf)
        child.material.visible = false
      } else {
        const isChrome = modelSettings.materialPreset === 'chrome'
        const mat = new THREE.MeshStandardMaterial({
          color: isChrome ? '#ffffff' : modelSettings.color,
          metalness: isChrome ? 1 : modelSettings.metalness,
          roughness: isChrome ? 0 : modelSettings.roughness,
          envMapIntensity: isChrome ? 2 : 1,
        })

        if (tex.enabled && tex.url) {
          const map = loader.load(tex.url)
          map.wrapS = THREE.RepeatWrapping
          map.wrapT = THREE.RepeatWrapping
          map.repeat.set(tex.repeat.x * tex.scale, tex.repeat.y * tex.scale)
          map.offset.set(tex.offset.x, tex.offset.y)
          mat.map = map
        }

        if (bump.enabled && bump.url) {
          const normalMap = loader.load(bump.url)
          normalMap.wrapS = THREE.RepeatWrapping
          normalMap.wrapT = THREE.RepeatWrapping
          mat.normalMap = normalMap
          mat.normalScale.set(bump.strength, bump.strength)
        }

        child.material = mat
        child.material.visible = true
      }

      child.geometry = geo
      child.castShadow = shadows && !wireframe
      child.receiveShadow = shadows && !wireframe
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, originalGeometries, wireframe, resolution, shadows, tex.enabled, tex.url, bump.enabled, bump.url, modelSettings.materialPreset])

  // ── Cheap in-place updates for animatable scalars/colours. No object churn. ──
  useEffect(() => {
    if (!model) return
    model.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      if (wireframe) {
        const wf = child.children.find(c => c instanceof THREE.LineSegments)
        if (wf) wf.material.color.set(wireframeColor ?? '#ffffff')
        return
      }
      const mat = child.material
      if (!mat || !mat.isMeshStandardMaterial) return
      const isChrome = modelSettings.materialPreset === 'chrome'
      mat.color.set(isChrome ? '#ffffff' : modelSettings.color)
      mat.roughness = isChrome ? 0 : modelSettings.roughness
      mat.metalness = isChrome ? 1 : modelSettings.metalness
      mat.envMapIntensity = isChrome ? 2 : 1
      if (mat.map) {
        mat.map.repeat.set(tex.repeat.x * tex.scale, tex.repeat.y * tex.scale)
        mat.map.offset.set(tex.offset.x, tex.offset.y)
      }
      if (mat.normalMap) mat.normalScale.set(bump.strength, bump.strength)
    })
  }, [
    model, wireframe, wireframeColor, modelSettings.color, modelSettings.roughness, modelSettings.metalness,
    modelSettings.materialPreset, tex.repeat.x, tex.repeat.y, tex.scale, tex.offset.x, tex.offset.y, bump.strength,
  ])

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return

    const s = sampleRef?.current ?? {}
    const apply = (axis, base) => {
      const sampled = s[`rotation.${axis}`]
      if (sampled !== undefined) {
        g.rotation[axis] = sampled                       // timeline-driven → set directly
      } else {
        g.rotation[axis] += (base - g.rotation[axis]) * 0.3   // ease toward static pose
      }
    }
    apply('x', baseRotation.x)
    apply('y', baseRotation.y)
    apply('z', baseRotation.z)

    const targetY = (modelSettings.gravity ?? false) ? GRAVITY_Y_OFFSET : 0
    yOffsetRef.current += (targetY - yOffsetRef.current) * Math.min(1, delta * 4)
    g.position.y = yOffsetRef.current
  })

  return (
    <>
      {/* Ground plane lives outside the rotating/gravity group so it stays fixed */}
      {modelSettings.showGroundPlane && (
        <GroundPlane
          settings={modelSettings.groundPlane ?? { solid: false, color: '#444444', receiveShadows: true }}
          shadows={modelSettings.shadows}
        />
      )}

      <group ref={groupRef}>
        {model && <primitive object={model} />}
      </group>
    </>
  )
})
