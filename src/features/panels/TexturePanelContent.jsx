import { PanelContainer, PanelContainerDivider, Slider, Checkbox, FileUpload } from '@6njp/prototype-library'

import { useAnimatableModelSettings } from '../contexts/useAnimatable.js'
import { ImagePreview } from './ImagePreview.jsx'
import { AnimatableRow } from './AnimatableRow.jsx'

export function TexturePanelContent() {
  const { modelSettings, update } = useAnimatableModelSettings()
  const { texture } = modelSettings

  const updateTexture = patch => update({ texture: { ...texture, ...patch } })
  const updateRepeat  = patch => updateTexture({ repeat: { ...texture.repeat, ...patch } })
  const updateOffset  = patch => updateTexture({ offset: { ...texture.offset, ...patch } })

  return (
    <PanelContainer>
      <AnimatableRow label='Enabled' path='model.texture.enabled'>
        <Checkbox checked={texture.enabled} onChange={v => updateTexture({ enabled: v })} />
      </AnimatableRow>

      <PanelContainerDivider />

      {texture.url
        ? (
          <ImagePreview
            url={texture.url}
            onRemove={() => updateTexture({ url: '', enabled: false })}
          />
        )
        : (
          <FileUpload
            onFile={file => updateTexture({ url: URL.createObjectURL(file), enabled: true })}
            label='Drop texture here'
            accept={['.jpg', '.jpeg', '.png', '.webp', '.gif']}
          />
        )
      }
      <Slider
        value={texture.scale}
        onChange={v => updateTexture({ scale: v })}
        min={0.1}
        max={5}
        step={0.1}
        label='Scale'
      />
      <Slider
        value={texture.repeat.x}
        onChange={v => updateRepeat({ x: v })}
        min={0.1}
        max={10}
        step={0.1}
        label='Repeat X'
      />
      <Slider
        value={texture.repeat.y}
        onChange={v => updateRepeat({ y: v })}
        min={0.1}
        max={10}
        step={0.1}
        label='Repeat Y'
      />
      <Slider
        value={texture.offset.x}
        onChange={v => updateOffset({ x: v })}
        min={0}
        max={1}
        step={0.01}
        label='Offset X'
      />
      <Slider
        value={texture.offset.y}
        onChange={v => updateOffset({ y: v })}
        min={0}
        max={1}
        step={0.01}
        label='Offset Y'
      />
    </PanelContainer>
  )
}
