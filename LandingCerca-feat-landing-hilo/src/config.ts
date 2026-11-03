export { BRAND_NAME } from './brand'

/**
 * Jotform. Por defecto, la app "Cerca Wishlist" (código de inserción oficial:
 * iframe a app.jotform.com/263007192678866?appEmbedded=1). Para cambiarla sin
 * tocar código, define VITE_JOTFORM_URL en `.env` (ver `.env.example`).
 * Si la URL queda vacía o no es https, los botones abren un aviso de
 * "formulario pendiente" en lugar de un registro falso.
 */
const DEFAULT_JOTFORM_URL = 'https://app.jotform.com/263007192678866?appEmbedded=1'
const rawJotformUrl = (import.meta.env.VITE_JOTFORM_URL || DEFAULT_JOTFORM_URL).trim()

function validFormUrl(value: string): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** URL para el iframe del modal. */
export const JOTFORM_URL = validFormUrl(rawJotformUrl)

/** Enlace directo (pestaña nueva), sin el parámetro de inserción. */
export const JOTFORM_DIRECT_URL = (() => {
  if (!JOTFORM_URL) return null
  const url = new URL(JOTFORM_URL)
  url.searchParams.delete('appEmbedded')
  return url.toString()
})()

/**
 * Inscripción confirmada. En Jotform: Configuración → Página de agradecimiento →
 * "Redirigir a una URL externa" con la URL de esta página más
 * `?registro=confirmado`. Solo esa redirección (que ocurre tras enviar el
 * formulario) registra la conversión; un clic en el botón no cuenta como tal.
 */
export const SIGNUP_PARAM = 'registro'
export const SIGNUP_VALUE = 'confirmado'
export const SIGNUP_MESSAGE = 'cerca:signup-confirmed'
