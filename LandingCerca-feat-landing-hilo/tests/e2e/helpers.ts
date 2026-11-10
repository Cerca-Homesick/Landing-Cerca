import { test, type Page } from '@playwright/test'

export const FORM_ID = 'GeKvlz'

/** Formulario falso de Tally: avisa que cargó y, al enviar, `Tally.FormSubmitted`. */
const FAKE_FORM = (appOrigin: string) => `<!doctype html><html><body>
<form id="f">
  <label>Email <input name="email" type="email" required></label>
  <button>Submit</button>
</form>
<button id="redirect" type="button">Submit with redirect</button>
<script>
  const say = (event) => parent.postMessage(JSON.stringify({ event, payload: { formId: '${FORM_ID}' } }), '*')
  say('Tally.FormLoaded')
  document.getElementById('f').addEventListener('submit', (e) => { e.preventDefault(); say('Tally.FormSubmitted') })
  // Agradecimiento configurado para redirigir a la landing con ?registro=confirmado
  document.getElementById('redirect').addEventListener('click', () => { location.href = '${appOrigin}/?registro=confirmado' })
</script>
</body></html>`

/** Widget falso: igual que el real, pasa `data-tally-src` a `src`. */
const FAKE_WIDGET = `window.Tally = { loadEmbeds() {
  document.querySelectorAll('iframe[data-tally-src]:not([src])').forEach((f) => { f.src = f.dataset.tallySrc })
} }`

type Options = { widget?: 'ok' | 'fail'; form?: 'ok' | 'silent' }

export async function fakeTally(page: Page, { widget = 'ok', form = 'ok' }: Options = {}) {
  const submissions: string[] = []
  const appOrigin = new URL(test.info().project.use.baseURL!).origin
  await page.route('https://tally.so/widgets/embed.js', (route) =>
    widget === 'ok' ? route.fulfill({ contentType: 'text/javascript', body: FAKE_WIDGET }) : route.abort(),
  )
  await page.route(`https://tally.so/embed/${FORM_ID}**`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: form === 'ok' ? FAKE_FORM(appOrigin) : '<!doctype html><p>slow form</p>',
    }),
  )
  // Red de seguridad: cualquier otra petición a Tally (p. ej. un envío real) se corta y se anota.
  await page.route('https://*.tally.so/**', (route) => {
    submissions.push(route.request().url())
    return route.abort()
  })
  return submissions
}

/** Eventos de analítica (`cerca:analytics`) que la página dispara. */
export async function recordEvents(page: Page) {
  await page.addInitScript(() => {
    ;(window as unknown as { __events: unknown[] }).__events = []
    window.addEventListener('cerca:analytics', (e) =>
      (window as unknown as { __events: unknown[] }).__events.push((e as CustomEvent).detail),
    )
  })
  return () =>
    page.evaluate(() => (window as unknown as { __events: { event: string; [k: string]: string | number | boolean }[] }).__events)
}


/** PostHog falso: responde vacío y anota cada petición. Nunca sale nada a PostHog. */
export async function fakePostHog(page: Page) {
  const requests: string[] = []
  await page.route(/https:\/\/(eu|eu-assets)\.i\.posthog\.com\/.*/, (route) => {
    requests.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`)
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
  return requests
}

/** Para pruebas que no tratan del consentimiento: decisión ya tomada y PostHog falso. */
export async function quietPage(page: Page, consent: 'granted' | 'denied' = 'denied') {
  await fakePostHog(page)
  await page.addInitScript((value) => {
    localStorage.setItem('cerca:consent', JSON.stringify({ value, version: 1, at: new Date().toISOString() }))
  }, consent)
}
