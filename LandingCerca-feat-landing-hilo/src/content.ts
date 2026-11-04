import cafe from './assets/illustrations/cafe.svg'
import conchas from './assets/illustrations/conchas.svg'
import flores from './assets/illustrations/flores.svg'
import lluvia from './assets/illustrations/lluvia.svg'
import monterrey from './assets/illustrations/monterrey.svg'
import napoles from './assets/illustrations/napoles.svg'
import panaderia from './assets/illustrations/panaderia.svg'
import type { Copy } from './copy'

// Estructura de la demostración: orden, ilustración, color e inclinación de cada
// pieza. Los textos (en español e inglés) viven en copy.ts. Personas, horas y
// estampillas son ejemplos para explicar la app. La distancia Monterrey–Nápoles
// (≈10,008 km, 8 h de diferencia en horario de invierno) es la del resto del
// material de la marca.

export const ART = { cafe, conchas, flores, lluvia, monterrey, napoles, panaderia }

export type ArtName = keyof typeof ART
export type Tone = 'butter' | 'blush' | 'sky' | 'sage'

type Placed<Id> = { id: Id; art: ArtName; tone: Tone; tilt: number }

export const STATIONS: Placed<keyof Copy['stations']>[] = [
  { id: 'ensenar', art: 'conchas', tone: 'butter', tilt: -3 },
  { id: 'recordar', art: 'flores', tone: 'sage', tilt: 3 },
  { id: 'compartir', art: 'cafe', tone: 'blush', tilt: -2 },
]

export const THEIR_PAGE: Placed<keyof Copy['letter']['stamps']>[] = [
  { id: 'desayuno', art: 'cafe', tone: 'butter', tilt: -3 },
  { id: 'panaderia', art: 'panaderia', tone: 'blush', tilt: 2 },
  { id: 'ventana', art: 'napoles', tone: 'sky', tilt: -1 },
  { id: 'paraTi', art: 'flores', tone: 'sage', tilt: 3 },
]

export const MY_PAGE: Placed<keyof Copy['letter']['stamps']>[] = [
  { id: 'atardecer', art: 'monterrey', tone: 'butter', tilt: 2 },
  { id: 'siempre', art: 'conchas', tone: 'sky', tilt: -3 },
]

export const DISTANCE = '10,008'

// Álbum de ejemplo: octubre de 2026. El 1 cae en jueves y la semana empieza en lunes.
export const ALBUM = {
  today: 24,
  firstWeekday: 3,
  pages: [
    [1, 15],
    [16, 31],
  ],
  tones: ['butter', 'blush', 'sky', 'sage'],
  filled: {
    2: 'monterrey',
    4: 'cafe',
    5: 'napoles',
    8: 'conchas',
    9: 'panaderia',
    11: 'flores',
    12: 'lluvia',
    15: 'monterrey',
    17: 'napoles',
    18: 'cafe',
    20: 'panaderia',
    21: 'conchas',
    23: 'flores',
    24: 'lluvia',
  },
} as const satisfies {
  today: number
  firstWeekday: number
  pages: readonly (readonly [number, number])[]
  tones: readonly Tone[]
  filled: Record<number, ArtName>
}
