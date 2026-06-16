import { PanelContainer, PanelContainerDivider, Checkbox, ColorInput } from '@6njp/prototype-library'

import { useAnimatableModelSettings } from '@/contexts/useAnimatable.js'
import { MODEL_DEFAULTS } from '@/constants/modelSettings.js'
import { AnimatableRow } from './AnimatableRow.jsx'

export function WireframePanelContent() {
  const { modelSettings, update } = useAnimatableModelSettings()

  return (
    <PanelContainer>
      <AnimatableRow
        label='Enabled'
        path='model.wireframe'
        value={modelSettings.wireframe}
        defaultValue={MODEL_DEFAULTS.wireframe}
        onReset={() => update({ wireframe: MODEL_DEFAULTS.wireframe })}
      >
        <Checkbox checked={modelSettings.wireframe} onChange={v => update({ wireframe: v })} />
      </AnimatableRow>

      <PanelContainerDivider />

      <AnimatableRow
        label='Color'
        path='model.wireframeColor'
        value={modelSettings.wireframeColor ?? MODEL_DEFAULTS.wireframeColor}
        defaultValue={MODEL_DEFAULTS.wireframeColor}
        onReset={() => update({ wireframeColor: MODEL_DEFAULTS.wireframeColor })}
      >
        <ColorInput
          value={modelSettings.wireframeColor ?? MODEL_DEFAULTS.wireframeColor}
          onChange={v => update({ wireframeColor: v })}
        />
      </AnimatableRow>
    </PanelContainer>
  )
}
