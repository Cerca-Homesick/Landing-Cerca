import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { track } from '../analytics'
import { JOTFORM_DIRECT_URL, JOTFORM_URL, SIGNUP_MESSAGE } from '../config'
import { useCopy, useLang } from '../i18n'

type OpenWaitlist = (trigger: HTMLElement, location: string) => void

const WaitlistContext = createContext<OpenWaitlist>(() => {})

type ProviderProps = { children: ReactNode; initialConfirmed?: boolean }

export function WaitlistProvider({ children, initialConfirmed = false }: ProviderProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [confirmed, setConfirmed] = useState(initialConfirmed)
  const { lang } = useLang()
  const t = useCopy().waitlist

  const open = useCallback<OpenWaitlist>(
    (trigger, location) => {
      triggerRef.current = trigger
      track('waitlist_cta_click', { location, lang })
      if (!JOTFORM_URL) track('waitlist_form_unavailable', { location, lang })
      setIsOpen(true)
      dialogRef.current?.showModal()
    },
    [lang],
  )

  const close = useCallback(() => dialogRef.current?.close(), [])

  // Inscripción confirmada: Jotform redirige su página de agradecimiento a esta
  // misma web con ?registro=confirmado; esa página, dentro del iframe, avisa aquí.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      if (event.data?.type !== SIGNUP_MESSAGE) return
      track('waitlist_signup_confirmed', { via: 'modal' })
      setConfirmed(true)
      close()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [close])

  function onClose() {
    setIsOpen(false)
    setLoaded(false)
    triggerRef.current?.focus()
  }

  return (
    <WaitlistContext.Provider value={open}>
      {children}
      <dialog
        ref={dialogRef}
        className="waitlist"
        aria-labelledby="waitlist-title"
        onClose={onClose}
        onClick={(event) => {
          if (event.target === dialogRef.current) close()
        }}
      >
        <div className="waitlist__sheet">
          <header className="waitlist__header">
            <h2 id="waitlist-title" className="waitlist__title">
              {t.title}
            </h2>
            <button type="button" className="icon-btn" onClick={close} aria-label={t.close}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          {JOTFORM_URL ? (
            <>
              <div className="waitlist__frame" data-loaded={loaded}>
                {!loaded && <p className="waitlist__loading">{t.loading}</p>}
                {isOpen && (
                  <iframe
                    ref={iframeRef}
                    src={JOTFORM_URL}
                    title={t.frameTitle}
                    allow="geolocation; microphone; camera; fullscreen"
                    onLoad={() => setLoaded(true)}
                  />
                )}
              </div>
              <p className="waitlist__alt">
                {t.altQuestion}{' '}
                <a href={JOTFORM_DIRECT_URL ?? JOTFORM_URL} target="_blank" rel="noopener">
                  {t.altLink}
                </a>
              </p>
            </>
          ) : (
            <div className="waitlist__pending" role="status">
              <p>{t.pending}</p>
              {import.meta.env.DEV && (
                <p className="waitlist__dev">
                  Para el equipo: agrega <code>VITE_JOTFORM_URL</code> en <code>.env</code> (ver{' '}
                  <code>.env.example</code>).
                </p>
              )}
              <button type="button" className="btn btn--ghost" onClick={close}>
                {t.backToPage}
              </button>
            </div>
          )}
        </div>
      </dialog>
      {confirmed && <SignupThanks onDismiss={() => setConfirmed(false)} />}
    </WaitlistContext.Provider>
  )
}

export function SignupThanks({ onDismiss }: { onDismiss: () => void }) {
  const t = useCopy().waitlist
  return (
    <div className="thanks" role="status">
      <p>
        <strong>{t.thanksLead}</strong> {t.thanks}
      </p>
      <button type="button" className="icon-btn" onClick={onDismiss} aria-label={t.dismiss}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}

type WaitlistButtonProps = {
  location: string
  children: ReactNode
  variant?: 'primary' | 'small'
}

export function WaitlistButton({ location, children, variant = 'primary' }: WaitlistButtonProps) {
  const open = useContext(WaitlistContext)
  return (
    <button
      type="button"
      className={`btn btn--${variant}`}
      aria-haspopup="dialog"
      onClick={(event) => open(event.currentTarget, location)}
    >
      {children}
    </button>
  )
}
