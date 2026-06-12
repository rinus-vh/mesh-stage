// Interpolation + dot-path helpers for the keyframe timeline.

/** Read a nested value by dot path, e.g. getByPath(s, 'texture.scale'). */
export function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

/** Immutably set a nested value by dot path, returning a new object. */
export function setByPath(obj, path, value) {
  const keys = path.split('.')
  const [head, ...rest] = keys
  if (rest.length === 0) return { ...obj, [head]: value }
  return { ...obj, [head]: setByPath(obj[head] ?? {}, rest.join('.'), value) }
}

export function isHexColor(v) {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)
}

function hexToRgb(hex) {
  const h = hex.slice(1)
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')
}

const lerp = (a, b, t) => a + (b - a) * t

function lerpHex(a, b, t) {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex([lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)])
}

/**
 * Interpolate between two keyframe values.
 * Numbers lerp, hex colours lerp in RGB, everything else steps (holds `a`).
 */
export function interpValue(a, b, t) {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t)
  if (isHexColor(a) && isHexColor(b)) return lerpHex(a, b, t)
  return a
}

/**
 * Sample a sorted keyframe array at `time`.
 * Clamps to the first/last keyframe outside the range.
 * @param {{time:number, value:any}[]} keyframes sorted ascending by time
 */
export function sampleTrack(keyframes, time) {
  if (!keyframes.length) return undefined
  if (time <= keyframes[0].time) return keyframes[0].value
  const last = keyframes[keyframes.length - 1]
  if (time >= last.time) return last.value

  for (let i = 0; i < keyframes.length - 1; i++) {
    const k0 = keyframes[i]
    const k1 = keyframes[i + 1]
    if (time >= k0.time && time <= k1.time) {
      const span = k1.time - k0.time
      const t = span === 0 ? 0 : (time - k0.time) / span
      return interpValue(k0.value, k1.value, t)
    }
  }
  return last.value
}
