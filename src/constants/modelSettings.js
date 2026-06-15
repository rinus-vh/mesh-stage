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
  materialPreset: 'custom',
  transparentBackground: false,
}

// Theme defaults that diverge from MODEL_DEFAULTS (which uses the dark theme value).
export const GROUND_PLANE_THEME_COLORS = { dark: '#ffffff', light: '#000000' }
