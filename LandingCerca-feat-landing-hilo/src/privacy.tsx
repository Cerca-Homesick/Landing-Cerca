import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BRAND_NAME } from './brand'
import { writeConsent, readConsent, type Consent } from './consent'
import { CONTACT_EMAIL, PRIVACY } from './privacy-copy'

/** F1 · Página del aviso de privacidad (/privacidad/ y /privacy/). */
const lang = document.body.dataset.lang === 'en' ? 'en' : 'es'

function PrivacyPage() {
  const t = PRIVACY[lang]
  const [consent, setConsent] = useState<Consent | null>(readConsent)
  const choose = (value: Consent) => {
    writeConsent(value)
    setConsent(value)
  }
  const choice = {
    es: {
      granted: 'Aceptaste la cookie de análisis.',
      denied: 'Rechazaste la cookie de análisis.',
      none: 'Aún no has decidido sobre la cookie de análisis.',
      accept: 'Aceptar',
      decline: 'Rechazar',
    },
    en: {
      granted: 'You accepted the analytics cookie.',
      denied: 'You declined the analytics cookie.',
      none: 'You haven’t decided about the analytics cookie yet.',
      accept: 'Accept',
      decline: 'Decline',
    },
  }[lang]
  return (
    <div className="legal">
      <header className="wrap legal__header">
        <a className="wordmark" href={lang === 'en' ? '/?lang=en' : '/?lang=es'}>
          {BRAND_NAME}
        </a>
        <a className="legal__other" href={t.other.href} lang={t.other.lang}>
          {t.other.label}
        </a>
      </header>
      <main className="wrap legal__body">
        <h1>{t.title}</h1>
        <p className="legal__updated">{t.updated}</p>
        <p>{t.intro}</p>
        {CONTACT_EMAIL && (
          <p>
            {t.contact} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        )}
        {t.sections.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            {s.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
        <section className="legal__prefs" aria-labelledby="prefs-title">
          <h2 id="prefs-title">{t.prefs}</h2>
          <p role="status">{consent ? choice[consent] : choice.none}</p>
          <div className="consent__actions">
            <button
              type="button"
              className="btn btn--consent"
              aria-pressed={consent === 'denied'}
              onClick={() => choose('denied')}
            >
              {choice.decline}
            </button>
            <button
              type="button"
              className="btn btn--consent"
              aria-pressed={consent === 'granted'}
              onClick={() => choose('granted')}
            >
              {choice.accept}
            </button>
          </div>
        </section>
        <p>
          <a href={lang === 'en' ? '/?lang=en' : '/?lang=es'}>{t.back}</a>
        </p>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivacyPage />
  </StrictMode>,
)
