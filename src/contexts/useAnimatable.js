import { useCallback, useMemo } from 'react'

import { setByPath } from '@/machinery/interpolate.js'
import { useModelSettingsContext } from './ModelSettingsContext.jsx'
import { useTimelineContext } from './TimelineContext.jsx'

// Nice track labels for model.* paths (fallback is the raw leaf path).
const MODEL_LABELS = {
  'model.color': 'Material Color',
  'model.roughness': 'Roughness',
  'model.metalness': 'Metalness',
  'model.wireframeColor': 'Wireframe Color',
  'model.lightColor': 'Light Color',
  'model.lightStrength': 'Light Strength',
  'model.backgroundColor': 'Background',
  'model.resolution': 'Resolution',
  'model.texture.scale': 'Texture Scale',
  'model.texture.repeat.x': 'Texture Repeat X',
  'model.texture.repeat.y': 'Texture Repeat Y',
  'model.texture.offset.x': 'Texture Offset X',
  'model.texture.offset.y': 'Texture Offset Y',
  'model.bumpMap.strength': 'Bump Strength',
  'model.groundPlane.color': 'Ground Color',
}

function flatten(patch, prefix = '') {
  const out = []
  for (const [k, v] of Object.entries(patch)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flatten(v, path))
    else out.push([path, v])
  }
  return out
}

/**
 * Like useModelSettingsContext, but:
 * - Returns effective (timeline-merged) settings so the panel UI reflects the current
 *   animated state as the playhead moves.
 * - Every change also records a keyframe at the current playhead (no-op while playing,
 *   or when the recording toggle is off).
 */
export function useAnimatableModelSettings() {
  const { update: baseUpdate } = useModelSettingsContext()
  const { record } = useTimelineContext()
  const effective = useEffectiveModelSettings()

  const update = useCallback((patch) => {
    baseUpdate(patch)
    for (const [leaf, val] of flatten(patch)) {
      const path = `model.${leaf}`
      record(path, MODEL_LABELS[path] ?? leaf, val)
    }
  }, [baseUpdate, record])

  return { modelSettings: effective, update }
}

/**
 * Base model settings merged with the timeline's live sample for any model.* track.
 * This is what the 3D scene renders and what the settings panels should display.
 */
export function useEffectiveModelSettings() {
  const { modelSettings } = useModelSettingsContext()
  const { liveSample } = useTimelineContext()

  return useMemo(() => {
    let eff = modelSettings
    for (const [path, val] of Object.entries(liveSample)) {
      if (path.startsWith('model.') && val !== undefined) {
        eff = setByPath(eff, path.slice('model.'.length), val)
      }
    }
    return eff
  }, [modelSettings, liveSample])
}
