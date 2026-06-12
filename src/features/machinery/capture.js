import { createZip } from './zip.js'

const nextFrame = () => new Promise(r => requestAnimationFrame(r))
const settle = async (n = 3) => { for (let i = 0; i < n; i++) await nextFrame() }

// ── Resolution presets ────────────────────────────────────────────────────────

export const RESOLUTIONS = [
  { value: '480',  label: '480p',         height: 480  },
  { value: '720',  label: '720p',         height: 720  },
  { value: '1080', label: '1080p',        height: 1080 },
  { value: '2160', label: '2160p (4K)',   height: 2160 },
]

// ── Quality presets (video only) ──────────────────────────────────────────────

export const QUALITIES = [
  { value: 'low',    label: 'Low',    videoBitsPerSecond:  6_000_000 },
  { value: 'medium', label: 'Medium', videoBitsPerSecond: 18_000_000 },
  { value: 'high',   label: 'High',   videoBitsPerSecond: 40_000_000 },
]

// PNG: ~3 bytes/pixel raw, ~5× compression → 0.6 bytes/pixel
const PNG_BYTES_PER_PX = 0.6

export function estimateSize(format, resolutionValue, qualityValue, aspectRatio, duration, fps) {
  const preset   = RESOLUTIONS.find(r => r.value === resolutionValue) ?? RESOLUTIONS[2]
  const quality  = QUALITIES.find(q => q.value === qualityValue)      ?? QUALITIES[1]
  const [aw, ah] = aspectRatio.split(':').map(Number)
  const h = preset.height
  const w = Math.round((h * aw) / ah)

  let bytes
  if (format === 'sequence') {
    const frames = Math.max(1, Math.round(duration * fps))
    bytes = w * h * PNG_BYTES_PER_PX * frames
  } else {
    bytes = duration * quality.videoBitsPerSecond / 8
  }

  if (bytes < 1_000_000) return `~${Math.round(bytes / 1_000)} KB`
  if (bytes < 1_000_000_000) return `~${(bytes / 1_000_000).toFixed(0)} MB`
  return `~${(bytes / 1_000_000_000).toFixed(1)} GB`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function targetSize(aspect, resolutionValue) {
  const preset = RESOLUTIONS.find(r => r.value === resolutionValue) ?? RESOLUTIONS[1]
  const [aw, ah] = aspect.split(':').map(Number)
  const h = preset.height
  const w = Math.round((h * aw) / ah)
  // Ensure even dimensions (required by most video codecs)
  return { w: Math.max(2, w % 2 === 0 ? w : w - 1), h: Math.max(2, h % 2 === 0 ? h : h - 1) }
}

// Cover-fit (center-crop) the source canvas onto the 2D context.
function drawCover(ctx, src, w, h) {
  const scale = Math.max(w / src.width, h / src.height)
  const dw = src.width * scale
  const dh = src.height * scale
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function pickVideoMime() {
  const candidates = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m
  }
  return 'video/webm'
}

const extForMime = (mime) => (mime.startsWith('video/mp4') ? 'mp4' : 'webm')

// ── Exports ───────────────────────────────────────────────────────────────────

/**
 * Deterministically step the timeline frame-by-frame, capturing each frame as
 * a PNG, then download them as a single .zip.
 */
export async function exportImageSequence({ srcCanvas, duration, fps, aspect, resolution, setPlayhead, pause, onProgress }) {
  pause()
  const total = Math.max(1, Math.round(duration * fps))
  const { w, h } = targetSize(aspect, resolution)
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')

  const files = []
  for (let i = 0; i < total; i++) {
    setPlayhead(i / fps)
    await settle(3)               // wait for R3F to render the new playhead position
    drawCover(ctx, srcCanvas, w, h)
    const blob = await new Promise(res => out.toBlob(res, 'image/png'))
    files.push({ name: `frame_${String(i).padStart(4, '0')}.png`, data: new Uint8Array(await blob.arrayBuffer()) })
    onProgress?.((i + 1) / total)
  }

  triggerDownload(createZip(files), 'mesh-stage-sequence.zip')
}

/**
 * Record the animation to a video file.
 *
 * captureStream(0) + requestFrame() is unreliable across browsers — some never
 * produce more than one frame. Instead we use captureStream(fps) on an offscreen
 * 2D canvas that we keep in sync with the WebGL canvas via a continuous rAF mirror
 * loop.  The MediaRecorder sees a smooth, correctly-timed stream without any manual
 * frame-pump hacks.  The tradeoff is that export runs at real-time speed (a 6 s clip
 * takes ~6 s to capture), which is fine for typical short animations.
 */
export async function exportVideo({ srcCanvas, duration, fps, aspect, resolution, quality, setPlayhead, pause, play, onProgress }) {
  const qualityPreset = QUALITIES.find(q => q.value === quality) ?? QUALITIES[1]

  // ── offscreen crop canvas ─────────────────────────────────────────────────
  const { w, h } = targetSize(aspect, resolution)
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')

  // ── continuous mirror loop ────────────────────────────────────────────────
  // Runs every rAF, keeping the crop canvas in sync with the live WebGL render.
  let rafId
  const mirror = () => {
    drawCover(ctx, srcCanvas, w, h)
    rafId = requestAnimationFrame(mirror)
  }
  rafId = requestAnimationFrame(mirror)

  // ── MediaRecorder setup ───────────────────────────────────────────────────
  const stream = out.captureStream(fps)   // automatic capture at fps — no requestFrame needed
  const mime = pickVideoMime()
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: qualityPreset.videoBitsPerSecond })
  const chunks = []
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
  const done = new Promise(res => { recorder.onstop = res })

  // ── playback ──────────────────────────────────────────────────────────────
  setPlayhead(0)
  await settle(4)   // let R3F render the first frame before we start recording

  recorder.start()
  play()

  // Poll progress until the full duration has elapsed.
  const durationMs = duration * 1000
  const startMs = performance.now()
  while (true) {
    await nextFrame()
    const elapsed = performance.now() - startMs
    onProgress?.(Math.min(elapsed / durationMs, 1))
    if (elapsed >= durationMs + 200) break  // +200 ms buffer for the last frame
  }

  // ── teardown ──────────────────────────────────────────────────────────────
  pause()
  cancelAnimationFrame(rafId)
  recorder.stop()
  await done

  const blob = new Blob(chunks, { type: mime })
  triggerDownload(blob, `mesh-stage.${extForMime(mime)}`)
  return extForMime(mime)
}
