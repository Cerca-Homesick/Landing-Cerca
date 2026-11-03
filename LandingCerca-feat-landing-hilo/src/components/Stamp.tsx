import type { Tone } from '../content'
import { Art, type ArtName } from './Art'

type StampProps = {
  art: ArtName
  tone?: Tone
  image?: string
  /** Texto alternativo cuando `image` es una foto real. */
  alt?: string
}

/** Fotografía con borde de estampilla. Sin `image`, muestra la ilustración provisional. */
export function Stamp({ art, tone = 'butter', image, alt = '' }: StampProps) {
  return (
    <span className={`stamp stamp--${tone}`}>
      <span className="stamp__paper">
        {image ? <img src={image} alt={alt} loading="lazy" decoding="async" /> : <Art name={art} />}
      </span>
    </span>
  )
}
