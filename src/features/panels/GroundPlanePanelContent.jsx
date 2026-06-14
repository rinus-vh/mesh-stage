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
      <AnimatableRow label='Enabled' path='model.showGroundPlane' value={modelSettings.showGroundPlane} defaultValue={MODEL_DEFAULTS.showGroundPlane} onReset={() => update({ showGroundPlane: MODEL_DEFAULTS.showGroundPlane })}>
        <Checkbox checked={modelSettings.showGroundPlane} onChange={v => update({ showGroundPlane: v })} />
      </AnimatableRow>

      <PanelContainerDivider />

      <AnimatableRow label='Solid' path='model.groundPlane.solid' value={groundPlane.solid} defaultValue={MODEL_DEFAULTS.groundPlane.solid} onReset={() => updatePlane({ solid: MODEL_DEFAULTS.groundPlane.solid })}>
        <Checkbox checked={groundPlane.solid} onChange={v => updatePlane({ solid: v })} />
      </AnimatableRow>

      <AnimatableRow label='Color' path='model.groundPlane.color' value={groundPlane.color} defaultValue={MODEL_DEFAULTS.groundPlane.color} onReset={() => updatePlane({ color: MODEL_DEFAULTS.groundPlane.color })}>
        <ColorInput value={groundPlane.color} onChange={v => updatePlane({ color: v })} />
      </AnimatableRow>

      <AnimatableRow label='Receive shadows' path='model.groundPlane.receiveShadows' value={groundPlane.receiveShadows} defaultValue={MODEL_DEFAULTS.groundPlane.receiveShadows} onReset={() => updatePlane({ receiveShadows: MODEL_DEFAULTS.groundPlane.receiveShadows })}>
        <Checkbox checked={groundPlane.receiveShadows} onChange={v => updatePlane({ receiveShadows: v })} />
      </AnimatableRow>
    </PanelContainer>
  )
}
