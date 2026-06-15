import { SettingsKeyframeTimeline } from '@6njp/prototype-library'

import { useTimelineContext } from '@/contexts/TimelineContext.jsx'
import { useModelSettingsContext } from '@/contexts/ModelSettingsContext.jsx'
import { MODEL_DEFAULTS } from '@/constants/modelSettings.js'
import { useCameraContext } from '@/contexts/CameraContext.jsx'
import { useRotationContext } from '@/contexts/RotationContext.jsx'

export function TimelinePanelContent() {
  const {
    tracks, playhead, playheadRef, playing, loop, fps, duration, recording, selectedKeyframes,
    toggle, pause, setLoop, setRecording, setPlayhead, setTrackMuted, clearAllTracks,
    selectKeyframe, moveSelectedKeyframes, selectKeyframesInBox, clearSelection, setFps,
  } = useTimelineContext()

  const { update: resetModelSettings } = useModelSettingsContext()
  const { resetCamera } = useCameraContext()
  const { resetRotation } = useRotationContext()

  const handleClearAll = () => {
    clearAllTracks()
    resetModelSettings(MODEL_DEFAULTS)
    resetCamera()
    resetRotation()
  }

  return (
    <SettingsKeyframeTimeline
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
      {...{
        tracks,
        playhead,
        playheadRef,
        playing,
        loop,
        fps,
        duration,
        recording,
        selectedKeyframes
      }}
    />
  )
}
