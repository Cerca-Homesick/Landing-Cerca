// Eventos de conversión. Se envían a `window.dataLayer` si existe (Google Tag
// Manager u otra herramienta) y como evento del navegador `cerca:analytics`.
// `waitlist_cta_click` = intención; `waitlist_signup_confirmed` = inscripción
// verificada por la redirección de Jotform (ver config.ts).
export type AnalyticsEvent =
  | 'waitlist_cta_click'
  | 'waitlist_form_unavailable'
  | 'waitlist_signup_confirmed'
  | 'postcard_moment_open'
  | 'postcard_view_change'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function track(event: AnalyticsEvent, params: Record<string, string> = {}) {
  window.dataLayer?.push({ event, ...params })
  window.dispatchEvent(new CustomEvent('cerca:analytics', { detail: { event, ...params } }))
  if (import.meta.env.DEV) console.info('[analytics]', event, params)
}
