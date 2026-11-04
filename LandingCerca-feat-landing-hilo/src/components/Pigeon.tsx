import curious from '../assets/paloma/pigeon-curious.svg'
import flying from '../assets/paloma/pigeon-flying.svg'
import happy from '../assets/paloma/pigeon-happy.svg'
import sad from '../assets/paloma/pigeon-sad.svg'
import singing from '../assets/paloma/pigeon-singing.svg'

/** Una pose por significado (ver CERCA-DESIGN-SYSTEM.md). Nunca como decoración. */
export const POSES = { curious, flying, happy, sad, singing }

export type Pose = keyof typeof POSES

export function Pigeon({ pose, alt = '', className = '' }: { pose: Pose; alt?: string; className?: string }) {
  return <img className={`pigeon ${className}`} src={POSES[pose]} alt={alt} decoding="async" />
}
