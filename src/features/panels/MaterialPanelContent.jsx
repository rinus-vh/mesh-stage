import { PanelContainer, PanelContainerSettingsRow, Slider, ColorInput } from '@6njp/prototype-library'

import { useAnimatableModelSettings } from '../contexts/useAnimatable.js'
import { AnimatableRow } from './AnimatableRow.jsx'

export function MaterialPanelContent() {
  const { modelSettings, update } = useAnimatableModelSettings()
  const { wireframe } = modelSettings

  return (
    <PanelContainer>
      <AnimatableRow label='Color' path='model.color'>
        <ColorInput value={modelSettings.color} onChange={value => update({ color: value })} />
      </AnimatableRow>

      <Slider
        value={modelSettings.roughness}
        onChange={value => update({ roughness: value })}
        min={0}
        max={1}
        step={0.01}
        label='Roughness'
        disabled={wireframe}
      />

      <Slider
        value={modelSettings.metalness}
        onChange={value => update({ metalness: value })}
        min={0}
        max={1}
        step={0.01}
        label='Metalness'
        disabled={wireframe}
      />
    </PanelContainer>
  )
}
