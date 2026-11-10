import { expect, test, type Page } from '@playwright/test'
import { fakePostHog } from './helpers'

/*
 * F1 · Aviso de consentimiento y aviso de privacidad.
 * PostHog está simulado: se ve qué pide la página, pero nada sale.
 */

const banner = (page: Page) => page.getByRole('region', { name: 'Privacidad' })

/** Lo que PostHog dejó guardado en el navegador (cookies y almacenamiento). */
async function phStorage(page: Page) {
  const cookies = (await page.context().cookies()).filter((c) => c.name.startsWith('ph_')).map((c) => c.name)
  const local = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('ph_')))
  return [...cookies, ...local]
}

/** Espera a que PostHog haya cargado y mandado algo. */
async function posthogStarted(requests: string[]) {
  await expect.poll(() => requests.length, { timeout: 10_000 }).toBeGreaterThan(0)
}

test('primera visita: aviso abajo, dos respuestas del mismo peso y enlace al aviso', async ({ page }) => {
  await fakePostHog(page)
  await page.goto('/?lang=es')
  await expect(banner(page)).toBeVisible()
  const accept = banner(page).getByRole('button', { name: 'Aceptar' })
  const decline = banner(page).getByRole('button', { name: 'Rechazar' })
  const [a, d] = [(await accept.boundingBox())!, (await decline.boundingBox())!]
  expect(Math.round(a.width)).toBe(Math.round(d.width))
  expect(Math.round(a.height)).toBe(Math.round(d.height))
  expect(a.height).toBeGreaterThanOrEqual(44)
  await expect(banner(page).getByRole('link', { name: 'Aviso de privacidad' })).toHaveAttribute('href', '/privacidad/')
  // No roba el foco: la página se puede usar sin contestar.
  await expect(accept).not.toBeFocused()
  await expect(decline).not.toBeFocused()
})

test('sin contestar, PostHog cuenta la visita pero no guarda nada en el navegador', async ({ page }) => {
  const requests = await fakePostHog(page)
  await page.goto('/?lang=es')
  await posthogStarted(requests)
  await page.waitForTimeout(500)
  expect(await phStorage(page)).toEqual([])
})

test('Rechazar: el aviso se va, no se guarda nada de PostHog y se recuerda', async ({ page }) => {
  const requests = await fakePostHog(page)
  await page.goto('/?lang=es')
  await banner(page).getByRole('button', { name: 'Rechazar' }).click()
  await expect(banner(page)).toHaveCount(0)
  await posthogStarted(requests)
  await page.waitForTimeout(500)
  expect(await phStorage(page)).toEqual([])
  await page.reload()
  await page.waitForTimeout(500)
  await expect(banner(page)).toHaveCount(0)
  expect(await phStorage(page)).toEqual([])
})

test('Aceptar: el aviso se va, PostHog guarda su identificador y se recuerda', async ({ page }) => {
  const requests = await fakePostHog(page)
  await page.goto('/?lang=es')
  await banner(page).getByRole('button', { name: 'Aceptar' }).click()
  await expect(banner(page)).toHaveCount(0)
  await posthogStarted(requests)
  await expect.poll(() => phStorage(page), { timeout: 10_000 }).not.toEqual([])
  await page.reload()
  await page.waitForTimeout(500)
  await expect(banner(page)).toHaveCount(0)
})

test('aceptar y luego rechazar desde el pie borra lo de PostHog', async ({ page }) => {
  const requests = await fakePostHog(page)
  await page.goto('/?lang=es')
  await banner(page).getByRole('button', { name: 'Aceptar' }).click()
  await posthogStarted(requests)
  await expect.poll(() => phStorage(page), { timeout: 10_000 }).not.toEqual([])
  const prefs = page.getByRole('button', { name: 'Preferencias de privacidad' })
  await prefs.scrollIntoViewIfNeeded()
  await prefs.click()
  const decline = banner(page).getByRole('button', { name: 'Rechazar' })
  await expect(decline).toBeFocused()
  await decline.click()
  await expect.poll(async () => (await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('ph_')))).length).toBe(0)
})

test('en inglés', async ({ page }) => {
  await fakePostHog(page)
  await page.goto('/?lang=en')
  const region = page.getByRole('region', { name: 'Privacy' })
  await expect(region.getByRole('button', { name: 'Accept' })).toBeVisible()
  await expect(region.getByRole('button', { name: 'Decline' })).toBeVisible()
  await expect(region.getByRole('link', { name: 'Privacy notice' })).toHaveAttribute('href', '/privacy/')
})

test('a 320 px el aviso no tapa el botón principal ni desborda', async ({ page }) => {
  await fakePostHog(page)
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/?lang=es')
  await expect(banner(page)).toBeVisible()
  const cta = (await page.getByRole('button', { name: 'Acércame' }).first().boundingBox())!
  const box = (await banner(page).boundingBox())!
  expect(cta.y + cta.height).toBeLessThanOrEqual(box.y)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(320)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
})

test('se puede registrar sin contestar el aviso', async ({ page }) => {
  await fakePostHog(page)
  await page.goto('/?lang=es')
  await page.getByRole('button', { name: 'Acércame' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

for (const [path, lang, h1, other] of [
  ['/privacidad/', 'es-MX', 'Aviso de privacidad', 'English'],
  ['/privacy/', 'en', 'Privacy notice', 'Español'],
] as const) {
  test(`${path}: aviso completo, cambio de idioma y preferencias`, async ({ page }) => {
    await fakePostHog(page)
    await page.goto(path)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible()
    await expect(page.getByText('Arnoldo Marcelo Sias Saucedo')).toBeVisible()
    await expect(page.getByRole('link', { name: other })).toBeVisible()
    expect(await page.getByRole('heading', { level: 2 }).count()).toBeGreaterThanOrEqual(8)
    const accept = page.getByRole('button', { name: lang === 'en' ? 'Accept' : 'Aceptar' })
    await accept.click()
    await expect(accept).toHaveAttribute('aria-pressed', 'true')
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cerca:consent')!).value)).toBe('granted')
  })
}
