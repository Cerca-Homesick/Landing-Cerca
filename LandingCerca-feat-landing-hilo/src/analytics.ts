import type { PostHog } from 'posthog-js'
import { onConsentChange, readConsent, type Consent } from './consent'

/*
 * Eventos de la landing (F2). Cada evento:
 *   - se publica como evento del navegador `cerca:analytics` (lo usan las pruebas)
 *     y en `window.dataLayer` si existe;
 *   - se manda a PostHog (servidor en la UE) si hay VITE_POSTHOG_KEY.
 * Nunca llevan datos personales: ni correo, ni nombre, ni lo que se escribe.
 *
 * `waitlist_cta_click` = intención; `waitlist_signup_confirmed` = registro
 * verificado (Tally.FormSubmitted o ?registro=confirmado). Embudo en PostHog:
 * scene_view(hero) → waitlist_cta_click → form_loaded → waitlist_signup_confirmed.
 */
export type AnalyticsEvent =
  | 'waitlist_cta_click'
  | 'waitlist_form_unavailable'
  | 'waitlist_signup_confirmed'
  | 'form_loaded'
  | 'form_abandoned'
  | 'scene_view'
  | 'lang_change'
  | 'letter_side_change'
  | 'album_day_open'
  | 'web_vitals'

type Params = Record<string, string | number | boolean>

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

const KEY = (import.meta.env.VITE_POSTHOG_KEY ?? '').trim()
const HOST = (import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com').trim()

let client: PostHog | null = null
/** Eventos que llegan antes de que PostHog termine de cargar. */
const queue: [AnalyticsEvent, Params][] = []

export function track(event: AnalyticsEvent, params: Params = {}) {
  window.dataLayer?.push({ event, ...params })
  window.dispatchEvent(new CustomEvent('cerca:analytics', { detail: { event, ...params } }))
  if (import.meta.env.DEV) console.info('[analytics]', event, params)
  if (!KEY) return
  if (client) client.capture(event, params)
  else queue.push([event, params])
}

/** Con permiso: cookie y almacenamiento propios. Sin permiso: solo memoria (nada se guarda). */
const persistenceFor = (consent: Consent | null) => (consent === 'granted' ? 'localStorage+cookie' : 'memory')

/**
 * Carga PostHog después del primer pintado (no compite con la página) y sigue
 * los cambios de consentimiento. Sin VITE_POSTHOG_KEY no hace nada.
 */
export function startAnalytics() {
  if (!KEY) return
  const load = async () => {
    const { default: posthog } = await import('posthog-js')
    const consent = readConsent()
    posthog.init(KEY, {
      api_host: HOST,
      persistence: persistenceFor(consent),
      // F2: solo los eventos propios y las vistas de página. El mapa de calor y
      // las grabaciones llegan en F3, y solo con permiso.
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: true,
      disable_surveys: true,
      enable_heatmaps: false,
      person_profiles: 'identified_only',
      // Nunca se guarda el texto de campos ni de enlaces con datos personales.
      mask_all_text: true,
      mask_all_element_attributes: true,
    })
    client = posthog
    for (const [event, params] of queue.splice(0)) posthog.capture(event, params)
    onConsentChange((value) => {
      posthog.set_config({ persistence: persistenceFor(value) })
      if (value === 'denied') posthog.reset()
    })
  }
  if ('requestIdleCallback' in window) requestIdleCallback(() => void load(), { timeout: 3000 })
  else setTimeout(() => void load(), 1500)
}

/** Velocidad real en el teléfono de cada visita (LCP, INP, CLS). */
export async function trackWebVitals() {
  const { onCLS, onINP, onLCP } = await import('web-vitals')
  const report = ({ name, value, rating }: { name: string; value: number; rating: string }) =>
    track('web_vitals', { metric: name, value: Math.round(name === 'CLS' ? value * 1000 : value), rating })
  onLCP(report)
  onINP(report)
  onCLS(report)
}
