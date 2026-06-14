import { Settings, Trash2 } from 'lucide-react'
import {
  PanelContainer, PanelContainerSettingsRow, PanelContainerDivider,
  PanelContainerSettingsSectionHeader,
  ActionIconButton,
  GhostButton, Knob, Slider, Checkbox, ColorInput,
} from '@6njp/prototype-library'

import { useRotation, ROTATION_DEFAULTS } from './contexts/RotationContext.jsx'
import { useCamera, CAMERA_DEFAULTS } from './contexts/CameraContext.jsx'
import { useModelSettings, MODEL_DEFAULTS } from './contexts/ModelSettingsContext.jsx'
import { useTimeline } from './contexts/TimelineContext.jsx'
import { useAnimatableModelSettings } from './contexts/useAnimatable.js'
import { AnimatableRow } from './panels/AnimatableRow.jsx'
import animatableStyles from './panels/AnimatableRow.module.css'

import styles from './SettingsContent.module.css'

const AXES = [
  { key: 'x', label: 'X' },
  { key: 'y', label: 'Y' },
  { key: 'z', label: 'Z' },
]

// Settings that belong to the Model section (for dirty detection).
const MODEL_SECTION_KEYS = [
  'wireframe', 'wireframeColor', 'lighting', 'lightColor', 'lightStrength',
  'shadows', 'color', 'roughness', 'metalness', 'resolution', 'texture', 'bumpMap',
]
// Settings that belong to the Scene section.
const SCENE_SECTION_KEYS = ['showGroundPlane', 'groundPlane', 'gravity']

function deepEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== 'object') return a === b
  const ka = Object.keys(a), kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every(k => deepEqual(a[k], b[k]))
}

export function SettingsContent({ isDark, onOpenWireframe, onOpenLighting, onOpenMaterial, onOpenTexture, onOpenBumpMap, onOpenExport, onOpenGroundPlane, onDiscardModel }) {
  // Effective (animated) settings for display; base for dirty checks / resets.
  const { modelSettings, update } = useAnimatableModelSettings()
  const { modelSettings: base, update: baseUpdate, backgroundIsDefault, resetBackground, groundPlaneColorIsDefault, resetGroundPlane } = useModelSettings()
  const { rotation, setAxisDeg, resetRotation } = useRotation()
  const { zoom, orbitX, orbitY, height, handleZoomChange, handleOrbitChange, handleHeightChange, resetCamera, controlsRef } = useCamera()
  const { tracks, record, liveSample, removeTrack } = useTimeline()

  const themeDefaultBg = isDark ? '#111111' : '#ffffff'

  // ── Live timeline-driven display values ─────────────────────────────────────
  const liveRotX = liveSample['rotation.x'] !== undefined ? (liveSample['rotation.x'] * 180) / Math.PI : (rotation.x * 180) / Math.PI
  const liveRotY = liveSample['rotation.y'] !== undefined ? (liveSample['rotation.y'] * 180) / Math.PI : (rotation.y * 180) / Math.PI
  const liveRotZ = liveSample['rotation.z'] !== undefined ? (liveSample['rotation.z'] * 180) / Math.PI : (rotation.z * 180) / Math.PI

  const liveZoom   = liveSample['camera.zoom']   !== undefined ? liveSample['camera.zoom']   : zoom
  const liveOrbitX = liveSample['camera.orbitX'] !== undefined ? liveSample['camera.orbitX'] : orbitX
  const liveOrbitY = liveSample['camera.orbitY'] !== undefined ? liveSample['camera.orbitY'] : orbitY

  // ── Dirty detection ──────────────────────────────────────────────────────────
  const isRotationDirty = rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0

  const isModelDirty = MODEL_SECTION_KEYS.some(k =>
    typeof MODEL_DEFAULTS[k] === 'object'
      ? !deepEqual(base[k], MODEL_DEFAULTS[k])
      : base[k] !== MODEL_DEFAULTS[k]
  )

  const isCameraDirty = (
    Math.abs(zoom   - CAMERA_DEFAULTS.zoom)   > 0.001 ||
    Math.abs(orbitX - CAMERA_DEFAULTS.orbitX) > 0.001 ||
    Math.abs(orbitY - CAMERA_DEFAULTS.orbitY) > 0.001 ||
    Math.abs(height - CAMERA_DEFAULTS.height) > 0.001
  )

  const isSceneDirty = (
    !backgroundIsDefault ||
    !groundPlaneColorIsDefault ||
    SCENE_SECTION_KEYS.some(k => {
      if (k === 'groundPlane') {
        // Color is tracked separately via groundPlaneColorIsDefault; only compare
        // the non-color fields here to avoid false positives from theme switching.
        const { color: _a, ...baseRest } = base.groundPlane ?? {}
        const { color: _b, ...defaultRest } = MODEL_DEFAULTS.groundPlane
        return !deepEqual(baseRest, defaultRest)
      }
      return typeof MODEL_DEFAULTS[k] === 'object'
        ? !deepEqual(base[k], MODEL_DEFAULTS[k])
        : base[k] !== MODEL_DEFAULTS[k]
    })
  )

  // ── Helpers ──────────────────────────────────────────────────────────────────
  // Remove every timeline track whose path equals or starts with one of the given prefixes.
  const clearTracks = (prefixes) => {
    tracks
      .filter(t => prefixes.some(p => t.path === p || t.path.startsWith(p + '.')))
      .forEach(t => removeTrack(t.id))
  }

  // ── Reset handlers ───────────────────────────────────────────────────────────
  const handleResetRotation = () => {
    resetRotation()
    clearTracks(['rotation'])
  }

  const handleResetModel = () => {
    baseUpdate({
      wireframe: MODEL_DEFAULTS.wireframe,
      wireframeColor: MODEL_DEFAULTS.wireframeColor,
      lighting: MODEL_DEFAULTS.lighting,
      lightColor: MODEL_DEFAULTS.lightColor,
      lightStrength: MODEL_DEFAULTS.lightStrength,
      shadows: MODEL_DEFAULTS.shadows,
      color: MODEL_DEFAULTS.color,
      roughness: MODEL_DEFAULTS.roughness,
      metalness: MODEL_DEFAULTS.metalness,
      resolution: MODEL_DEFAULTS.resolution,
      texture: MODEL_DEFAULTS.texture,
      bumpMap: MODEL_DEFAULTS.bumpMap,
    })
    clearTracks([
      'model.wireframe', 'model.wireframeColor',
      'model.lighting', 'model.shadows', 'model.lightColor', 'model.lightStrength',
      'model.color', 'model.roughness', 'model.metalness', 'model.resolution',
      'model.texture', 'model.bumpMap',
    ])
  }

  const handleResetCamera = () => {
    resetCamera()
    clearTracks(['camera'])
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }

  const handleResetScene = () => {
    const themeDefaultGroundPlaneColor = isDark ? '#ffffff' : '#000000'
    baseUpdate({
      showGroundPlane: MODEL_DEFAULTS.showGroundPlane,
      groundPlane: { ...MODEL_DEFAULTS.groundPlane, color: themeDefaultGroundPlaneColor },
      gravity: MODEL_DEFAULTS.gravity,
    })
    resetBackground(themeDefaultBg)
    resetGroundPlane(themeDefaultGroundPlaneColor)
    clearTracks(['model.backgroundColor', 'model.showGroundPlane', 'model.groundPlane', 'model.gravity'])
  }

  // ── Change handlers ──────────────────────────────────────────────────────────
  const onAxisChange = (axis, deg) => {
    setAxisDeg(axis, deg)
    record(`rotation.${axis}`, `Rotation ${axis.toUpperCase()}`, (deg * Math.PI) / 180)
  }

  const onZoom = (z) => {
    handleZoomChange(z)
    record('camera.zoom', 'Zoom', z)
  }

  const onOrbit = (x, y) => {
    handleOrbitChange(x, y)
    record('camera.orbitX', 'Orbit X', x)
    record('camera.orbitY', 'Orbit Y', y)
  }

  const onHeight = (h) => {
    handleHeightChange(h)
    record('camera.height', 'Camera Height', h)
  }

  return (
    <div className={styles.component}>
      <Section title='Rotation' dirty={isRotationDirty} onReset={handleResetRotation}>
        <div className={styles.axisRow}>
          {AXES.map(({ key, label }) => (
            <div key={key} className={styles.axisCol}>
              <Knob
                value={Math.round(key === 'x' ? liveRotX : key === 'y' ? liveRotY : liveRotZ)}
                onChange={(v) => onAxisChange(key, v)}
                min={-180}
                max={180}
                step={1}
                {...{ label }}
              />
              <TrackDot path={`rotation.${key}`} />
            </div>
          ))}
        </div>
      </Section>

      <Section title='Model' dirty={isModelDirty} onReset={handleResetModel}>
        <PanelContainer>
          <AnimatableRow label='Wireframe' path='model.wireframe' value={modelSettings.wireframe} defaultValue={MODEL_DEFAULTS.wireframe} onReset={() => update({ wireframe: MODEL_DEFAULTS.wireframe })}>
            <Checkbox checked={modelSettings.wireframe} onChange={v => update({ wireframe: v })} />
            <SettingsButton onClick={onOpenWireframe} title='Wireframe settings' />
          </AnimatableRow>

          <AnimatableRow label='Lighting' path='model.lighting' value={modelSettings.lighting} defaultValue={MODEL_DEFAULTS.lighting} onReset={() => update({ lighting: MODEL_DEFAULTS.lighting })}>
            <Checkbox checked={modelSettings.lighting} onChange={v => update({ lighting: v })} />
            <SettingsButton onClick={onOpenLighting} title='Lighting settings' />
          </AnimatableRow>

          <PanelContainerSettingsRow label='Material'>
            <SettingsButton onClick={onOpenMaterial} title='Material settings' />
          </PanelContainerSettingsRow>

          <PanelContainerSettingsRow label='Texture'>
            <SettingsButton onClick={onOpenTexture} title='Texture settings' />
          </PanelContainerSettingsRow>

          <PanelContainerSettingsRow label='Bump Map'>
            <SettingsButton onClick={onOpenBumpMap} title='Bump map settings' />
          </PanelContainerSettingsRow>
        </PanelContainer>

        <div className={styles.sliderRow}>
          <TrackDot path='model.resolution' dotClassName={styles.sliderDot} />
          <Slider
            value={base.resolution}
            onChange={(v) => { baseUpdate({ resolution: v }); record('model.resolution', 'Resolution', v) }}
            min={0.1}
            max={1}
            step={0.1}
            label='Resolution'
          />
        </div>

      </Section>

      <Section title='Camera' dirty={isCameraDirty} onReset={handleResetCamera}>
        <div className={styles.knobRow}>
          <div className={styles.axisCol}>
            <Knob
              value={parseFloat(liveZoom.toFixed(1))}
              onChange={onZoom}
              min={1}
              max={10}
              step={0.1}
              label='Zoom'
            />
            <TrackDot path='camera.zoom' />
          </div>
          <div className={styles.axisCol}>
            <Knob
              value={Math.round(liveOrbitX)}
              onChange={(x) => onOrbit(x, orbitY)}
              min={-180}
              max={180}
              step={1}
              label='Orbit X'
            />
            <TrackDot path='camera.orbitX' />
          </div>
          <div className={styles.axisCol}>
            <Knob
              value={Math.round(liveOrbitY)}
              onChange={(y) => onOrbit(orbitX, y)}
              min={-89}
              max={89}
              step={1}
              label='Orbit Y'
            />
            <TrackDot path='camera.orbitY' />
          </div>
          <div className={styles.axisCol}>
            <Knob
              value={parseFloat(height.toFixed(1))}
              onChange={onHeight}
              min={-3}
              max={3}
              step={0.1}
              label='Height'
            />
            <TrackDot path='camera.height' />
          </div>
        </div>
      </Section>

      <Section title='Scene' dirty={isSceneDirty} onReset={handleResetScene}>
        <PanelContainer>
          <PanelContainerSettingsRow label='Transparent'>
            <Checkbox
              checked={modelSettings.transparentBackground ?? false}
              onChange={v => update({ transparentBackground: v })}
            />
          </PanelContainerSettingsRow>

          <AnimatableRow label='Background' path='model.backgroundColor' value={modelSettings.backgroundColor} defaultValue={MODEL_DEFAULTS.backgroundColor} onReset={() => update({ backgroundColor: MODEL_DEFAULTS.backgroundColor })}>
            <ColorInput
              value={modelSettings.backgroundColor}
              onChange={v => update({ backgroundColor: v })}
            />
          </AnimatableRow>

          <AnimatableRow label='Ground plane' path='model.showGroundPlane' value={modelSettings.showGroundPlane} defaultValue={MODEL_DEFAULTS.showGroundPlane} onReset={() => update({ showGroundPlane: MODEL_DEFAULTS.showGroundPlane })}>
            <Checkbox checked={modelSettings.showGroundPlane} onChange={value => update({ showGroundPlane: value })} />
            <SettingsButton onClick={onOpenGroundPlane} title='Ground plane settings' />
          </AnimatableRow>

          <PanelContainerSettingsRow label='Gravity'>
            <Checkbox checked={modelSettings.gravity ?? false} onChange={value => update({ gravity: value })} />
          </PanelContainerSettingsRow>
        </PanelContainer>
      </Section>

      <div className={styles.bottomActions}>
        <GhostButton
          label='Export settings'
          icon={Settings}
          color='white'
          onClick={onOpenExport}
          layoutClassName={styles.bottomActionLayout}
        />
        {onDiscardModel && (
          <GhostButton
            label='Discard model'
            icon={Trash2}
            color='orange'
            onClick={onDiscardModel}
            layoutClassName={styles.bottomActionLayout}
          />
        )}
      </div>
    </div>
  )
}

// A standalone track indicator dot (same visual as AnimatableRow's dot) for use
// outside of PanelContainerSettingsRow — e.g. above a Knob in a grid layout.
function TrackDot({ path, dotClassName }) {
  const { tracks, setTrackMuted } = useTimeline()
  const track = path ? tracks.find(t => t.path === path) : null
  if (!track) return null
  return (
    <button
      type='button'
      className={cx(animatableStyles.dot, track.muted && animatableStyles.dotMuted, dotClassName)}
      onClick={() => setTrackMuted(track.id, !track.muted)}
      title={track.muted ? 'Track disabled — click to reactivate' : 'Has keyframes — click to disable track'}
    />
  )
}

function SettingsButton({ onClick, title }) {
  return (
    <ActionIconButton
      icon={Settings}
      size={20}
      style='outline'
      {...{ onClick, title }}
    />
  )
}

function Section({ title, children, dirty = false, onReset }) {
  return (
    <div className={styles.componentSection}>
      <PanelContainerSettingsSectionHeader
        {...{ title, onReset }}
        isDirty={dirty}
      />
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}
