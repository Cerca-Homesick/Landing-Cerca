export { BRAND_NAME } from './brand'

/**
 * Tally. El formulario vive en un iframe dentro del diálogo de la lista de
 * espera. `transparentBackground` lo deja sobre el papel beige; `dynamicHeight`
 * ajusta el alto al contenido. Para cambiarlo sin tocar código, define
 * VITE_TALLY_EMBED_URL en `.env`. Si la URL queda vacía o no es https, los
 * botones abren un aviso de "formulario pendiente".
 */
const DEFAULT_TALLY_EMBED_URL =
  'https://tally.so/embed/GeKvlz?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1'
const rawTallyUrl = (import.meta.env.VITE_TALLY_EMBED_URL || DEFAULT_TALLY_EMBED_URL).trim()

function validFormUrl(value: string): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** URL del iframe (`data-tally-src`). El widget de Tally le pone `src`. */
export const TALLY_EMBED_URL = validFormUrl(rawTallyUrl)

/** Formulario público, para abrirlo en una pestaña nueva. */
export const TALLY_DIRECT_URL = (() => {
  if (!TALLY_EMBED_URL) return null
  const url = new URL(TALLY_EMBED_URL)
  url.pathname = url.pathname.replace(/^\/embed\//, '/r/')
  for (const key of ['alignLeft', 'hideTitle', 'transparentBackground', 'dynamicHeight']) {
    url.searchParams.delete(key)
  }
  return url.toString()
})()

export const TALLY_ORIGIN = 'https://tally.so'
export const TALLY_WIDGET_SRC = 'https://tally.so/widgets/embed.js'

/**
 * Inscripción confirmada desde una pestaña nueva. En Tally: el mensaje de
 * agradecimiento puede redirigir a esta página más `?registro=confirmado`.
 * Dentro del modal, la confirmación llega por el evento `Tally.FormSubmitted`
 * y no depende de esa redirección.
 */
export const SIGNUP_PARAM = 'registro'
export const SIGNUP_VALUE = 'confirmado'
export const SIGNUP_MESSAGE = 'cerca:signup-confirmed'
