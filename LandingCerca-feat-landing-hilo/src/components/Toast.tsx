import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Pigeon, type Pose } from './Pigeon'

type ToastProps = { pose: Pose; dismissLabel: string; onDismiss: () => void; children: ReactNode }

// Va en <body>: las bandas crean contextos de apilamiento que lo dejarían debajo.
export function Toast({ pose, dismissLabel, onDismiss, children }: ToastProps) {
  return createPortal(
    <div className="thanks" role="status">
      <Pigeon pose={pose} />
      <p>{children}</p>
      <button type="button" className="icon-btn" onClick={onDismiss} aria-label={dismissLabel}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>,
    document.body,
  )
}
