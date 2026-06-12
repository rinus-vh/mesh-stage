import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Box } from 'lucide-react'
import {
  Grid, Header, Panel,
  MinimizedPanelsProvider, MinimizedPanelsMenu, usePanelManager,
} from '@6njp/prototype-library'
import { getThemeVariables } from '@6njp/prototype-library/machinery'

import { ModelSettingsProvider, useModelSettings } from '@/features/contexts/ModelSettingsContext.jsx'
import { ViewCanvas } from '@/features/ViewCanvas.jsx'
import { RotationProvider } from '@/features/contexts/RotationContext.jsx'
import { CameraProvider } from '@/features/contexts/CameraContext.jsx'
import { TimelineProvider } from '@/features/contexts/TimelineContext.jsx'
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

import styles from './App.module.css'

export default function App() {
  const [isDark, setIsDark] = React.useState(true)
  const themeVariables = getThemeVariables(isDark ? 'dark' : 'light')

  return (
    <ModelSettingsProvider>
      <ThemeBackgroundSync isDark={isDark} />
      <RotationProvider>
        <CameraProvider>
          <TimelineProvider>
            <MinimizedPanelsProvider>
              <main style={themeVariables} className={styles.app}>
                <Header
                  title='Mesh Stage'
                  logo={Box}
                  onToggleTheme={() => setIsDark(prev => !prev)}
                  layoutClassName={styles.headerLayout}
                  {...{ isDark }}
                />
                <Grid layoutClassName={styles.gridLayout}>
                  <AppPanels isDark={isDark} />
                </Grid>
                <MinimizedPanelsMenu layoutClassName={styles.minimizedMenuLayout} />
              </main>
            </MinimizedPanelsProvider>
          </TimelineProvider>
        </CameraProvider>
      </RotationProvider>
    </ModelSettingsProvider>
  )
}

// Syncs the background colour with the active theme whenever the user hasn't
// overridden it manually.
function ThemeBackgroundSync({ isDark }) {
  const { resetToThemeBackground } = useModelSettings()
  React.useEffect(() => {
    resetToThemeBackground(isDark ? '#111111' : '#ffffff')
  }, [isDark, resetToThemeBackground])
  return null
}

function AppPanels({ isDark }) {
  // Model state lifted here so the ViewCanvas survives panel minimize/unmount.
  const [modelUrl, setModelUrl] = useState(null)
  const modelRef = useRef(null)
  const handleModelFile = useCallback((file) => {
    setModelUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file) })
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
          <ViewCanvas modelRef={modelRef} modelUrl={modelUrl} />
        </div>,
        document.body,
      )}

      {settings.visible && (
        <Panel
          minimizable
          title='Settings'
          minWidth={4}
          minHeight={10}
          onMinimize={settings.minimize}
        >
          <SettingsContent
            isDark={isDark}
            onOpenWireframe={wireframe.open}
            onOpenLighting={lighting.open}
            onOpenMaterial={material.open}
            onOpenTexture={texture.open}
            onOpenBumpMap={bumpMap.open}
            onOpenExport={exportP.open}
            onOpenGroundPlane={groundPlane.open}
          />
        </Panel>
      )}

      {viewport.visible && (
        <Panel
          minimizable
          title='Viewport'
          minWidth={8}
          minHeight={10}
          onMinimize={viewport.minimize}
        >
          <ViewportContent modelUrl={modelUrl} modelRef={modelRef} onFile={handleModelFile} />
        </Panel>
      )}

      {timeline.visible && (
        <Panel
          minimizable
          title='Timeline'
          minWidth={8}
          minHeight={4}
          onMinimize={timeline.minimize}
        >
          <TimelinePanelContent />
        </Panel>
      )}

      {wireframe.visible && (
        <Panel
          closeable
          minimizable
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
          closeable
          minimizable
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
          closeable
          minimizable
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
          closeable
          minimizable
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
          closeable
          minimizable
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
          closeable
          minimizable
          title='Export'
          minWidth={4}
          minHeight={3}
          onClose={exportP.close}
          onMinimize={exportP.minimize}
        >
          <ExportPanelContent />
        </Panel>
      )}

      {groundPlane.visible && (
        <Panel
          closeable
          minimizable
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
