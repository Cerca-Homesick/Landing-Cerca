import { expect, test } from '@playwright/test'
import { fakeTally, quietPage, recordEvents } from './helpers'

/*
 * F2 · Eventos del embudo. Se leen de `cerca:analytics`, que es lo mismo que
 * recibe PostHog (simulado aquí).
 */

test.beforeEach(async ({ page }) => {
  await quietPage(page)
})

test('cada escena cuenta una vez y en orden al bajar por la página', async ({ page }) => {
  const events = await recordEvents(page)
  await page.goto('/?lang=es')
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y <= height; y += 300) {
    await page.evaluate((top) => scrollTo(0, top), y)
    await page.waitForTimeout(60)
  }
  await page.evaluate(() => scrollTo(0, 0))
  await page.waitForTimeout(300)
  const scenes = (await events()).filter((e) => e.event === 'scene_view').map((e) => e.scene)
  expect(scenes).toEqual(['hero', 'dia', 'carta', 'sello', 'distancia', 'llegada', 'album', 'final'])
})

test('cambiar de idioma cuenta lang_change y no repite escenas', async ({ page }) => {
  const events = await recordEvents(page)
  await page.goto('/?lang=es')
  await expect.poll(async () => (await events()).some((e) => e.scene === 'hero')).toBe(true)
  await page.getByRole('button', { name: 'English' }).click()
  await page.waitForTimeout(400)
  const list = await events()
  expect(list.filter((e) => e.event === 'lang_change')).toEqual([{ event: 'lang_change', from: 'es', to: 'en' }])
  expect(list.filter((e) => e.scene === 'hero')).toHaveLength(1)
})

test('formulario: botón → cargado → abandonado, con el botón de origen', async ({ page }) => {
  await fakeTally(page)
  const events = await recordEvents(page)
  await page.goto('/?lang=es')
  await page.locator('header').getByRole('button', { name: 'Lista de espera' }).click()
  await expect(page.frameLocator('dialog iframe').getByLabel('Email')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  const list = (await events()).filter((e) => e.event.startsWith('waitlist_') || e.event.startsWith('form_'))
  expect(list.map((e) => e.event)).toEqual(['waitlist_cta_click', 'form_loaded', 'form_abandoned'])
  expect(list[1]).toMatchObject({ location: 'header' })
  expect(Number(list[1].ms)).toBeGreaterThanOrEqual(0)
  expect(list[2]).toMatchObject({ location: 'header', loaded: true })
})

test('formulario enviado: confirma y no cuenta como abandonado', async ({ page }) => {
  await fakeTally(page)
  const events = await recordEvents(page)
  await page.goto('/?lang=es')
  await page.getByRole('button', { name: 'Acércame' }).first().click()
  const frame = page.frameLocator('dialog iframe')
  await frame.getByLabel('Email').fill('prueba@example.com')
  await frame.getByRole('button', { name: 'Submit', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  const names = (await events()).map((e) => e.event)
  expect(names).toContain('waitlist_signup_confirmed')
  expect(names).not.toContain('form_abandoned')
})

test('ningún evento lleva datos personales', async ({ page }) => {
  await fakeTally(page)
  const events = await recordEvents(page)
  await page.goto('/?lang=es&utm_source=instagram')
  await page.getByRole('button', { name: 'Acércame' }).first().click()
  const frame = page.frameLocator('dialog iframe')
  await frame.getByLabel('Email').fill('privado@example.com')
  await frame.getByRole('button', { name: 'Submit', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(JSON.stringify(await events())).not.toMatch(/@|privado/)
})

test('velocidad real: se reporta el LCP', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'web-vitals mide LCP en Chromium')
  const events = await recordEvents(page)
  await page.goto('/?lang=es')
  await page.waitForTimeout(800)
  await page.mouse.click(5, 300) // el LCP se reporta con la primera interacción
  await expect
    .poll(async () => (await events()).find((e) => e.event === 'web_vitals' && e.metric === 'LCP'))
    .toMatchObject({ metric: 'LCP', rating: expect.stringMatching(/good|needs-improvement|poor/) })
})

test('con clave de PostHog, los eventos sí salen hacia PostHog (simulado)', async ({ page }) => {
  // quietPage ya simula PostHog; aquí solo se mira que haya envíos.
  const sent: string[] = []
  page.on('request', (r) => r.url().includes('i.posthog.com') && r.method() === 'POST' && sent.push(r.url()))
  await page.goto('/?lang=es')
  await expect.poll(() => sent.length, { timeout: 15_000 }).toBeGreaterThan(0)
})
