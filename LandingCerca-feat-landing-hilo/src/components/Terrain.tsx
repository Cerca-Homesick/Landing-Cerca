// Borde superior de cada banda de color: un paisaje recortado, como en una
// postal impresa. Toma el color de la banda (`--band`) y sube un poco con el scroll.
const SHAPES = {
  colinas: 'M0 120 V72 C120 38 250 28 380 58 S620 104 780 62 S1060 12 1220 46 S1390 84 1440 64 V120Z',
  sierra: 'M0 120 V84 L120 46 L230 78 L380 22 L520 70 L660 34 L820 88 L980 30 L1130 72 L1280 40 L1440 76 V120Z',
  olas: 'M0 120 V66 Q90 30 180 66 T360 66 T540 66 T720 66 T900 66 T1080 66 T1260 66 T1440 66 V120Z',
  mesa: 'M0 120 V58 H210 L260 30 H540 L600 70 H900 L960 40 H1240 L1290 62 H1440 V120Z',
  dunas: 'M0 120 V90 C200 30 420 30 620 78 S1000 120 1180 52 S1400 40 1440 60 V120Z',
} as const

export type TerrainShape = keyof typeof SHAPES

export function Terrain({ shape }: { shape: TerrainShape }) {
  return (
    <svg className="terrain" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" data-terrain>
      <path d={SHAPES[shape]} />
    </svg>
  )
}
