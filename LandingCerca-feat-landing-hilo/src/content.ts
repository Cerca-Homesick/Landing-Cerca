import type { ArtName } from './components/Art'
import type { Copy } from './copy'

// Estructura de la demostración: orden, ilustración y color de cada pieza.
// Los textos (en español e inglés) viven en copy.ts. Personas, horas y mensajes
// son ejemplos para explicar la app. La distancia Monterrey–Nápoles (≈10,008 km,
// 8 h de diferencia en horario de invierno) es la del resto del material de la marca.

export type Tone = 'sky' | 'butter' | 'sage' | 'pink'
export type PersonId = keyof Copy['people']

export const STATIONS: { id: keyof Copy['stations']; art: ArtName; tone: Tone }[] = [
  { id: 'ensenar', art: 'conchas', tone: 'butter' },
  { id: 'recordar', art: 'flores', tone: 'pink' },
  { id: 'compartir', art: 'lluvia', tone: 'sky' },
]

export const DISTANCE = { km: '10,008', hours: 8 }

export type Moment = {
  id: keyof Copy['moments']
  art: ArtName
  tone: Tone
  from: PersonId
  /** Para la versión con fotos reales: ruta a una imagen optimizada (webp/avif). */
  image?: string
}

export const MOMENTS: Moment[] = [
  { id: 'cafe', art: 'cafe', tone: 'butter', from: 'valeria' },
  { id: 'panaderia', art: 'panaderia', tone: 'pink', from: 'mama' },
  { id: 'ventana', art: 'napoles', tone: 'sky', from: 'valeria' },
  { id: 'cerro', art: 'monterrey', tone: 'sage', from: 'mama' },
]
