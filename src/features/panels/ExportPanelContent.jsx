import { useState } from 'react'
import {
  PanelContainer, PanelContainerSettingsRow, PanelContainerDivider,
  Dropdown, Button, LabelSm,
} from '@6njp/prototype-library'

import { useTimeline } from '../contexts/TimelineContext.jsx'
import { useCamera } from '../contexts/CameraContext.jsx'
import { useModelSettings } from '../contexts/ModelSettingsContext.jsx'
import { RESOLUTIONS, exportImageSequence, exportVideo } from '../machinery/capture.js'

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


export function ExportPanelContent() {
  const [format, setFormat]           = useState('video')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [resolution, setResolution]   = useState('1080')
  const [progress, setProgress]       = useState(null)
  const [busy, setBusy]               = useState(false)

  const { duration, fps, setFps, setPlayhead, play, pause } = useTimeline()
  const { glRef } = useCamera()
  const { modelSettings } = useModelSettings()

  const resolutionOptions = RESOLUTIONS.map(r => ({ value: r.value, label: r.label }))

  const handleExport = async () => {
    const srcCanvas = glRef.current?.domElement
    if (!srcCanvas) {
      setProgress('No viewport — load a model first')
      setTimeout(() => setProgress(null), 3000)
      return
    }
    setBusy(true)
    const opts = {
      srcCanvas, duration, fps, aspect: aspectRatio, resolution,
      transparent: modelSettings.transparentBackground,
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
          options={resolutionOptions}
          placeholder='Resolution'
        />
      </PanelContainerSettingsRow>

      <PanelContainerSettingsRow label='Frame rate'>
        <Dropdown
          value={String(fps)}
          onChange={v => setFps(Number(v))}
          options={[
            { value: '24', label: '24 fps' },
            { value: '30', label: '30 fps' },
          ]}
          placeholder='Frame rate'
        />
      </PanelContainerSettingsRow>

      <PanelContainerDivider />

      {progress && <LabelSm>{progress}</LabelSm>}

      <Button label={busy ? 'Rendering…' : 'Export'} onClick={busy ? undefined : handleExport} />
    </PanelContainer>
  )
}
