/*
 * F1 · Consentimiento de análisis. La decisión vive solo en este navegador.
 * Sin decisión o con «Rechazar», el análisis funciona sin cookies ni
 * almacenamiento (ver analytics.ts); con «Aceptar», PostHog puede guardar su
 * identificador para reconocer visitas que vuelven.
 * Si cambia lo que se pide, sube CONSENT_VERSION: se vuelve a preguntar.
 */
export type Consent = 'granted' | 'denied'

export const CONSENT_KEY = 'cerca:consent'
export const CONSENT_VERSION = 1
const OPEN_EVENT = 'cerca:consent-open'
const CHANGE_EVENT = 'cerca:consent-change'

type Stored = { value: Consent; version: number; at: string }

export function readConsent(): Consent | null {
  try {
    const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? 'null') as Stored | null
    if (stored?.version === CONSENT_VERSION && (stored.value === 'granted' || stored.value === 'denied')) {
      return stored.value
    }
  } catch {
    // Sin almacenamiento o dato roto: se vuelve a preguntar.
  }
  return null
}

export function writeConsent(value: Consent) {
  try {
    const stored: Stored = { value, version: CONSENT_VERSION, at: new Date().toISOString() }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(stored))
  } catch {
    // Sin almacenamiento: vale para esta visita.
  }
  window.dispatchEvent(new CustomEvent<Consent>(CHANGE_EVENT, { detail: value }))
}

export function onConsentChange(fn: (value: Consent) => void) {
  const listener = (event: Event) => fn((event as CustomEvent<Consent>).detail)
  window.addEventListener(CHANGE_EVENT, listener)
  return () => window.removeEventListener(CHANGE_EVENT, listener)
}

/** Vuelve a mostrar el aviso (enlace «Preferencias de privacidad» del pie). */
export const openConsent = () => window.dispatchEvent(new Event(OPEN_EVENT))
export function onConsentOpen(fn: () => void) {
  window.addEventListener(OPEN_EVENT, fn)
  return () => window.removeEventListener(OPEN_EVENT, fn)
}
