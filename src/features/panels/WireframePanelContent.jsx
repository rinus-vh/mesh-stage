import { PanelContainer, PanelContainerDivider, Checkbox, ColorInput } from '@6njp/prototype-library'

import { useAnimatableModelSettings } from '../contexts/useAnimatable.js'
import { AnimatableRow } from './AnimatableRow.jsx'

export function WireframePanelContent() {
  const { modelSettings, update } = useAnimatableModelSettings()

  return (
    <PanelContainer>
      <AnimatableRow label='Enabled' path='model.wireframe' value={modelSettings.wireframe}>
        <Checkbox checked={modelSettings.wireframe} onChange={v => update({ wireframe: v })} />
      </AnimatableRow>

      <PanelContainerDivider />

      <AnimatableRow label='Color' path='model.wireframeColor' value={modelSettings.wireframeColor ?? '#00ffcc'}>
        <ColorInput
          value={modelSettings.wireframeColor ?? '#00ffcc'}
          onChange={v => update({ wireframeColor: v })}
        />
      </AnimatableRow>
    </PanelContainer>
  )
}
