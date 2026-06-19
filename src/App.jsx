import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Box } from 'lucide-react'
import {
  Grid, Header, Panel,
  MinimizedPanelsMenuContextProvider, MinimizedPanelsMenu, usePanelManager,
} from '@6njp/prototype-library'
import { getThemeVariables, ThemeContextProvider } from '@6njp/prototype-library/machinery'

import { ViewCanvas } from '@/features/ViewCanvas.jsx'
import { SettingsContent } from '@/features/SettingsContent.jsx'
import { ViewportContent } from '@/features/ViewportContent.jsx'
import { TimelinePanelContent } from '@/features/panels/TimelinePanelContent.jsx'
import { WireframePanelContent } from '@/features/panels/WireframePanelContent.jsx'
import { LightingPanelContent } from '@/features/panels/LightingPanelContent.jsx'
import { MaterialPanelContent } from '@/features/panels/MaterialPanelContent.jsx'
import { TexturePanelContent } from '@/features/panels/TexturePanelContent.jsx'
import { BumpMapPanelContent } from '@/features/panels/BumpMapPanelContent.jsx'
import { ExportPanelContent } from '@/features/panels/ExportPanelContent.jsx'
import { GroundPlanePanelContent } from '@/features/panels/GroundPlanePanelContent.jsx'

import { CameraContextProvider } from '@/contexts/CameraContextProvider.jsx'
import { ModelSettingsContextProvider } from '@/contexts/ModelSettingsContextProvider.jsx'
import { useModelSettingsContext } from '@/contexts/ModelSettingsContext.jsx'
import { RotationContextProvider } from '@/contexts/RotationContextProvider.jsx'
import { TimelineContextProvider } from '@/contexts/TimelineContextProvider.jsx'

import styles from './App.module.css'

export default function App() {
  const [isDark, setIsDark] = React.useState(true)
  const theme = isDark ? 'dark' : 'light'

  return (
    <ThemeContextProvider {...{ theme }}>
      <ModelSettingsContextProvider>
        <ThemeBackgroundSync {...{ isDark }} />

        <RotationContextProvider>
          <CameraContextProvider>
            <TimelineContextProvider>
              <MinimizedPanelsMenuContextProvider>
                <main style={getThemeVariables(theme)} className={styles.container}>
                  <Header
                    title='Mesh Stage'
                    logo={Box}
                    onToggleTheme={() => setIsDark(prev => !prev)}
                    layoutClassName={styles.headerLayout}
                    {...{ isDark }}
                  />
                  <Grid layoutClassName={styles.gridLayout}>
                    <AppPanels {...{ isDark }} />
                  </Grid>

                  <MinimizedPanelsMenu layoutClassName={styles.minimizedMenuLayout} />
                </main>
              </MinimizedPanelsMenuContextProvider>
            </TimelineContextProvider>
          </CameraContextProvider>
        </RotationContextProvider>
      </ModelSettingsContextProvider>
    </ThemeContextProvider>
  )
}

// Syncs the background colour with the active theme whenever the user hasn't
// overridden it manually.
function ThemeBackgroundSync({ isDark }) {
  const { resetToThemeBackground, resetToThemeGroundPlane } = useModelSettingsContext()
  React.useEffect(() => {
    resetToThemeBackground(isDark ? '#111111' : '#ffffff')
    resetToThemeGroundPlane(isDark ? '#ffffff' : '#000000')
  }, [isDark, resetToThemeBackground, resetToThemeGroundPlane])
  return null
}

function AppPanels({ isDark }) {
  // Model state lifted here so the ViewCanvas survives panel minimize/unmount.
  const [modelUrl, setModelUrl] = useState(null)
  const [modelFileType, setModelFileType] = useState(null)
  const modelRef = useRef(null)
  const handleModelFile = useCallback((file) => {
    setModelFileType(file.name.split('.').pop().toLowerCase())
    setModelUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file) })
  }, [])

  const handleDiscardModel = useCallback(() => {
    setModelUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setModelFileType(null)
  }, [])

  const settings   = usePanelManager('settings',  'Settings')
  const viewport   = usePanelManager('viewport',  'Viewport')
  const wireframe  = usePanelManager('wireframe', 'Wireframe',  { defaultVisible: false })
  const lighting   = usePanelManager('lighting',  'Lighting',   { defaultVisible: false })
  const material   = usePanelManager('material',  'Material',   { defaultVisible: false })
  const texture    = usePanelManager('texture',   'Texture',    { defaultVisible: false })
  const bumpMap    = usePanelManager('bumpmap',   'Bump Map',   { defaultVisible: false })
  const exportP      = usePanelManager('export',      'Export',       { defaultVisible: false })
  const groundPlane  = usePanelManager('groundplane', 'Ground Plane', { defaultVisible: false })
  const timeline     = usePanelManager('timeline',    'Timeline')

  return (
    <>
      {/*
       * When the viewport is minimized the Panel must fully unmount so the Grid
       * releases its cell (unregisterPanel). The canvas is kept alive in a fixed
       * off-screen portal so the loaded model is never lost.
       */}
      {!viewport.visible && modelUrl && createPortal(
        <div style={{ position: 'fixed', left: '-400px', top: 0, width: '200px', height: '200px', visibility: 'hidden', pointerEvents: 'none' }}>
          <ViewCanvas {...{ modelRef, modelUrl, modelFileType }} />
        </div>,
        document.body,
      )}

      {settings.visible && (
        <Panel
          isMinimizable
          title='Settings'
          minWidth={4}
          minHeight={9}
          onMinimize={settings.minimize}
        >
          <SettingsContent
            onOpenWireframe={wireframe.open}
            onOpenLighting={lighting.open}
            onOpenMaterial={material.open}
            onOpenTexture={texture.open}
            onOpenBumpMap={bumpMap.open}
            onOpenExport={exportP.open}
            onOpenGroundPlane={groundPlane.open}
            onDiscardModel={modelUrl ? handleDiscardModel : undefined}
            {...{ isDark }}
          />
        </Panel>
      )}

      {viewport.visible && (
        <Panel
          isMinimizable
          title='Viewport'
          minWidth={8}
          minHeight={6}
          onMinimize={viewport.minimize}
        >
          <ViewportContent onFile={handleModelFile} {...{ modelRef, modelUrl, modelFileType }} />
        </Panel>
      )}

      {timeline.visible && (
        <Panel
          isMinimizable
          title='Timeline'
          minWidth={8}
          minHeight={3}
          onMinimize={timeline.minimize}
        >
          <TimelinePanelContent />
        </Panel>
      )}

      {wireframe.visible && (
        <Panel
          isCloseable
          isMinimizable
          title='Wireframe'
          minWidth={3}
          minHeight={3}
          onClose={wireframe.close}
          onMinimize={wireframe.minimize}
        >
          <WireframePanelContent />
        </Panel>
      )}

      {lighting.visible && (
        <Panel
          isCloseable
          isMinimizable
          title='Lighting'
          minWidth={3}
          minHeight={4}
          onClose={lighting.close}
          onMinimize={lighting.minimize}
        >
          <LightingPanelContent />
        </Panel>
      )}

      {material.visible && (
        <Panel
          isCloseable
          isMinimizable
          title='Material'
          minWidth={3}
          minHeight={4}
          onClose={material.close}
          onMinimize={material.minimize}
        >
          <MaterialPanelContent />
        </Panel>
      )}

      {texture.visible && (
        <Panel
          isCloseable
          isMinimizable
          title='Texture'
          minWidth={3}
          minHeight={7}
          onClose={texture.close}
          onMinimize={texture.minimize}
        >
          <TexturePanelContent />
        </Panel>
      )}

      {bumpMap.visible && (
        <Panel
          isCloseable
          isMinimizable
          title='Bump Map'
          minWidth={3}
          minHeight={4}
          onClose={bumpMap.close}
          onMinimize={bumpMap.minimize}
        >
          <BumpMapPanelContent />
        </Panel>
      )}

      {exportP.visible && (
        <Panel
          isCloseable
          isMinimizable
          title='Export'
          minWidth={4}
          minHeight={4}
          onClose={exportP.close}
          onMinimize={exportP.minimize}
        >
          <ExportPanelContent />
        </Panel>
      )}

      {groundPlane.visible && (
        <Panel
          isCloseable
          isMinimizable
          title='Ground Plane'
          minWidth={3}
          minHeight={4}
          onClose={groundPlane.close}
          onMinimize={groundPlane.minimize}
        >
          <GroundPlanePanelContent />
        </Panel>
      )}
    </>
  )
}
