import { useState } from 'react'
import { RotateCcw, Plus, EyeOff, Eye, Trash2 } from 'lucide-react'
import { PanelContainerSettingsRow } from '@6njp/prototype-library'
import { ContextMenu } from '@6njp/prototype-library'

import { useTimelineContext } from '@/contexts/TimelineContext.jsx'

import styles from './AnimatableRow.module.css'

/**
 * Drop-in replacement for PanelContainerSettingsRow that shows a small track-indicator
 * dot when a timeline track exists for the given `path`.
 *
 * - Dot is accent-coloured when the track is active.
 * - Dot is dimmed when the track is muted (the base setting shows in the viewport).
 * - Click the dot to toggle the muted state.
 * - Right-click anywhere in the row to open a context menu with keyframe / track / reset actions.
 *
 * Props:
 *   value        — current value; enables "Add keyframe" item.
 *   defaultValue — when provided (and !== value), adds a "Reset to default" item.
 *   onReset      — callback fired when "Reset to default" is chosen.
 * When `path` is omitted it behaves exactly like PanelContainerSettingsRow.
 */
export function AnimatableRow({ label, path, value, defaultValue, onReset, children }) {
  const { tracks, playhead, setTrackMuted, addOrUpdateKeyframe, removeTrack } = useTimelineContext()
  const track = path ? tracks.find(t => t.path === path) : null

  const [menu, setMenu] = useState(null) // { x, y }

  const handleContextMenu = (e) => {
    if (!path) return
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  const isDirty = onReset && defaultValue !== undefined && value !== defaultValue

  const menuItems = []
  if (value !== undefined) {
    menuItems.push({
      label: 'Add keyframe at current time',
      icon: <Plus size={12} />,
      onClick: () => addOrUpdateKeyframe(path, label, playhead, value),
    })
  }
  if (isDirty) {
    menuItems.push({
      label: 'Reset to default',
      icon: <RotateCcw size={12} />,
      onClick: onReset,
    })
  }
  if (track) {
    if (menuItems.length) menuItems.push({ divider: true })
    menuItems.push({
      label: track.muted ? 'Reactivate track' : 'Disable track',
      icon: track.muted ? <Eye size={12} /> : <EyeOff size={12} />,
      onClick: () => setTrackMuted(track.id, !track.muted),
    })
    menuItems.push({
      label: 'Remove track',
      icon: <Trash2 size={12} />,
      onClick: () => removeTrack(track.id),
    })
  }

  return (
    <>
      <PanelContainerSettingsRow onContextMenu={handleContextMenu} {...{ label }}>
        {track && (
          <button
            type='button'
            onClick={() => setTrackMuted(track.id, !track.muted)}
            title={track.muted ? 'Track disabled — click to reactivate' : 'Has keyframes — click to disable track'}
            className={cx(styles.dot, track.muted && styles.dotMuted)}
          />
        )}
        {children}
      </PanelContainerSettingsRow>

      {menu && menuItems.length > 0 && (
        <ContextMenu
          isOpen
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={menuItems}
        />
      )}
    </>
  )
}
