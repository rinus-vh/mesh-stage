import { PanelContainer, PanelContainerDivider, Slider, Checkbox, ColorInput } from '@6njp/prototype-library'

import { useAnimatableModelSettings } from '../contexts/useAnimatable.js'
import { MODEL_DEFAULTS } from '../contexts/ModelSettingsContext.jsx'
import { AnimatableRow } from './AnimatableRow.jsx'

export function LightingPanelContent() {
  const { modelSettings, update } = useAnimatableModelSettings()

  return (
    <PanelContainer>
      <AnimatableRow
        label='Enabled'
        path='model.lighting'
        value={modelSettings.lighting}
        defaultValue={MODEL_DEFAULTS.lighting}
        onReset={() => update({ lighting: MODEL_DEFAULTS.lighting })}
      >
        <Checkbox checked={modelSettings.lighting} onChange={value => update({ lighting: value })} />
      </AnimatableRow>

      <PanelContainerDivider />

      <AnimatableRow
        label='Shadows'
        path='model.shadows'
        value={modelSettings.shadows}
        defaultValue={MODEL_DEFAULTS.shadows}
        onReset={() => update({ shadows: MODEL_DEFAULTS.shadows })}
      >
        <Checkbox checked={modelSettings.shadows} onChange={value => update({ shadows: value })} />
      </AnimatableRow>

      <AnimatableRow
        label='Color'
        path='model.lightColor'
        value={modelSettings.lightColor}
        defaultValue={MODEL_DEFAULTS.lightColor}
        onReset={() => update({ lightColor: MODEL_DEFAULTS.lightColor })}
      >
        <ColorInput value={modelSettings.lightColor} onChange={value => update({ lightColor: value })} />
      </AnimatableRow>

      <Slider
        value={modelSettings.lightStrength}
        onChange={v => update({ lightStrength: v })}
        min={0}
        max={15}
        step={0.1}
        label='Strength'
      />
    </PanelContainer>
  )
}
