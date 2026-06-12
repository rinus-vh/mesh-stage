import { PanelContainerSettingsRow } from '@6njp/prototype-library'

import { useTimeline } from '../contexts/TimelineContext.jsx'
import styles from './AnimatableRow.module.css'

/**
 * Drop-in replacement for PanelContainerSettingsRow that shows a small track-indicator
 * dot when a timeline track exists for the given `path`.
 *
 * - Dot is accent-coloured when the track is active.
 * - Dot is dimmed when the track is muted (the base setting shows in the viewport).
 * - Click the dot to toggle the muted state.
 *
 * When `path` is omitted it behaves exactly like PanelContainerSettingsRow.
 */
export function AnimatableRow({ label, path, children }) {
  const { tracks, setTrackMuted } = useTimeline()
  const track = path ? tracks.find(t => t.path === path) : null

  return (
    <PanelContainerSettingsRow label={label}>
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
  )
}
