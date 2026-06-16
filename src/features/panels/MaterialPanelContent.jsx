import { PanelContainer, PanelContainerSettingsRow, PanelContainerDivider, Slider, ColorInput, Dropdown } from '@6njp/prototype-library'

import { useAnimatableModelSettings } from '@/contexts/useAnimatable.js'
import { MODEL_DEFAULTS } from '@/constants/modelSettings.js'
import { AnimatableRow } from './AnimatableRow.jsx'

const PRESETS = [
  { value: 'custom', label: 'Custom' },
  { value: 'chrome', label: 'Chrome' },
]

export function MaterialPanelContent() {
  const { modelSettings, update } = useAnimatableModelSettings()
  const { wireframe } = modelSettings
  const isChrome = modelSettings.materialPreset === 'chrome'

  return (
    <PanelContainer>
      <PanelContainerSettingsRow label='Preset'>
        <Dropdown
          value={modelSettings.materialPreset}
          onChange={value => update({ materialPreset: value })}
          options={PRESETS}
          placeholder='Preset'
        />
      </PanelContainerSettingsRow>

      <PanelContainerDivider />

      <AnimatableRow
        label='Color'
        path='model.color'
        value={modelSettings.color}
        defaultValue={MODEL_DEFAULTS.color}
        onReset={() => update({ color: MODEL_DEFAULTS.color })}
      >
        <ColorInput value={modelSettings.color} onChange={value => update({ color: value })} disabled={isChrome || wireframe} />
      </AnimatableRow>

      <Slider
        value={isChrome ? 0 : modelSettings.roughness}
        onChange={value => update({ roughness: value })}
        min={0}
        max={1}
        step={0.01}
        label='Roughness'
        disabled={wireframe || isChrome}
      />

      <Slider
        value={isChrome ? 1 : modelSettings.metalness}
        onChange={value => update({ metalness: value })}
        min={0}
        max={1}
        step={0.01}
        label='Metalness'
        disabled={wireframe || isChrome}
      />
    </PanelContainer>
  )
}
