import { PanelContainer, PanelContainerDivider, Checkbox, ColorInput } from '@6njp/prototype-library'

import { useAnimatableModelSettings } from '../contexts/useAnimatable.js'
import { MODEL_DEFAULTS } from '../contexts/ModelSettingsContext.jsx'
import { AnimatableRow } from './AnimatableRow.jsx'

export function GroundPlanePanelContent() {
  const { modelSettings, update } = useAnimatableModelSettings()
  const groundPlane = modelSettings.groundPlane ?? MODEL_DEFAULTS.groundPlane

  const updatePlane = patch => update({ groundPlane: { ...groundPlane, ...patch } })

  return (
    <PanelContainer>
      <AnimatableRow label='Enabled' path='model.showGroundPlane'>
        <Checkbox checked={modelSettings.showGroundPlane} onChange={v => update({ showGroundPlane: v })} />
      </AnimatableRow>

      <PanelContainerDivider />

      <AnimatableRow label='Solid' path='model.groundPlane.solid'>
        <Checkbox checked={groundPlane.solid} onChange={v => updatePlane({ solid: v })} />
      </AnimatableRow>

      <AnimatableRow label='Color' path='model.groundPlane.color'>
        <ColorInput value={groundPlane.color} onChange={v => updatePlane({ color: v })} />
      </AnimatableRow>

      <AnimatableRow label='Receive shadows' path='model.groundPlane.receiveShadows'>
        <Checkbox checked={groundPlane.receiveShadows} onChange={v => updatePlane({ receiveShadows: v })} />
      </AnimatableRow>
    </PanelContainer>
  )
}
