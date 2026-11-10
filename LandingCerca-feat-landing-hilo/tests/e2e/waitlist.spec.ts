import { expect, test, type Page } from '@playwright/test'

/*
 * Lista de espera con Tally (el formulario que está en producción).
 *
 * Tally se simula: el widget y el formulario se sirven desde aquí con
 * `page.route`, así que estas pruebas NUNCA mandan datos a Tally (ni a
 * Supabase ni a Google Sheets, que reciben lo que Tally envía). La página
 * falsa vive en https://tally.so, de modo que sus `postMessage` llegan con el
 * mismo origen que los reales.
 *
 * Para revisar que el formulario real carga (sin enviarlo): LIVE_TALLY=1.
 */

import { FORM_ID, fakeTally, recordEvents, quietPage } from './helpers'

const LIVE = !!process.env.LIVE_TALLY

// El aviso de privacidad no es tema de estas pruebas: la decisión ya está tomada.
test.beforeEach(async ({ page }) => {
  if (!LIVE) await quietPage(page)
  else await page.addInitScript(() => localStorage.setItem('cerca:consent', JSON.stringify({ value: 'denied', version: 1, at: '' })))
})

const dialog = (page: Page) => page.getByRole('dialog')
const frame = (page: Page) => page.frameLocator('dialog iframe')

test.describe('formulario de Tally (simulado)', () => {
  test.skip(LIVE, 'solo la prueba en vivo')

  test('cada botón abre el diálogo con el formulario', async ({ page }) => {
    await fakeTally(page)
    await page.goto('/?lang=es')
    const ctas = [
      page.locator('header').getByRole('button', { name: 'Lista de espera' }),
      page.getByRole('button', { name: 'Acércame' }).first(),
      page.getByRole('button', { name: 'Acércame' }).nth(1),
      page.getByRole('button', { name: 'Unirme a la lista' }),
    ]
    for (const cta of ctas) {
      await cta.scrollIntoViewIfNeeded()
      await expect(cta).toHaveAttribute('aria-haspopup', 'dialog')
      await cta.click()
      await expect(dialog(page)).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Lista de espera de CERCA' })).toBeVisible()
      const iframe = dialog(page).locator('iframe')
      await expect(iframe).toHaveAttribute('title', 'Formulario de la lista de espera de CERCA')
      await expect(iframe).toHaveAttribute('src', new RegExp(`^https://tally\\.so/embed/${FORM_ID}\\?`))
      await expect(frame(page).getByLabel('Email')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog(page)).toBeHidden()
      await expect(cta).toBeFocused()
    }
  })

  test('enviar dentro del diálogo: lo cierra, agradece y cuenta una sola conversión', async ({ page }) => {
    const leaked = await fakeTally(page)
    const events = await recordEvents(page)
    await page.goto('/?lang=es')
    await page.getByRole('button', { name: 'Acércame' }).first().click()
    await frame(page).getByLabel('Email').fill('prueba@example.com')
    await frame(page).getByRole('button', { name: 'Submit', exact: true }).click()
    await expect(dialog(page)).toBeHidden()
    await expect(page.getByRole('status')).toContainText('¡Listo!')
    await expect(page.getByRole('status')).toContainText('Ya estás en la lista de espera de CERCA')
    const list = await events()
    expect(list.filter((e) => e.event === 'waitlist_cta_click')).toEqual([
      expect.objectContaining({ location: 'hero', lang: 'es' }),
    ])
    expect(list.filter((e) => e.event === 'waitlist_signup_confirmed')).toEqual([{ event: 'waitlist_signup_confirmed', via: 'modal' }])
    expect(leaked).toEqual([])
  })

  test('el aviso de gracias se puede cerrar', async ({ page }) => {
    await fakeTally(page)
    await page.goto('/?lang=es')
    await page.getByRole('button', { name: 'Acércame' }).first().click()
    await frame(page).getByLabel('Email').fill('prueba@example.com')
    await frame(page).getByRole('button', { name: 'Submit', exact: true }).click()
    await page.getByRole('button', { name: 'Cerrar aviso' }).click()
    await expect(page.getByRole('status')).toHaveCount(0)
  })

  test('abrir y cerrar sin enviar no cuenta como registro', async ({ page }) => {
    await fakeTally(page)
    const events = await recordEvents(page)
    await page.goto('/?lang=es')
    const cta = page.getByRole('button', { name: 'Acércame' }).first()
    // Cerrar con la X
    await cta.click()
    await expect(frame(page).getByLabel('Email')).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar la lista de espera' }).click()
    await expect(dialog(page)).toBeHidden()
    await expect(cta).toBeFocused()
    // Cerrar tocando fuera (el fondo del diálogo)
    await cta.click()
    await expect(dialog(page)).toBeVisible()
    // Tocar el fondo cierra (en teléfono el diálogo ocupa toda la pantalla y no hay fondo que tocar).
    const box = (await dialog(page).boundingBox())!
    const view = page.viewportSize()!
    if (box.y > 20) {
      await page.mouse.click(view.width / 2, box.y / 2)
    } else {
      await page.keyboard.press('Escape')
    }
    await expect(dialog(page)).toBeHidden()
    expect((await events()).some((e) => e.event === 'waitlist_signup_confirmed')).toBe(false)
    await expect(page.getByText('¡Listo!')).toHaveCount(0)
  })

  test('un «FormSubmitted» que no viene de tally.so se ignora', async ({ page }) => {
    await fakeTally(page)
    await page.goto('/?lang=es')
    await page.getByRole('button', { name: 'Acércame' }).first().click()
    await expect(frame(page).getByLabel('Email')).toBeVisible()
    await page.evaluate(() => window.postMessage(JSON.stringify({ event: 'Tally.FormSubmitted' }), '*'))
    await page.waitForTimeout(300)
    await expect(dialog(page)).toBeVisible()
    await expect(page.getByText('¡Listo!')).toHaveCount(0)
  })

  test('agradecimiento con redirección dentro del iframe también confirma', async ({ page }) => {
    // Si en Tally el agradecimiento redirige a la landing con ?registro=confirmado,
    // esa página carga DENTRO del iframe y avisa a la de arriba. (No se navega
    // desde tally.so falso a localhost porque Chromium bloquea ese salto en local;
    // en producción el destino es el dominio público.)
    await fakeTally(page)
    const events = await recordEvents(page)
    await page.goto('/?lang=es')
    await page.getByRole('button', { name: 'Acércame' }).first().click()
    await expect(frame(page).getByLabel('Email')).toBeVisible()
    await page.evaluate(() => {
      const f = document.createElement('iframe')
      f.id = 'thanks-frame'
      f.src = '/?lang=es&registro=confirmado'
      document.querySelector('dialog')!.appendChild(f)
    })
    await expect(page.frameLocator('#thanks-frame').locator('body')).toContainText('Ya estás en la lista de espera de CERCA')
    await expect(page.frameLocator('#thanks-frame').locator('main')).toHaveCount(0)
    await expect(dialog(page)).toBeHidden()
    await expect(page.getByRole('status')).toContainText('¡Listo!')
    expect((await events()).filter((e) => e.event === 'waitlist_signup_confirmed')).toEqual([
      { event: 'waitlist_signup_confirmed', via: 'modal' },
    ])
  })

  test('mientras Tally no responde se ve «Cargando el formulario…»', async ({ page }) => {
    await fakeTally(page, { form: 'silent' })
    await page.route(`https://tally.so/embed/${FORM_ID}**`, async (route) => {
      await new Promise((r) => setTimeout(r, 1500))
      await route.fulfill({ contentType: 'text/html', body: '<p>late</p>' })
    })
    await page.goto('/?lang=es')
    await page.getByRole('button', { name: 'Acércame' }).first().click()
    await expect(dialog(page).getByText('Cargando el formulario…')).toBeVisible()
    await expect(dialog(page).getByText('Cargando el formulario…')).toBeHidden({ timeout: 5000 })
  })

  test('si el widget de Tally no carga, el formulario se abre igual', async ({ page }) => {
    await fakeTally(page, { widget: 'fail' })
    await page.goto('/?lang=es')
    await page.getByRole('button', { name: 'Acércame' }).first().click()
    await expect(dialog(page).locator('iframe')).toHaveAttribute('src', new RegExp(`/embed/${FORM_ID}`))
    await expect(frame(page).getByLabel('Email')).toBeVisible()
  })

  test('el enlace alternativo abre el formulario público en otra pestaña', async ({ page }) => {
    await fakeTally(page)
    await page.goto('/?lang=es')
    await page.getByRole('button', { name: 'Acércame' }).first().click()
    const alt = dialog(page).getByRole('link', { name: 'Abre el formulario en una pestaña nueva' })
    await expect(alt).toHaveAttribute('href', `https://tally.so/r/${FORM_ID}`)
    await expect(alt).toHaveAttribute('target', '_blank')
    await expect(alt).toHaveAttribute('rel', /noopener/)
  })

  test('volver con ?registro=confirmado agradece, cuenta «direct» y limpia la URL', async ({ page }) => {
    const events = await recordEvents(page)
    await page.goto('/?lang=es&registro=confirmado&utm_source=x')
    await expect(page.getByRole('status')).toContainText('¡Listo!')
    await expect(page).not.toHaveURL(/registro=/)
    await expect(page).toHaveURL(/utm_source=x/)
    expect((await events()).filter((e) => e.event === 'waitlist_signup_confirmed')).toEqual([
      { event: 'waitlist_signup_confirmed', via: 'direct' },
    ])
  })

  test('en inglés', async ({ page }) => {
    await fakeTally(page)
    await page.goto('/?lang=en')
    await page.getByRole('button', { name: 'Bring me closer' }).first().click()
    await expect(page.getByRole('heading', { name: 'Waitlist' }).last()).toBeVisible()
    await frame(page).getByLabel('Email').fill('test@example.com')
    await frame(page).getByRole('button', { name: 'Submit', exact: true }).click()
    await expect(dialog(page)).toBeHidden()
    await expect(page.getByRole('status')).toBeVisible()
  })

  test('a 320 px el diálogo cabe y la X mide al menos 44 px', async ({ page }) => {
    await fakeTally(page)
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/?lang=es')
    await page.getByRole('button', { name: 'Acércame' }).first().click()
    await expect(frame(page).getByLabel('Email')).toBeVisible()
    const box = (await dialog(page).boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(320)
    const close = (await page.getByRole('button', { name: 'Cerrar la lista de espera' }).boundingBox())!
    expect(Math.round(close.width)).toBeGreaterThanOrEqual(44)
    expect(Math.round(close.height)).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
  })
})

test.describe('formulario de Tally en vivo (sin enviar)', () => {
  test.skip(!LIVE, 'solo con LIVE_TALLY=1')

  async function openLive(page: Page) {
    // Nada sale: se corta todo lo que no sea lectura hacia el API de Tally.
    await page.route('https://api.tally.so/**', (route) =>
      route.request().method() === 'GET' ? route.continue() : route.abort(),
    )
    await page.goto('/?lang=es')
    await page.getByRole('button', { name: 'Acércame' }).first().click()
    await expect(frame(page).locator('input[type="email"]')).toBeVisible({ timeout: 15_000 })
  }

  test('el formulario real carga dentro del diálogo y tiene campo de correo', async ({ page }) => {
    await openLive(page)
    await expect(dialog(page).getByText('Cargando el formulario…')).toBeHidden()
    await expect(frame(page).locator('input[type="email"]')).toHaveAttribute('autocomplete', 'email')
  })

  test('el formulario real valida antes de enviar', async ({ page }) => {
    await openLive(page)
    const submit = frame(page).getByRole('button', { name: /Join/ })
    await submit.click()
    await expect(frame(page).getByRole('alert').first()).toBeVisible()
    await frame(page).locator('input[type="email"]').fill('sin-arroba')
    await submit.click()
    await expect(frame(page).getByText('Please enter a valid email')).toBeVisible()
    await expect(dialog(page)).toBeVisible()
    await expect(page.getByText('¡Listo!')).toHaveCount(0)
  })
})
