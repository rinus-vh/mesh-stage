import { useState } from 'react'
import { PanelContainerSettingsRow } from '@6njp/prototype-library'
import { ContextMenu } from '@6njp/prototype-library'

import { useTimeline } from '../contexts/TimelineContext.jsx'
import styles from './AnimatableRow.module.css'

/**
 * Drop-in replacement for PanelContainerSettingsRow that shows a small track-indicator
 * dot when a timeline track exists for the given `path`.
 *
 * - Dot is accent-coloured when the track is active.
 * - Dot is dimmed when the track is muted (the base setting shows in the viewport).
 * - Click the dot to toggle the muted state.
 * - Right-click anywhere in the row to add/remove a keyframe at the current time.
 *
 * Pass `value` + `label` to enable "Add keyframe at current time" from the context menu.
 * When `path` is omitted it behaves exactly like PanelContainerSettingsRow.
 */
export function AnimatableRow({ label, path, value, children }) {
  const { tracks, playhead, setTrackMuted, addOrUpdateKeyframe, removeTrack } = useTimeline()
  const track = path ? tracks.find(t => t.path === path) : null

  const [menu, setMenu] = useState(null) // { x, y }

  const handleContextMenu = (e) => {
    if (!path) return
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  const menuItems = []
  if (value !== undefined) {
    menuItems.push({
      label: 'Add keyframe at current time',
      onClick: () => addOrUpdateKeyframe(path, label, playhead, value),
    })
  }
  if (track) {
    menuItems.push({
      label: track.muted ? 'Reactivate track' : 'Disable track',
      onClick: () => setTrackMuted(track.id, !track.muted),
    })
    if (value !== undefined) menuItems.push({ divider: true })
    menuItems.push({
      label: 'Remove track',
      onClick: () => removeTrack(track.id),
    })
  }

  return (
    <>
      <PanelContainerSettingsRow label={label} onContextMenu={handleContextMenu}>
        {track && (
          <button
            type='button'
            className={cx(styles.dot, track.muted && styles.dotMuted)}
            onClick={() => setTrackMuted(track.id, !track.muted)}
            title={track.muted ? 'Track disabled — click to reactivate' : 'Has keyframes — click to disable track'}
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
