import { useRef, useState, type CSSProperties } from 'react'
import { Postcard } from './components/Postcard'
import { Postmark } from './components/Postmark'
import { Stamp } from './components/Stamp'
import { Terrain } from './components/Terrain'
import { Thread } from './components/Thread'
import { WaitlistButton, WaitlistProvider } from './components/Waitlist'
import { BRAND_NAME } from './config'
import { DISTANCE, MOMENTS, STATIONS } from './content'
import { LANGS, useCopy, useLang } from './i18n'
import { useMotion } from './motion'

const rot = (deg: number) => ({ '--r': `${deg}deg` }) as CSSProperties

const STATION_LOOK = [
  { band: 'butter', terrain: 'colinas' },
  { band: 'pink', terrain: 'sierra' },
  { band: 'sage', terrain: 'olas' },
] as const

export default function App({ confirmed = false }: { confirmed?: boolean }) {
  const { lang } = useLang()
  const t = useCopy()

  return (
    <WaitlistProvider initialConfirmed={confirmed}>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <header className="site-header">
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
      {/* Al cambiar de idioma se vuelve a montar el recorrido: SplitText y el hilo
          se recalculan sobre el texto nuevo. */}
      <Journey key={lang} />
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

function Journey() {
  const journeyRef = useRef<HTMLElement>(null)
  const [discovered, setDiscovered] = useState<string[]>([])
  const t = useCopy()

  useMotion(journeyRef)

  return (
    <>
      <main id="main" className="journey" ref={journeyRef}>
        <Thread rootRef={journeyRef} />

        {/* Inicio */}
        <section className="band band--blue hero" aria-labelledby="hero-title">
          <div className="hero__text">
            <h1 id="hero-title" className="hero__title">
              <span className="display" data-hero-lines>
                {t.hero.title}
              </span>
              <em className="hero__turn" data-hero-fade>
                {t.hero.turn}
              </em>
            </h1>
            <p className="lede" data-hero-fade>
              {t.hero.lede}
            </p>
            <div className="cta-row" data-hero-fade>
              <WaitlistButton location="hero">{t.hero.cta}</WaitlistButton>
              <p className="cta-note">{t.hero.ctaNote}</p>
            </div>
            <p className="platform" data-hero-fade>
              {t.hero.platform}
            </p>
          </div>

          <div className="hero__collage">
            <figure className="place place--far">
              <span className="node node--pin" data-anchor aria-hidden="true" />
              <div className="place__card" data-hero-stamp style={rot(5)}>
                <Stamp art="napoles" tone="sky" />
              </div>
              <figcaption className="tag tag--cream">
                {t.people.valeria.city} <span>{t.hero.farTime}</span>
              </figcaption>
            </figure>
            <figure className="place place--near">
              <span className="node node--pin" data-anchor aria-hidden="true" />
              <div className="place__card" data-hero-stamp style={rot(-5)}>
                <Stamp art="monterrey" tone="butter" />
              </div>
              <figcaption className="tag tag--butter">
                {t.people.mama.city} <span>{t.hero.nearTime}</span>
              </figcaption>
              <span className="anchor-ghost place__exit" data-anchor aria-hidden="true" />
            </figure>
            <div className="hero__postmark" data-hero-postmark>
              <Postmark ring={t.hero.postmark} center={`${DISTANCE.km}`} sub="KM" waves />
            </div>
            <p className="coords" aria-hidden="true">
              {t.hero.coords}
            </p>
          </div>

          <a className="scroll-hint hand" href="#recorrido">
            {t.hero.scroll}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4v15M6 13l6 6 6-6" />
            </svg>
          </a>
        </section>

        {/* Zoom: dentro de la estampilla */}
        <section className="band band--green zoom" id="recorrido" aria-labelledby="zoom-title" data-zoom>
          <Terrain shape="dunas" />
          <div className="zoom__stage">
            <h2 id="zoom-title" className="zoom__title">
              <span className="zoom__word zoom__word--top" data-zoom-top>
                {t.zoom.top}
              </span>{' '}
              <span className="zoom__word zoom__word--bottom" data-zoom-bottom>
                {t.zoom.bottom}
              </span>{' '}
              <span className="zoom__rest" data-zoom-rest>
                {t.zoom.rest}
              </span>
            </h2>
            <div className="zoom__stamp" data-zoom-stamp>
              <Stamp art="lluvia" tone="sky" />
            </div>
          </div>
        </section>

        {/* Estaciones */}
        {STATIONS.map((s, i) => {
          const look = STATION_LOOK[i]
          const text = t.stations[s.id]
          const right = i % 2 === 0
          return (
            <section
              key={s.id}
              className={`band band--${look.band} station station--${right ? 'right' : 'left'}`}
              aria-label={text.kicker}
            >
              <Terrain shape={look.terrain} />
              <div className="station__media">
                <span className="node node--pin" data-anchor aria-hidden="true" />
                <div className="station__card" data-rise style={rot([5, -4, 3][i])}>
                  <Stamp art={s.art} tone={s.tone} />
                </div>
                <span className="anchor-ghost station__exit" data-anchor aria-hidden="true" />
              </div>
              <div className="station__text">
                <p className="station__phrase" data-words>
                  {t.quote(text.phrase)}
                </p>
                <p className="hand station__note">{text.kicker}</p>
                <p className="station__meta">{text.meta}</p>
                {i === STATIONS.length - 1 && (
                  <p className="station__bridge">{t.bridge}</p>
                )}
              </div>
            </section>
          )
        })}

        {/* La postal */}
        <section className="band band--cream postcard-section" aria-labelledby="postcard-title">
          <Terrain shape="mesa" />
          <div className="postcard-section__intro">
            <h2 id="postcard-title" className="display-md" data-words>
              {t.postcardIntro.title}
            </h2>
            <p>{t.postcardIntro.text}</p>
          </div>
          <Postcard onDiscover={(id) => setDiscovered((d) => (d.includes(id) ? d : [...d, id]))} />
          <div className="mid-cta">
            <p>{t.midCta.question}</p>
            <WaitlistButton location="postcard">{t.midCta.cta}</WaitlistButton>
            <p className="cta-note">{t.midCta.note}</p>
          </div>
        </section>

        {/* El beneficio */}
        <section className="band band--sky benefit" aria-labelledby="benefit-title">
          <Terrain shape="colinas" />
          <h2 id="benefit-title" className="display-md benefit__title" data-scrub-words>
            {t.benefit.title}
          </h2>
          <p className="benefit__text">{t.benefit.text}</p>
          <div className="clothesline">
            <span className="node node--nail clothesline__start" data-anchor data-tangent-out="1,0.18" aria-hidden="true" />
            <ul className="clothesline__items" aria-label={t.benefit.line}>
              {MOMENTS.map((m, i) => {
                const seen = discovered.includes(m.id)
                const text = t.moments[m.id]
                return (
                  <li key={m.id} className="hang" data-open={seen} style={rot([-4, 3, -2, 4][i])}>
                    <span className="hang__pin" aria-hidden="true" />
                    <Stamp art={m.art} tone={m.tone} image={m.image} />
                    <span className="hang__label hand">
                      <span className="hang__label-short">{text.label}</span>
                      {seen && <span className="hang__label-full">{t.quote(text.message)}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
            <span className="node node--nail clothesline__end" data-anchor data-tangent="1,-0.18" data-tangent-out="0,1" aria-hidden="true" />
          </div>
        </section>

        {/* El destino */}
        <section className="band band--blue destination" aria-labelledby="final-title">
          <Terrain shape="sierra" />
          <div className="xmark" data-x-mark aria-hidden="true">
            <span className="hand xmark__label">{t.final.mark}</span>
          </div>
          <div className="ticket" data-ticket>
            <h2 id="final-title" className="display-md">
              {t.final.title}
            </h2>
            <p>{t.final.text}</p>
            <WaitlistButton location="final">{t.final.cta}</WaitlistButton>
            <Postmark className="ticket__postmark" ring={t.final.postmarkRing} center={t.final.postmarkCenter} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <p className="wordmark wordmark--small">{BRAND_NAME}</p>
        <p>{t.footer}</p>
      </footer>
    </>
  )
}
