import { createContext, useContext, useState, useRef, useCallback, useMemo, useEffect } from 'react'

import { sampleTrack } from '../machinery/interpolate.js'

const MIN_DURATION = 1
const MAX_TIME = 60
const DEFAULT_DURATION = 6
const EPSILON = 0.04

let _id = 0
const nextId = () => `kf_${_id++}`
export const selKey = (trackId, keyframeId) => `${trackId}::${keyframeId}`

const TimelineContext = createContext(null)

function makeRotationSeed() {
  return {
    id: 'track_rotation_y',
    path: 'rotation.y',
    label: 'Rotation Y',
    muted: false,
    keyframes: [
      { id: nextId(), time: 0, value: -Math.PI },
      { id: nextId(), time: DEFAULT_DURATION, value: Math.PI },
    ],
  }
}

function sampleAll(tracks, time) {
  const out = {}
  for (const track of tracks) {
    if (!track.muted) out[track.path] = sampleTrack(track.keyframes, time)
  }
  return out
}

export function TimelineProvider({ children }) {
  const [tracks, setTracks] = useState(() => [makeRotationSeed()])
  const [playhead, setPlayheadState] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [loop, setLoop] = useState(true)
  const [fps] = useState(30)
  const [selectedKeyframes, setSelectedKeyframes] = useState(() => new Set())
  const [anchorKeyframe, setAnchorKeyframe] = useState(null) // {trackId, keyframeId} — SHIFT range anchor
  const [recording, setRecording] = useState(false)
  const [liveSample, setLiveSample] = useState(() => sampleAll([makeRotationSeed()], 0))

  const duration = useMemo(() => {
    let max = 0
    for (const t of tracks) for (const k of t.keyframes) if (k.time > max) max = k.time
    return Math.max(MIN_DURATION, max)
  }, [tracks])

  // Mutable ref mirrors — always current, safe to read inside rAF / useFrame / callbacks.
  const tracksRef = useRef(tracks)
  const playheadRef = useRef(0)
  const playingRef = useRef(playing)
  const loopRef = useRef(loop)
  const durationRef = useRef(duration)
  const sampleRef = useRef(liveSample)
  const selectedKeyframesRef = useRef(selectedKeyframes)
  const anchorKeyframeRef = useRef(anchorKeyframe)

  tracksRef.current = tracks
  playingRef.current = playing
  loopRef.current = loop
  durationRef.current = duration
  selectedKeyframesRef.current = selectedKeyframes
  anchorKeyframeRef.current = anchorKeyframe

  const setPlayhead = useCallback((t) => {
    const clamped = Math.max(0, Math.min(durationRef.current, t))
    playheadRef.current = clamped
    setPlayheadState(clamped)
    const s = sampleAll(tracksRef.current, clamped)
    sampleRef.current = s
    setLiveSample(s)
  }, [])

  useEffect(() => {
    let raf
    let prev = null
    const tick = (now) => {
      if (prev == null) prev = now
      const dt = (now - prev) / 1000
      prev = now
      if (playingRef.current) {
        let p = playheadRef.current + dt
        const dur = durationRef.current
        if (p >= dur) {
          if (loopRef.current) {
            p = dur === 0 ? 0 : p % dur
          } else {
            p = dur
            playingRef.current = false
            setPlaying(false)
          }
        }
        playheadRef.current = p
        setPlayheadState(p)
        const s = sampleAll(tracksRef.current, p)
        sampleRef.current = s
        setLiveSample(s)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const addOrUpdateKeyframe = useCallback((path, label, time, value) => {
    const t = Math.max(0, Math.min(MAX_TIME, time))
    // Compute synchronously against the always-current ref so the rAF loop
    // sees the change on its very next tick, before React re-renders.
    const prev = tracksRef.current
    const idx = prev.findIndex(tr => tr.path === path)
    let next
    if (idx === -1) {
      next = [...prev, { id: `track_${path.replace(/\W/g, '_')}`, path, label, muted: false, keyframes: [{ id: nextId(), time: t, value }] }]
    } else {
      const track = prev[idx]
      const existing = track.keyframes.findIndex(k => Math.abs(k.time - t) < EPSILON)
      let keyframes
      if (existing !== -1) {
        keyframes = track.keyframes.map((k, i) => (i === existing ? { ...k, value } : k))
      } else {
        keyframes = [...track.keyframes, { id: nextId(), time: t, value }].sort((a, b) => a.time - b.time)
      }
      next = [...prev]
      next[idx] = { ...track, keyframes }
    }
    tracksRef.current = next
    setTracks(next)
  }, [])

  const recordingRef = useRef(recording)
  recordingRef.current = recording

  const setTrackMuted = useCallback((trackId, muted) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, muted } : t))
  }, [])

  const record = useCallback((path, label, value) => {
    if (recordingRef.current) {
      // Recording ON: always record whether playing or paused.
      // Also auto-unmute the track for this path if it was muted.
      setTracks(prev => {
        const track = prev.find(t => t.path === path)
        if (track?.muted) return prev.map(t => t.path === path ? { ...t, muted: false } : t)
        return prev
      })
      addOrUpdateKeyframe(path, label, playheadRef.current, value)
      // Immediately reflect the new value in liveSample so the controlled knob
      // doesn't snap back while waiting for the rAF to resample the updated track.
      sampleRef.current = { ...sampleRef.current, [path]: value }
      setLiveSample(s => ({ ...s, [path]: value }))
      return true
    }
    // Recording OFF: if a non-muted track exists for this path, mute it.
    setTracks(prev => {
      const track = prev.find(t => t.path === path && !t.muted)
      if (track) return prev.map(t => t.id === track.id ? { ...t, muted: true } : t)
      return prev
    })
    return false
  }, [addOrUpdateKeyframe])

  const removeKeyframe = useCallback((trackId, keyframeId) => {
    setTracks(prev => prev
      .map(t => t.id === trackId ? { ...t, keyframes: t.keyframes.filter(k => k.id !== keyframeId) } : t)
      .filter(t => t.keyframes.length > 0))
  }, [])

  /**
   * Remove an entire track by id and clean up any selected keyframes that
   * belonged to it.
   */
  const removeTrack = useCallback((trackId) => {
    // Capture keys before the state update so we can clean up selection synchronously.
    const track = tracksRef.current.find(t => t.id === trackId)
    const keysToRemove = track ? track.keyframes.map(kf => selKey(trackId, kf.id)) : []

    setTracks(prev => prev.filter(t => t.id !== trackId))

    if (keysToRemove.length > 0) {
      const next = new Set(selectedKeyframesRef.current)
      for (const k of keysToRemove) next.delete(k)
      selectedKeyframesRef.current = next
      setSelectedKeyframes(next)
    }
  }, [])

  // Removes every keyframe that is currently in the selection.
  const removeSelected = useCallback(() => {
    const sel = selectedKeyframesRef.current
    if (sel.size === 0) return
    setTracks(prev => prev
      .map(t => ({ ...t, keyframes: t.keyframes.filter(k => !sel.has(selKey(t.id, k.id))) }))
      .filter(t => t.keyframes.length > 0))
    const empty = new Set()
    selectedKeyframesRef.current = empty
    setSelectedKeyframes(empty)
    setAnchorKeyframe(null)
  }, [])

  /**
   * Move selected keyframes by a delta derived from the anchor keyframe's new absolute time.
   * If the anchor is in the selection, all selected keyframes move together.
   * If not (e.g. dragging an unselected keyframe), only the anchor moves.
   */
  const moveSelectedKeyframes = useCallback((anchorTrackId, anchorKeyframeId, newTime) => {
    const sel = selectedKeyframesRef.current
    const anchorKey = selKey(anchorTrackId, anchorKeyframeId)
    const useSelection = sel.has(anchorKey)

    setTracks(prev => {
      // Compute delta inside the functional update so React batching gives us fresh prev.
      const anchorTrack = prev.find(t => t.id === anchorTrackId)
      const anchorKf = anchorTrack?.keyframes.find(k => k.id === anchorKeyframeId)
      if (!anchorKf) return prev
      const delta = newTime - anchorKf.time
      if (Math.abs(delta) < 0.0001) return prev

      return prev.map(track => ({
        ...track,
        keyframes: track.keyframes
          .map(kf => {
            const move = useSelection
              ? sel.has(selKey(track.id, kf.id))
              : (track.id === anchorTrackId && kf.id === anchorKeyframeId)
            return move ? { ...kf, time: Math.max(0, Math.min(MAX_TIME, kf.time + delta)) } : kf
          })
          .sort((a, b) => a.time - b.time),
      }))
    })
  }, [])

  /**
   * Select a single keyframe, honouring modifier keys.
   *   multi  (Cmd/Ctrl) — toggle this keyframe in/out of the selection
   *   range  (Shift)    — select all keyframes in the same track from anchor → this keyframe
   *   plain              — deselect all, select only this keyframe; becomes the new anchor
   */
  const selectKeyframe = useCallback(({ trackId, keyframeId, multi = false, range = false }) => {
    const key = selKey(trackId, keyframeId)

    if (range) {
      const anchor = anchorKeyframeRef.current
      if (anchor && anchor.trackId === trackId) {
        const track = tracksRef.current.find(t => t.id === trackId)
        const anchorKf = track?.keyframes.find(k => k.id === anchor.keyframeId)
        const thisKf = track?.keyframes.find(k => k.id === keyframeId)
        if (anchorKf && thisKf) {
          const minT = Math.min(anchorKf.time, thisKf.time)
          const maxT = Math.max(anchorKf.time, thisKf.time)
          const newSel = new Set(selectedKeyframesRef.current)
          track.keyframes.forEach(k => {
            if (k.time >= minT && k.time <= maxT) newSel.add(selKey(trackId, k.id))
          })
          selectedKeyframesRef.current = newSel
          setSelectedKeyframes(newSel)
          return
        }
      }
      // Different track or no anchor — fall through to toggle behaviour.
      const newSel = new Set(selectedKeyframesRef.current)
      newSel.has(key) ? newSel.delete(key) : newSel.add(key)
      selectedKeyframesRef.current = newSel
      setSelectedKeyframes(newSel)
      return
    }

    if (multi) {
      const newSel = new Set(selectedKeyframesRef.current)
      newSel.has(key) ? newSel.delete(key) : newSel.add(key)
      selectedKeyframesRef.current = newSel
      setSelectedKeyframes(newSel)
      setAnchorKeyframe({ trackId, keyframeId })
      return
    }

    // Plain click — single select.
    const newSel = new Set([key])
    selectedKeyframesRef.current = newSel
    setSelectedKeyframes(newSel)
    setAnchorKeyframe({ trackId, keyframeId })
  }, [])

  // Called by the marquee on drag-end with the list of keyframes inside the box.
  const selectKeyframesInBox = useCallback((items) => {
    const newSel = new Set(items.map(({ trackId, keyframeId }) => selKey(trackId, keyframeId)))
    selectedKeyframesRef.current = newSel
    setSelectedKeyframes(newSel)
  }, [])

  const clearSelection = useCallback(() => {
    const empty = new Set()
    selectedKeyframesRef.current = empty
    setSelectedKeyframes(empty)
    setAnchorKeyframe(null)
  }, [])

  // Internal clipboard — stores keyframe data relative to the earliest selected time.
  const clipboardRef = useRef(null)

  // Copy selected keyframes. Times are stored relative to the earliest so paste
  // is always offset from the current playhead position.
  const copySelected = useCallback(() => {
    const sel = selectedKeyframesRef.current
    if (sel.size === 0) return
    const items = []
    for (const track of tracksRef.current) {
      for (const kf of track.keyframes) {
        if (sel.has(selKey(track.id, kf.id))) {
          items.push({ path: track.path, label: track.label, time: kf.time, value: kf.value })
        }
      }
    }
    if (items.length === 0) return
    const minTime = Math.min(...items.map(i => i.time))
    clipboardRef.current = items.map(i => ({ path: i.path, label: i.label, relativeTime: i.time - minTime, value: i.value }))
  }, [])

  // Paste clipboard keyframes at the current playhead. Each entry is placed at
  // playhead + relativeTime, so multi-keyframe selections keep their spacing.
  const pasteKeyframes = useCallback(() => {
    const cb = clipboardRef.current
    if (!cb || cb.length === 0) return
    const t = playheadRef.current
    for (const item of cb) {
      addOrUpdateKeyframe(item.path, item.label, t + item.relativeTime, item.value)
    }
  }, [addOrUpdateKeyframe])

  // Keyboard shortcuts — Delete/Backspace, Cmd/Ctrl+C, Cmd/Ctrl+V.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedKeyframesRef.current.size > 0) {
          e.preventDefault()
          removeSelected()
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        if (selectedKeyframesRef.current.size > 0) {
          e.preventDefault()
          copySelected()
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        if (clipboardRef.current) {
          e.preventDefault()
          pasteKeyframes()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [removeSelected, copySelected, pasteKeyframes])

  const clearAllTracks = useCallback(() => {
    setTracks([])
    const empty = new Set()
    selectedKeyframesRef.current = empty
    setSelectedKeyframes(empty)
    setAnchorKeyframe(null)
    playheadRef.current = 0
    setPlayheadState(0)
    setLiveSample({})
    sampleRef.current = {}
  }, [])

  const play   = useCallback(() => { playingRef.current = true;  setPlaying(true) }, [])
  const pause  = useCallback(() => { playingRef.current = false; setPlaying(false) }, [])
  const toggle = useCallback(() => (playingRef.current ? pause() : play()), [play, pause])

  const value = {
    tracks, playhead, playing, loop, fps, duration, recording, selectedKeyframes, liveSample,
    sampleRef, playheadRef, playingRef,
    record, addOrUpdateKeyframe, removeKeyframe, removeTrack, clearAllTracks, moveSelectedKeyframes, removeSelected,
    copySelected, pasteKeyframes,
    selectKeyframe, selectKeyframesInBox, clearSelection,
    setPlayhead, play, pause, toggle, setLoop, setRecording, setTrackMuted,
  }

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
}

export function useTimeline() {
  return useContext(TimelineContext)
}
