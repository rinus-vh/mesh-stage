import { PanelContainer, PanelContainerDivider, Slider, Checkbox, ColorInput } from '@6njp/prototype-library'

import { useAnimatableModelSettings } from '../contexts/useAnimatable.js'
import { AnimatableRow } from './AnimatableRow.jsx'

export function LightingPanelContent() {
  const { modelSettings, update } = useAnimatableModelSettings()

  return (
    <PanelContainer>
      <AnimatableRow label='Enabled' path='model.lighting'>
        <Checkbox checked={modelSettings.lighting} onChange={value => update({ lighting: value })} />
      </AnimatableRow>

      <PanelContainerDivider />

      <AnimatableRow label='Shadows' path='model.shadows'>
        <Checkbox checked={modelSettings.shadows} onChange={value => update({ shadows: value })} />
      </AnimatableRow>

      <AnimatableRow label='Color' path='model.lightColor'>
        <ColorInput value={modelSettings.lightColor} onChange={value => update({ lightColor: value })} />
      </AnimatableRow>

      <Slider
        value={modelSettings.lightStrength}
        onChange={v => update({ lightStrength: v })}
        min={0}
        max={10}
        step={0.1}
        label='Strength'
      />
    </PanelContainer>
  )
}
