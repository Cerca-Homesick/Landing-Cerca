import type { CSSProperties, HTMLAttributes } from 'react'
import { ART, type ArtName, type Tone } from '../content'

type StampProps = HTMLAttributes<HTMLSpanElement> & {
  art: ArtName
  tone?: Tone
  tilt?: number
  /** Vacío cuando la estampilla es decorativa. */
  alt?: string
}

/** Toda foto de CERCA es una estampilla: borde perforado, marco de un tono e imagen 4:5. */
export function Stamp({ art, tone = 'butter', tilt, alt = '', className = '', style, ...rest }: StampProps) {
  const rotation = tilt === undefined ? undefined : ({ '--r': `${tilt}deg` } as CSSProperties)
  return (
    <span className={`stamp stamp--${tone} ${className}`} style={{ ...rotation, ...style }} {...rest}>
      <span className="stamp__paper">
        <img src={ART[art]} alt={alt} decoding="async" />
      </span>
    </span>
  )
}
