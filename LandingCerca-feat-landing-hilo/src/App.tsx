import { useEffect, useRef, type RefObject } from 'react'
import { track } from './analytics'
import { Album } from './components/Album'
import { ConsentBanner } from './components/ConsentBanner'
import { Envelope } from './components/Envelope'
import { Flight } from './components/Flight'
import { Letter } from './components/Letter'
import { Pigeon } from './components/Pigeon'
import { Postmark } from './components/Postmark'
import { Stamp } from './components/Stamp'
import { WaitlistButton, WaitlistProvider } from './components/Waitlist'
import { BRAND_NAME } from './config'
import { openConsent } from './consent'
import { DISTANCE, STATIONS } from './content'
import { LANGS, useCopy, useLang } from './i18n'

export default function App({ confirmed = false }: { confirmed?: boolean }) {
  const { lang } = useLang()
  const t = useCopy()

  return (
    <WaitlistProvider initialConfirmed={confirmed}>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <header className="wrap site-header">
        <a className="wordmark" href="#main" aria-label={t.home}>
          {BRAND_NAME}
        </a>
        <div className="site-header__end">
          <LangSwitch />
          <WaitlistButton location="header" variant="small">
            {t.headerCta}
          </WaitlistButton>
        </div>
      </header>
      {/* Al cambiar de idioma se vuelve a montar el vuelo: la ruta se recalcula sobre el texto nuevo. */}
      <Journey key={lang} />
      <ConsentBanner />
    </WaitlistProvider>
  )
}

function LangSwitch() {
  const { lang, setLang } = useLang()
  const t = useCopy()
  return (
    <div className="lang-switch" role="group" aria-label={t.lang.label}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-label={t.lang[l]}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

const CLOUDS = [
  { top: '2%', left: '-9%', width: '17vw' },
  { top: '24%', left: '91%', width: '15vw' },
  { top: '47%', left: '-7%', width: '14vw' },
  { top: '70%', left: '90%', width: '18vw' },
]

function Clouds() {
  return (
    <div className="clouds" aria-hidden="true">
      {CLOUDS.map((style) => (
        <svg key={style.top} viewBox="0 0 320 110" style={style}>
          <path d="M28 104c-24 0-34-27-14-38 2-24 34-33 50-17C76 18 124 8 150 34c18-22 64-16 72 14 20-12 52-2 54 22 26 2 34 34 6 34z" />
        </svg>
      ))}
    </div>
  )
}

/** Escenas ya vistas en esta visita: cada una cuenta una vez, aunque cambie el idioma. */
const seenScenes = new Set<string>()

/**
 * `scene_view` cuando la persona llega a una escena: su borde de arriba pasa
 * del 60 % de la ventana. Cuenta también las que cruza bajando rápido, en orden.
 */
function useSceneViews(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scenes = [...document.querySelectorAll<HTMLElement>('[data-view]')]
    let frame = 0
    const check = () => {
      frame = 0
      const line = window.innerHeight * 0.6
      for (const el of scenes) {
        const scene = el.dataset.view!
        if (seenScenes.has(scene) || el.getBoundingClientRect().top > line) continue
        seenScenes.add(scene)
        track('scene_view', { scene, order: seenScenes.size })
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [root])
}

function Journey() {
  const journeyRef = useRef<HTMLElement>(null)
  const t = useCopy()
  useSceneViews(journeyRef)

  return (
    <>
      <main id="main" className="journey" ref={journeyRef}>
        <Flight rootRef={journeyRef} />

        <section className="wrap hero" data-view="hero" aria-labelledby="hero-title">
          <div className="hero__text">
            <h1 id="hero-title">
              <span className="display">{t.hero.title}</span>
              <em className="turn">{t.hero.turn}</em>
            </h1>
            <div className="cta-row">
              <WaitlistButton location="hero">{t.hero.cta}</WaitlistButton>
              <p className="cta-note">{t.hero.ctaNote}</p>
            </div>
          </div>
          <div className="hero__stage">
            <div className="hero__home" data-home />
            <p className="tag tag--butter hero__from">
              <span className="pin" data-origin aria-hidden="true" />
              {t.hero.from} <span>{t.hero.fromTime}</span>
            </p>
            <p className="tag hero__to">
              <span className="node" data-sign aria-hidden="true" />
              {t.hero.to} <span>{t.hero.toTime}</span>
            </p>
          </div>
        </section>

        <div className="sky">
          <Clouds />

          <section className="scene" data-scene="left" data-open data-view="dia" aria-labelledby="day-title">
            <div className="wrap">
              <div className="scene__body">
                <h2 id="day-title" className="line">
                  {t.day}
                </h2>
                <ul className="pile">
                  {STATIONS.map((s) => (
                    <li key={s.id} data-fill>
                      <Stamp art={s.art} tone={s.tone} tilt={s.tilt} alt={t.art[s.art]} />
                      <p className="hand pile__note">{t.stations[s.id]}</p>
                    </li>
                  ))}
                </ul>
                <div className="park" data-park />
              </div>
            </div>
          </section>

          <section className="scene" data-scene="right" data-view="carta" aria-labelledby="letter-title">
            <div className="wrap">
              <div className="scene__body">
                <h2 id="letter-title" className="line">
                  {t.letter.line}
                </h2>
                <span className="demo-tag">{t.letter.sample}</span>
                <Letter />
              </div>
            </div>
          </section>

          <section className="scene" data-scene="left" data-seal data-view="sello" aria-labelledby="seal-title">
            <div className="wrap">
              <div className="scene__body">
                <h2 id="seal-title" className="line">
                  {t.seal.line}
                </h2>
                <div className="park" data-park />
                {/* Con "reducir movimiento" el sobre no viaja: aquí se ve ya sellado. */}
                <div className="seal-still" aria-hidden="true">
                  <Envelope state="closed" />
                </div>
                <div className="ask">
                  <WaitlistButton location="seal">{t.seal.cta}</WaitlistButton>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="dusk">
          <section className="scene" data-scene="right" data-view="distancia" aria-label={`${DISTANCE} ${t.distance.km}`}>
            <div className="wrap">
              <div className="scene__body">
                <p className="luggage">
                  <span className="distance__km">
                    {DISTANCE} {t.distance.km}
                  </span>
                  <span className="hand luggage__rest">{t.distance.rest}</span>
                </p>
                <div className="park" data-park />
              </div>
            </div>
          </section>

          <section className="arrival" data-view="llegada" aria-label={t.arrival.done}>
            <div className="landed" data-landed>
              <Envelope state="open" stamps={3} />
              <Pigeon pose="happy" className="landed__pigeon" alt={t.arrival.pigeon} />
            </div>
            <span className="pin arrival__pin" data-arrival aria-hidden="true" />
            <p className="tag arrival__tag">
              {t.hero.to} <span>{t.hero.toTime}</span>
            </p>
            <p className="hand arrival__done">{t.arrival.done}</p>
          </section>
        </div>

        <div className="night">
          <section className="wrap keep" data-view="album" aria-labelledby="album-title">
            <h2 id="album-title" className="line">
              {t.album.line}
            </h2>
            <Album />
          </section>

          <section className="wrap destination" data-view="final" aria-labelledby="final-title">
            <div className="ticket">
              <h2 id="final-title" className="line">
                {t.final.line}
              </h2>
              <WaitlistButton location="final">{t.final.cta}</WaitlistButton>
              <div className="ticket__postmark" aria-hidden="true">
                <Postmark ring={t.final.postmarkRing} center={t.final.postmarkCenter} />
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="wrap">
          <p className="wordmark wordmark--small">{BRAND_NAME}</p>
          <p>{t.footer}</p>
          <p className="footer__links">
            <a href={t.privacy.noticeHref}>{t.privacy.notice}</a>
            <button type="button" onClick={openConsent}>
              {t.privacy.prefs}
            </button>
          </p>
        </div>
      </footer>
    </>
  )
}
