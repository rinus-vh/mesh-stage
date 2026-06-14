import { useRef, useState, useEffect, useCallback } from 'react'
import { useDrag } from '@use-gesture/react'
import { Play, Pause, Repeat, Dot, RotateCcw, Magnet, Trash2, Settings } from 'lucide-react'
import { useFloating, offset, flip, shift, useDismiss, useInteractions, FloatingPortal, useTransitionStyles } from '@floating-ui/react'

import { Modal, Button } from '@6njp/prototype-library'
import { useThemeVariables } from '@6njp/prototype-library/machinery'

import { useTimeline, selKey } from '../contexts/TimelineContext.jsx'
import { useModelSettings, MODEL_DEFAULTS } from '../contexts/ModelSettingsContext.jsx'
import { useCamera } from '../contexts/CameraContext.jsx'
import { useRotation } from '../contexts/RotationContext.jsx'
import styles from './TimelinePanelContent.module.css'

// Right-hand breathing room so the rightmost keyframe is always reachable.
const RPAD = 32

export function TimelinePanelContent() {
  const {
    tracks, playhead, playheadRef, playing, loop, fps, duration, recording, selectedKeyframes,
    toggle, pause, setLoop, setRecording, setPlayhead, setTrackMuted, clearAllTracks,
    selectKeyframe, moveSelectedKeyframes, selectKeyframesInBox, clearSelection, setFps,
  } = useTimeline()

  const { update: resetModelSettings } = useModelSettings()
  const { resetCamera } = useCamera()
  const { resetRotation } = useRotation()

  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleClearAll = () => {
    clearAllTracks()
    resetModelSettings(MODEL_DEFAULTS)
    resetCamera()
    resetRotation()
    pause()
    setPlayhead(0)
    setConfirmOpen(false)
  }

  const [snap, setSnap] = useState(true)
  const snapRef = useRef(snap)
  snapRef.current = snap

  const [shiftHeld, setShiftHeld] = useState(false)

  // ── Timeline zoom (pinch / ctrl+wheel) ────────────────────────────────────────
  const [zoom, setZoom] = useState(1)           // 1x = fit-all; up to 16x
  const scrollerRef = useRef(null)              // the horizontally-scrollable lanes wrapper

  const handleZoomWheel = useCallback((e) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    e.stopPropagation()
    // Pinch on trackpad fires as ctrl+wheel with small delta
    const factor = e.deltaY < 0 ? 1.12 : 0.89
    setZoom(prev => Math.max(1, Math.min(16, prev * factor)))
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('wheel', handleZoomWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleZoomWheel)
  }, [handleZoomWheel])

  // ── Timeline settings popover ─────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false)
  const themeVariables = useThemeVariables()

  const { refs: settingsRefs, floatingStyles: settingsFloatingStyles, context: settingsContext } = useFloating({
    open: settingsOpen,
    onOpenChange: setSettingsOpen,
    placement: 'bottom-end',
    middleware: [offset(6), flip(), shift({ padding: 8 })],
  })
  const settingsDismiss = useDismiss(settingsContext)
  const { getReferenceProps: getSettingsRefProps, getFloatingProps: getSettingsFloatingProps } = useInteractions([settingsDismiss])
  const { isMounted: settingsMounted, styles: settingsTransition } = useTransitionStyles(settingsContext, {
    common: { opacity: 0, transform: 'translateY(-4px)' },
    open:   { opacity: 1, transform: 'translateY(0)' },
    duration: { open: 100, close: 80 },
  })

  // Shift temporarily inverts snap — button always shows the effective state.
  const effectiveSnap = snap !== shiftHeld

  // Mutable ref mirrors so the keydown closure always reads the latest values.
  const fpsRef = useRef(fps)
  fpsRef.current = fps
  const snapEffectiveRef = useRef(effectiveSnap)
  snapEffectiveRef.current = effectiveSnap

  // Global keyboard shortcuts: spacebar = play/pause, arrows = frame step, Shift tracking.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Shift') { setShiftHeld(true); return }
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === ' ') { e.preventDefault(); toggle(); return }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        // Snap on → move 1 second; snap off → move 1 frame (1/fps).
        const step = snapEffectiveRef.current ? 1 : 1 / fpsRef.current
        // playheadRef is the live mutable ref from context (always current).
        setPlayhead(playheadRef.current + (e.key === 'ArrowRight' ? step : -step))
        return
      }
    }
    const onKeyUp = (e) => { if (e.key === 'Shift') setShiftHeld(false) }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, [toggle, setPlayhead])

  const lanesRef = useRef(null)
  const [marquee, setMarquee] = useState(null) // {x1,y1,x2,y2} px relative to lanes
  const isMarqueeRef = useRef(false)
  const marqueeRef = useRef(null)  // ref mirror so closures see live marquee without re-subscribing

  const getRect = () => lanesRef.current?.getBoundingClientRect() ?? null
  const getUsableWidth = () => Math.max(1, (getRect()?.width ?? RPAD + 1) - RPAD)

  // Convert a clientX to timeline time.
  // clamped=true  → stay within [0, duration]   (scrub)
  // clamped=false → allow > duration             (keyframe extend)
  const timeFromX = (clientX, clamped = true) => {
    const rect = getRect()
    if (!rect) return 0
    const ratio = (clientX - rect.left) / (rect.width - RPAD)
    const t = Math.max(0, ratio) * duration
    return clamped ? Math.min(t, duration) : t
  }

  // ── Ruler scrub ─────────────────────────────────────────────────────────────

  const bindScrub = useDrag(
    ({ xy: [x], event }) => {
      const t = timeFromX(x, true)
      // Snap to nearest whole second unless Shift is held or snap is disabled.
      setPlayhead(snapRef.current !== event.shiftKey ? Math.round(t) : t)
    },
    { pointer: { capture: true } },
  )

  // ── Marquee (click-drag on empty lanes area) ─────────────────────────────────

  const bindMarquee = useDrag(({ event, xy: [x, y], first, last }) => {
    if (first) {
      // If the pointer went down on a keyframe or the ruler, let those handlers own it.
      const onKeyframe = !!event.target.closest('[data-keyframe]')
      const onRuler    = !!event.target.closest('[data-ruler]')
      isMarqueeRef.current = !onKeyframe && !onRuler
      if (!isMarqueeRef.current) return
      const rect = getRect()
      if (!rect) { isMarqueeRef.current = false; return }
      const box = { x1: x - rect.left, y1: y - rect.top, x2: x - rect.left, y2: y - rect.top }
      marqueeRef.current = box
      setMarquee(box)
      return
    }

    if (!isMarqueeRef.current) return

    const rect = getRect()
    if (!rect) return
    const x2 = x - rect.left
    const y2 = y - rect.top

    if (last) {
      const box = marqueeRef.current
      if (box) {
        const minX = Math.min(box.x1, x2)
        const maxX = Math.max(box.x1, x2)
        const minY = Math.min(box.y1, y2)
        const maxY = Math.max(box.y1, y2)

        if (maxX - minX > 4 || maxY - minY > 4) {
          // Gather keyframes whose visual x falls in the box AND whose lane overlaps the y range.
          const usable = rect.width - RPAD
          const items = []
          lanesRef.current?.querySelectorAll('[data-lane-id]').forEach(laneEl => {
            const lr = laneEl.getBoundingClientRect()
            const laneTop    = lr.top    - rect.top
            const laneBottom = lr.bottom - rect.top
            if (laneBottom < minY || laneTop > maxY) return
            const trackId = laneEl.dataset.laneId
            const track = tracks.find(t => t.id === trackId)
            if (!track) return
            track.keyframes.forEach(kf => {
              const kfX = duration > 0 ? (kf.time / duration) * usable : 0
              if (kfX >= minX && kfX <= maxX) items.push({ trackId, keyframeId: kf.id })
            })
          })
          selectKeyframesInBox(items)
        } else {
          // Small / zero movement = click on empty area → clear selection.
          clearSelection()
        }
      }
      setMarquee(null)
      marqueeRef.current = null
      isMarqueeRef.current = false
    } else {
      const box = { ...marqueeRef.current, x2, y2 }
      marqueeRef.current = box
      setMarquee(box)
    }
  }, { pointer: { capture: true } })

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const ticks = []
  for (let s = 0; s <= Math.floor(duration); s++) ticks.push(s)

  // Place an element at a given time within the usable (non-padded) lane width.
  const kfLeft = (time) => {
    const ratio = duration > 0 ? time / duration : 0
    return `calc(${ratio} * (100% - ${RPAD}px))`
  }

  return (
    <>
    <div className={styles.component}>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <button type='button' className={styles.iconBtn} onClick={toggle} title={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type='button'
          className={cx(styles.iconBtn, loop && styles.iconBtnActive)}
          onClick={() => setLoop(!loop)}
          title='Loop'
        >
          <Repeat size={14} />
        </button>
        <button
          type='button'
          className={cx(styles.iconBtn, recording && styles.iconBtnRecord)}
          onClick={() => setRecording(!recording)}
          title={recording ? 'Recording on — click to disable keyframe recording' : 'Recording off — click to enable keyframe recording'}
        >
          <Dot size={22} />
        </button>
        <div className={styles.snapWrapper}>
          <button
            type='button'
            className={cx(styles.iconBtn, effectiveSnap && styles.iconBtnActive)}
            onClick={() => setSnap(s => !s)}
          >
            <Magnet size={14} />
          </button>
          <div className={styles.snapTooltip}>
            {snap
              ? shiftHeld ? 'Snap overridden by Shift — release to restore' : 'Snap on — hold Shift to move freely'
              : shiftHeld ? 'Snap overridden by Shift — release to restore' : 'Snap off — hold Shift to snap'}
          </div>
        </div>
        <span className={styles.time}>{playhead.toFixed(2)}s / {duration.toFixed(2)}s</span>
        <button
          ref={settingsRefs.setReference}
          type='button'
          className={cx(styles.iconBtn, settingsOpen && styles.iconBtnActive)}
          title='Timeline settings'
          {...getSettingsRefProps({ onClick: () => setSettingsOpen(o => !o) })}
        >
          <Settings size={14} />
        </button>
        <button
          type='button'
          className={cx(styles.iconBtn, styles.iconBtnDanger)}
          onClick={() => setConfirmOpen(true)}
          title='Clear all keyframes and reset to defaults'
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className={styles.body}>
        {/* Track labels */}
        <div className={styles.labels}>
          <div className={styles.rulerSpacer} />
          {tracks.map(t => (
            <div key={t.id} className={cx(styles.trackLabel, t.muted && styles.trackLabelMuted)} title={t.label}>
              <span className={styles.trackLabelText}>{t.label}</span>
              {t.muted && (
                <button
                  type='button'
                  className={styles.trackReactivate}
                  onClick={() => setTrackMuted(t.id, false)}
                  title='Reactivate track'
                >
                  <RotateCcw size={9} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Lanes — horizontally scrollable + zoomable */}
        <div className={styles.lanesScroller} ref={scrollerRef}>
        <div className={styles.lanes} ref={lanesRef} style={{ width: zoom > 1 ? `${zoom * 100}%` : '100%' }} {...bindMarquee()}>
          {/* Alternating second bars — visual grid, rendered first so they sit under everything */}
          {duration > 0 && Array.from({ length: Math.ceil(duration) }, (_, i) => i)
            .filter(i => i % 2 === 0)
            .map(i => (
              <div
                key={i}
                className={styles.bar}
                style={{
                  left: kfLeft(i),
                  width: `calc(${1 / duration} * (100% - ${RPAD}px))`,
                }}
              />
            ))
          }

          {/* Ruler — scrub only, not marquee */}
          <div className={styles.ruler} data-ruler='true' {...bindScrub()}>
            {ticks.map(s => (
              <span key={s} className={styles.tick} style={{ left: kfLeft(s) }}>{s}s</span>
            ))}
          </div>

          {tracks.map(track => (
            <div key={track.id} className={cx(styles.lane, track.muted && styles.laneMuted)} data-lane-id={track.id}>
              {track.keyframes.map(kf => (
                <Keyframe
                  key={kf.id}
                  kfTime={kf.time}
                  selected={selectedKeyframes.has(selKey(track.id, kf.id))}
                  left={kfLeft(kf.time)}
                  snap={snap}
                  onSelect={(e) => selectKeyframe({
                    trackId: track.id,
                    keyframeId: kf.id,
                    multi:  e.metaKey || e.ctrlKey,
                    range:  e.shiftKey,
                  })}
                  onMove={(newTime) => moveSelectedKeyframes(track.id, kf.id, newTime)}
                  getDuration={  () => duration}
                  getUsableWidth={getUsableWidth}
                  getLanesRect={getRect}
                />
              ))}
            </div>
          ))}

          <div className={styles.playhead} style={{ left: kfLeft(Math.min(playhead, duration)) }} />

          {/* Marquee selection box */}
          {marquee && (
            <div
              className={styles.marquee}
              style={{
                left:   Math.min(marquee.x1, marquee.x2),
                top:    Math.min(marquee.y1, marquee.y2),
                width:  Math.abs(marquee.x2 - marquee.x1),
                height: Math.abs(marquee.y2 - marquee.y1),
              }}
            />
          )}
        </div>
        </div>{/* end lanesScroller */}
      </div>
    </div>

    {settingsMounted && (
      <FloatingPortal>
        <div
          ref={settingsRefs.setFloating}
          style={{ ...themeVariables, ...settingsFloatingStyles, zIndex: 200 }}
          {...getSettingsFloatingProps()}
        >
          <div className={styles.settingsPopover} style={settingsTransition}>
            <p className={styles.settingsLabel}>Frame rate</p>
            <div className={styles.fpsToggle}>
              {[24, 30].map(f => (
                <button
                  key={f}
                  type='button'
                  className={cx(styles.fpsBtn, fps === f && styles.fpsBtnActive)}
                  onClick={() => setFps(f)}
                  title={`${f} frames per second`}
                >
                  {f} fps
                </button>
              ))}
            </div>
          </div>
        </div>
      </FloatingPortal>
    )}

    <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title='Clear timeline'>
      <div className={styles.confirmBody}>
        <p className={styles.confirmText}>Remove all keyframes and reset all settings to defaults?</p>
        <div className={styles.confirmActions}>
          <Button label='Cancel' onClick={() => setConfirmOpen(false)} />
          <Button label='Clear all' onClick={handleClearAll} />
        </div>
      </div>
    </Modal>
    </>
  )
}

// ── Keyframe diamond ──────────────────────────────────────────────────────────

const EDGE_ZONE = 60  // px from lanes right edge where auto-advance starts
const MAX_SPEED = 4   // seconds per second at the very edge

function Keyframe({ kfTime, selected, left, snap, onSelect, onMove, getDuration, getUsableWidth, getLanesRect }) {
  // State captured at drag start — fixed for the duration of the drag so the
  // coordinate system doesn't shift under us as duration grows.
  const initialRef   = useRef({ time: 0, duration: 1, usableWidth: 1 })
  const extraTimeRef = useRef(0)    // time accumulated from edge auto-advance
  const edgeSpeedRef = useRef(0)    // seconds/second of auto-advance (0 = off)
  const mxRef        = useRef(0)    // current movement[0] from use-gesture
  const isDraggingRef = useRef(false)

  // Ref mirrors so rAF closure always reads the latest values without re-subscribing.
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove
  const snapRef = useRef(snap)
  snapRef.current = snap
  const shiftRef = useRef(false)   // updated every drag event; rAF loop reads it for edge-scroll snap

  const applySnap = (t) => (snapRef.current !== shiftRef.current ? Math.round(t) : t)

  // rAF loop — fires every frame but does nothing when not dragging / not in edge zone.
  useEffect(() => {
    let raf
    let prevT = null
    const tick = (nowT) => {
      if (isDraggingRef.current && edgeSpeedRef.current > 0 && prevT !== null) {
        const dt = (nowT - prevT) / 1000
        extraTimeRef.current += edgeSpeedRef.current * dt
        const { time: t0, duration: d0, usableWidth: uw0 } = initialRef.current
        const rawTime = Math.max(0, t0 + (mxRef.current / uw0) * d0 + extraTimeRef.current)
        onMoveRef.current(applySnap(rawTime))
      }
      prevT = nowT
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const bind = useDrag(({ movement: [mx], xy: [cx], tap, event, first, last }) => {
    if (tap) { onSelect(event); return }

    shiftRef.current = event?.shiftKey ?? false

    if (first) {
      initialRef.current = { time: kfTime, duration: getDuration(), usableWidth: getUsableWidth() }
      extraTimeRef.current = 0
      isDraggingRef.current = true
    }

    if (last) {
      isDraggingRef.current = false
      edgeSpeedRef.current = 0
      shiftRef.current = false
      return
    }

    // Edge zone: the closer to (or past) the right edge, the faster it advances.
    const rect = getLanesRect()
    if (rect) {
      const distFromRight = rect.right - cx
      if (distFromRight < EDGE_ZONE) {
        // Quadratic ramp: 0 at zone boundary → MAX_SPEED at (and beyond) the edge
        const depth = Math.min(1, Math.max(0, 1 - distFromRight / EDGE_ZONE))
        edgeSpeedRef.current = depth * depth * MAX_SPEED
      } else {
        edgeSpeedRef.current = 0
      }
    }

    mxRef.current = mx
    const { time: t0, duration: d0, usableWidth: uw0 } = initialRef.current
    const rawTime = Math.max(0, t0 + (mx / uw0) * d0 + extraTimeRef.current)
    onMove(applySnap(rawTime))
  }, { filterTaps: true, pointer: { capture: true } })

  return (
    <button
      type='button'
      data-keyframe='true'
      className={cx(styles.keyframe, selected && styles.keyframeSelected)}
      style={{ left }}
      {...bind()}
    />
  )
}
