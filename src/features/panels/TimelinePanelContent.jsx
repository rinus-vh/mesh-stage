import { SettingsKeyframeTimeline } from '@6njp/prototype-library'

import { useTimeline } from '../contexts/TimelineContext.jsx'
import { useModelSettings, MODEL_DEFAULTS } from '../contexts/ModelSettingsContext.jsx'
import { useCamera } from '../contexts/CameraContext.jsx'
import { useRotation } from '../contexts/RotationContext.jsx'

export function TimelinePanelContent() {
  const {
    tracks, playhead, playheadRef, playing, loop, fps, duration, recording, selectedKeyframes,
    toggle, pause, setLoop, setRecording, setPlayhead, setTrackMuted, clearAllTracks,
    selectKeyframe, moveSelectedKeyframes, selectKeyframesInBox, clearSelection, setFps,
  } = useTimeline()

  const { update: resetModelSettings } = useModelSettings()
  const { resetCamera } = useCamera()
  const { resetRotation } = useRotation()

  const handleClearAll = () => {
    clearAllTracks()
    resetModelSettings(MODEL_DEFAULTS)
    resetCamera()
    resetRotation()
  }

  return (
    <SettingsKeyframeTimeline
      tracks={tracks}
      playhead={playhead}
      playheadRef={playheadRef}
      playing={playing}
      loop={loop}
      fps={fps}
      duration={duration}
      recording={recording}
      selectedKeyframes={selectedKeyframes}
      onToggle={toggle}
      onPause={pause}
      onSetLoop={setLoop}
      onSetRecording={setRecording}
      onSetPlayhead={setPlayhead}
      onSetTrackMuted={setTrackMuted}
      onClearAll={handleClearAll}
      onSelectKeyframe={selectKeyframe}
      onMoveSelectedKeyframes={moveSelectedKeyframes}
      onSelectKeyframesInBox={selectKeyframesInBox}
      onClearSelection={clearSelection}
      onSetFps={setFps}
    />
  )
}
