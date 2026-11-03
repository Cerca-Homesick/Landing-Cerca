import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useEffect, type RefObject } from 'react'

gsap.registerPlugin(ScrollTrigger, SplitText)
ScrollTrigger.config({ ignoreMobileResize: true })

/*
 * Coreografía de la página. Todo el contenido es visible sin JavaScript y con
 * "reducir movimiento": aquí solo se añade movimiento encima.
 *
 * - Inicio: el titular sube por líneas, las estampillas caen y el matasellos golpea.
 * - Zoom (único tramo fijado, breve): la estampilla crece hasta llenar la
 *   pantalla, el título se separa y la frase aparece línea por línea.
 * - Bandas: el paisaje de cada borde sube; las estampillas entran giradas.
 * - Postal: llega volando y se asienta. Tendedero y boleto final con rebote.
 *
 * Nada que contenga un `data-anchor` se mueve con parallax: el hilo se calcula
 * con posiciones sin transformar y debe coincidir con sus nodos.
 */
export function useMotion(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = document.documentElement
    let mm: gsap.MatchMedia | null = null
    let cancelled = false

    document.fonts.ready.then(() => {
      if (cancelled || !scope.current) return
      mm = gsap.matchMedia()
      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)', small: '(max-width: 760px)' },
        (ctx) => {
          const { motion, small } = ctx.conditions as { motion: boolean; small: boolean }
          root.classList.remove('js-motion')
          if (!motion) return
          heroIntro()
          const undoZoom = zoomIntoStamp(small)
          bands(small)
          postcard(small)
          finale()
          return undoZoom
        },
        scope.current,
      )
      ScrollTrigger.refresh()
    })

    // Si algo falla, el contenido nunca se queda oculto.
    const safety = window.setTimeout(() => root.classList.remove('js-motion'), 2500)

    return () => {
      cancelled = true
      window.clearTimeout(safety)
      mm?.revert()
    }
  }, [scope])
}

function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
  SplitText.create('[data-hero-lines]', {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    onSplit: (self) =>
      tl.from(self.lines, { yPercent: 110, duration: 1.1, stagger: 0.09 }, 0.05),
  })
  tl.from('[data-hero-fade]', { y: 18, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.45)
    .from(
      '[data-hero-stamp]',
      {
        y: -80,
        rotation: (i: number) => (i ? -22 : 18),
        opacity: 0,
        duration: 1.2,
        ease: 'back.out(1.5)',
        stagger: 0.14,
      },
      0.2,
    )
    .from('[data-hero-postmark]', { scale: 1.7, rotation: -24, opacity: 0, duration: 0.42, ease: 'power4.in' }, 1)
    .to('[data-hero-postmark]', { scale: 1.06, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' })
}

function zoomIntoStamp(small: boolean) {
  const section = document.querySelector<HTMLElement>('[data-zoom]')
  const stamp = section?.querySelector<HTMLElement>('[data-zoom-stamp]')
  if (!section || !stamp) return

  section.classList.add('is-cinematic')
  const rest = SplitText.create('[data-zoom-rest]', { type: 'lines' })
  const fill = () => Math.max(window.innerWidth / stamp.offsetWidth, window.innerHeight / stamp.offsetHeight) * 1.3

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: small ? '+=110%' : '+=150%',
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })
  tl.to('[data-zoom-top]', { yPercent: -170, opacity: 0, filter: 'blur(10px)', ease: 'power2.in', duration: 0.5 }, 0)
    .to('[data-zoom-bottom]', { yPercent: 170, opacity: 0, filter: 'blur(10px)', ease: 'power2.in', duration: 0.5 }, 0)
    .fromTo(stamp, { scale: 1, rotation: 4 }, { scale: fill, rotation: 0, ease: 'power2.inOut', duration: 0.7 }, 0.04)
    .from('[data-zoom-rest]', { opacity: 0, scale: 0.8, rotation: -8, duration: 0.14, ease: 'back.out(2)' }, 0.56)
    .from(
      rest.lines,
      { yPercent: 70, opacity: 0, filter: 'blur(12px)', stagger: 0.07, duration: 0.28, ease: 'power2.out' },
      0.62,
    )
    .to({}, { duration: 0.16 })

  return () => {
    rest.revert()
    section.classList.remove('is-cinematic')
  }
}

function bands(small: boolean) {
  gsap.utils.toArray<SVGElement>('[data-terrain]').forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: 55 },
      {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'top 55%', scrub: true },
      },
    )
  })

  gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el, i) => {
    gsap.fromTo(
      el,
      { y: small ? 70 : 150, rotation: i % 2 ? -16 : 14, scale: 0.92 },
      {
        y: 0,
        rotation: 0,
        scale: 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'top 30%', scrub: 0.8 },
      },
    )
  })

  gsap.utils.toArray<HTMLElement>('[data-words]').forEach((el) => {
    SplitText.create(el, {
      type: 'words',
      mask: 'words',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.words, {
          yPercent: 110,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        }),
    })
  })

  gsap.utils.toArray<HTMLElement>('[data-scrub-words]').forEach((el) => {
    SplitText.create(el, {
      type: 'words',
      autoSplit: true,
      onSplit: (self) =>
        gsap.fromTo(
          self.words,
          { opacity: 0.18 },
          {
            opacity: 1,
            stagger: 0.1,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 40%', scrub: true },
          },
        ),
    })
  })
}

function postcard(small: boolean) {
  const card = document.querySelector<HTMLElement>('[data-reveal-card]')
  if (!card) return
  gsap.fromTo(
    card,
    { y: small ? 80 : 200, rotation: small ? -4 : -11, scale: small ? 0.94 : 0.84 },
    {
      y: 0,
      rotation: 0,
      scale: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 30%', scrub: 0.8 },
    },
  )
}

function finale() {
  gsap.utils.toArray<HTMLElement>('.hang').forEach((el, i) => {
    gsap.from(el, {
      y: -30,
      rotation: i % 2 ? 12 : -12,
      opacity: 0,
      duration: 1.2,
      ease: 'elastic.out(1, 0.55)',
      delay: i * 0.08,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    })
  })

  const ticket = document.querySelector<HTMLElement>('[data-ticket]')
  if (!ticket) return
  const tl = gsap.timeline({ scrollTrigger: { trigger: ticket, start: 'top 85%', once: true } })
  tl.from(ticket, { y: -50, rotation: 7, opacity: 0, duration: 1, ease: 'back.out(1.6)' }).from(
    ticket.querySelector('.ticket__postmark'),
    { scale: 1.8, rotation: 30, opacity: 0, duration: 0.4, ease: 'power4.in' },
    0.55,
  )
}
