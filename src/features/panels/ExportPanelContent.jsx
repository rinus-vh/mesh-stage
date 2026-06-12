import { useState } from 'react'
import {
  PanelContainer, PanelContainerSettingsRow, PanelContainerDivider,
  Dropdown, Button, LabelSm,
} from '@6njp/prototype-library'

import { useTimeline } from '../contexts/TimelineContext.jsx'
import { useCamera } from '../contexts/CameraContext.jsx'
import { RESOLUTIONS, QUALITIES, estimateSize, exportImageSequence, exportVideo } from '../machinery/capture.js'

const FORMATS = [
  { value: 'video',    label: 'Video (.mp4 / .webm)' },
  { value: 'sequence', label: 'Image sequence (.png)' },
]

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 Widescreen' },
  { value: '4:3',  label: '4:3 Standard' },
  { value: '1:1',  label: '1:1 Square' },
  { value: '9:16', label: '9:16 Portrait' },
]

const RESOLUTION_OPTIONS = RESOLUTIONS.map(r => ({ value: r.value, label: r.label }))

export function ExportPanelContent() {
  const [format, setFormat]           = useState('video')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [resolution, setResolution]   = useState('1080')
  const [quality, setQuality]         = useState('high')
  const [progress, setProgress]       = useState(null)
  const [busy, setBusy]               = useState(false)

  const { duration, fps, setPlayhead, play, pause } = useTimeline()
  const { glRef } = useCamera()

  const isVideo = format === 'video'

  // Quality options include a size estimate for video; sequence estimates are
  // resolution-dependent so we show those inline in the resolution row instead.
  const qualityOptions = QUALITIES.map(q => ({
    value: q.value,
    label: `${q.label} — ${estimateSize('video', resolution, q.value, aspectRatio, duration, fps)}`,
  }))

  const sequenceResolutionOptions = RESOLUTIONS.map(r => ({
    value: r.value,
    label: `${r.label} — ${estimateSize('sequence', r.value, quality, aspectRatio, duration, fps)}`,
  }))

  const handleExport = async () => {
    const srcCanvas = glRef.current?.domElement
    if (!srcCanvas) {
      setProgress('No viewport — load a model first')
      setTimeout(() => setProgress(null), 3000)
      return
    }
    setBusy(true)
    const opts = {
      srcCanvas, duration, fps, aspect: aspectRatio, resolution, quality,
      setPlayhead, play, pause,
      onProgress: p => setProgress(`Rendering… ${Math.round(p * 100)}%`),
    }
    try {
      if (format === 'sequence') await exportImageSequence(opts)
      else await exportVideo(opts)
      setProgress('Done ✓')
    } catch (err) {
      console.error('Export failed:', err)
      setProgress('Export failed — see console')
    }
    setBusy(false)
    setTimeout(() => setProgress(null), 3000)
  }

  return (
    <PanelContainer>
      <PanelContainerSettingsRow label='Format'>
        <Dropdown
          value={format}
          onChange={setFormat}
          options={FORMATS}
          placeholder='Format'
        />
      </PanelContainerSettingsRow>

      <PanelContainerSettingsRow label='Aspect ratio'>
        <Dropdown
          value={aspectRatio}
          onChange={setAspectRatio}
          options={ASPECT_RATIOS}
          placeholder='Aspect ratio'
        />
      </PanelContainerSettingsRow>

      <PanelContainerSettingsRow label='Resolution'>
        <Dropdown
          value={resolution}
          onChange={setResolution}
          options={isVideo ? RESOLUTION_OPTIONS : sequenceResolutionOptions}
          placeholder='Resolution'
        />
      </PanelContainerSettingsRow>

      {isVideo && (
        <PanelContainerSettingsRow label='Quality'>
          <Dropdown
            value={quality}
            onChange={setQuality}
            options={qualityOptions}
            placeholder='Quality'
          />
        </PanelContainerSettingsRow>
      )}

      <PanelContainerDivider />

      {progress && <LabelSm>{progress}</LabelSm>}

      <Button label={busy ? 'Rendering…' : 'Export'} onClick={busy ? undefined : handleExport} />
    </PanelContainer>
  )
}
