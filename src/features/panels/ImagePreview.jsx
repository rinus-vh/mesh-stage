import { X } from 'lucide-react'

import styles from './ImagePreview.module.css'

/** @param {{ url: string, onRemove: () => void, layoutClassName?: string }} props */
export function ImagePreview({ url, onRemove }) {
  return (
    <div className={cx(styles.component, styles.component_root)}>
      <img src={url} alt='Preview' className={styles.image} />

      <button
        type='button'
        onClick={onRemove}
        title='Remove image'
        className={styles.removeButton}
      >
        <X size={12} />
      </button>
    </div>
  )
}
