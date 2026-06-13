import { FileUpload } from '@6njp/prototype-library'

import { ViewCanvas } from './ViewCanvas.jsx'

import styles from './ViewportContent.module.css'

/**
 * Renders either the file upload prompt or the 3D canvas.
 * State is lifted to AppPanels so the canvas survives when the panel is minimized.
 */
export function ViewportContent({ modelUrl, modelRef, onFile }) {
  if (!modelUrl) {
    return (
      <div className={styles.component}>
        <FileUpload
          label='Drop FBX model here'
          accept={['.fbx']}
          layoutClassName={styles.uploadLayout}
          {...{ onFile }}
        />
      </div>
    )
  }

  return <ViewCanvas {...{ modelRef, modelUrl }} />
}
