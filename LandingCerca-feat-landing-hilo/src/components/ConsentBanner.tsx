import { useEffect, useRef, useState } from 'react'
import { onConsentOpen, readConsent, writeConsent, type Consent } from '../consent'
import { useCopy } from '../i18n'

/*
 * F1 · Aviso de consentimiento. Aparece abajo hasta que la persona decide;
 * «Aceptar» y «Rechazar» pesan igual. No bloquea la página: se puede leer y
 * registrarse sin contestar (mientras tanto, nada se guarda en el navegador).
 * El pie lo vuelve a abrir con «Preferencias de privacidad».
 */
export function ConsentBanner() {
  const t = useCopy().privacy
  const [open, setOpen] = useState(false)
  const [reopened, setReopened] = useState(false)
  const firstButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (readConsent() === null) setOpen(true)
    return onConsentOpen(() => {
      setReopened(true)
      setOpen(true)
    })
  }, [])

  // Al reabrirlo desde el pie, el foco va al aviso; la primera vez no se roba el foco.
  useEffect(() => {
    if (open && reopened) firstButton.current?.focus()
  }, [open, reopened])

  if (!open) return null
  const choose = (value: Consent) => {
    writeConsent(value)
    setOpen(false)
  }
  return (
    <section className="consent" role="region" aria-label={t.label}>
      <p className="consent__text">
        {t.text} <a href={t.noticeHref}>{t.notice}</a>
      </p>
      <div className="consent__actions">
        <button ref={firstButton} type="button" className="btn btn--consent" onClick={() => choose('denied')}>
          {t.decline}
        </button>
        <button type="button" className="btn btn--consent" onClick={() => choose('granted')}>
          {t.accept}
        </button>
      </div>
    </section>
  )
}
