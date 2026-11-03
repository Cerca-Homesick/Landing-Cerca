import { useId } from 'react'

type PostmarkProps = {
  ring: string
  center: string
  sub?: string
  waves?: boolean
  className?: string
}

/** Matasellos circular con texto en el aro y, opcionalmente, líneas onduladas de cancelación. */
export function Postmark({ ring, center, sub, waves = false, className = '' }: PostmarkProps) {
  const id = useId()
  return (
    <svg className={`postmark ${className}`} viewBox={waves ? '0 0 260 120' : '0 0 120 120'} aria-hidden="true">
      <defs>
        <path id={`${id}-arc`} d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="56" className="postmark__ring" />
      <circle cx="60" cy="60" r="34" className="postmark__ring postmark__ring--thin" />
      <text className="postmark__arc">
        <textPath href={`#${id}-arc`} startOffset="0">
          {ring}
        </textPath>
      </text>
      <text x="60" y={sub ? 60 : 66} textAnchor="middle" className="postmark__center">
        {center}
      </text>
      {sub && (
        <text x="60" y="76" textAnchor="middle" className="postmark__sub">
          {sub}
        </text>
      )}
      {waves &&
        [34, 48, 62, 76, 90].map((y) => (
          <path
            key={y}
            className="postmark__wave"
            d={`M124 ${y} q8 -7 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0`}
          />
        ))}
    </svg>
  )
}
