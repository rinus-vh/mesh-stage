import { PanelContainer, PanelContainerSettingsRow, PanelContainerDivider, Slider, Checkbox, FileUpload } from '@6njp/prototype-library'

import { useAnimatableModelSettings } from '../contexts/useAnimatable.js'
import { ImagePreview } from './ImagePreview.jsx'

export function BumpMapPanelContent() {
  const { modelSettings, update } = useAnimatableModelSettings()
  const { bumpMap } = modelSettings

  const updateBump = patch => update({ bumpMap: { ...bumpMap, ...patch } })

  return (
    <PanelContainer>
      <PanelContainerSettingsRow label='Enabled'>
        <Checkbox checked={bumpMap.enabled} onChange={v => updateBump({ enabled: v })} />
      </PanelContainerSettingsRow>

      <PanelContainerDivider />

      {bumpMap.url
        ? (
          <ImagePreview
            url={bumpMap.url}
            onRemove={() => updateBump({ url: '', enabled: false })}
          />
        )
        : (
          <FileUpload
            onFile={file => updateBump({ url: URL.createObjectURL(file), enabled: true })}
            label='Drop bump map here'
            accept={['.jpg', '.jpeg', '.png', '.webp']}
          />
        )
      }
      <Slider
        value={bumpMap.strength}
        onChange={v => updateBump({ strength: v })}
        min={0}
        max={2}
        step={0.01}
        label='Strength'
      />
    </PanelContainer>
  )
}
