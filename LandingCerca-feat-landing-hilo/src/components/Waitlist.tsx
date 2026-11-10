import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { track } from '../analytics'
import { SIGNUP_MESSAGE, TALLY_DIRECT_URL, TALLY_EMBED_URL, TALLY_ORIGIN, TALLY_WIDGET_SRC } from '../config'
import { useCopy, useLang } from '../i18n'
import { Toast } from './Toast'

type TallyWidget = { loadEmbeds: () => void }

function tallyOnWindow(): TallyWidget | undefined {
  return (window as Window & { Tally?: TallyWidget }).Tally
}

/** Carga el widget de Tally, o asigna `src` si el script no llega. */
function loadTallyEmbeds() {
  const tally = tallyOnWindow()
  if (tally) {
    tally.loadEmbeds()
    return
  }
  document.querySelectorAll<HTMLIFrameElement>('iframe[data-tally-src]:not([src])').forEach((frame) => {
    const source = frame.dataset.tallySrc
    if (source) frame.src = source
  })
}

function isTallyEvent(data: unknown, name: string): boolean {
  if (typeof data === 'string') return data.includes(name)
  if (data && typeof data === 'object' && 'event' in data) {
    return (data as { event?: unknown }).event === name
  }
  return false
}

type OpenWaitlist = (trigger: HTMLElement, location: string) => void

const WaitlistContext = createContext<OpenWaitlist>(() => {})

type ProviderProps = { children: ReactNode; initialConfirmed?: boolean }

export function WaitlistProvider({ children, initialConfirmed = false }: ProviderProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const isOpenRef = useRef(false)
  const signedUpRef = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [confirmed, setConfirmed] = useState(initialConfirmed)
  const { lang } = useLang()
  const t = useCopy().waitlist

  const open = useCallback<OpenWaitlist>(
    (trigger, location) => {
      triggerRef.current = trigger
      signedUpRef.current = false
      track('waitlist_cta_click', { location, lang })
      if (!TALLY_EMBED_URL) track('waitlist_form_unavailable', { location, lang })
      isOpenRef.current = true
      setIsOpen(true)
      dialogRef.current?.showModal()
    },
    [lang],
  )

  const close = useCallback(() => dialogRef.current?.close(), [])

  const confirmSignup = useCallback(() => {
    if (signedUpRef.current) return
    signedUpRef.current = true
    track('waitlist_signup_confirmed', { via: 'modal' })
    setConfirmed(true)
    close()
  }, [close])

  // El widget ajusta el alto del iframe. Se carga al abrir, no en la página.
  useEffect(() => {
    if (!isOpen || !TALLY_EMBED_URL) return

    let cancelled = false
    const load = () => {
      if (!cancelled) loadTallyEmbeds()
    }

    if (tallyOnWindow()) {
      load()
      return () => {
        cancelled = true
      }
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TALLY_WIDGET_SRC}"]`)
    if (existing) {
      if (existing.dataset.tallyState === 'ready' || existing.dataset.tallyState === 'error') {
        load()
        return () => {
          cancelled = true
        }
      }
      existing.addEventListener('load', load)
      existing.addEventListener('error', load)
      return () => {
        cancelled = true
        existing.removeEventListener('load', load)
        existing.removeEventListener('error', load)
      }
    }

    const script = document.createElement('script')
    script.src = TALLY_WIDGET_SRC
    script.async = true
    script.onload = () => {
      script.dataset.tallyState = 'ready'
      load()
    }
    script.onerror = () => {
      script.dataset.tallyState = 'error'
      load()
    }
    document.body.appendChild(script)
    return () => {
      cancelled = true
    }
  }, [isOpen])

  // `Tally.FormSubmitted` confirma el envío dentro del modal. El mensaje de
  // nuestro origen cubre la redirección de agradecimiento, si está configurada.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin === TALLY_ORIGIN) {
        if (!isOpenRef.current) return
        if (isTallyEvent(event.data, 'Tally.FormLoaded')) setLoaded(true)
        if (isTallyEvent(event.data, 'Tally.FormSubmitted')) confirmSignup()
        return
      }
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== SIGNUP_MESSAGE) return
      confirmSignup()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [confirmSignup])

  function onClose() {
    isOpenRef.current = false
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

          {TALLY_EMBED_URL ? (
            <>
              {t.formNote && <p className="waitlist__note">{t.formNote}</p>}
              <div className="waitlist__frame" data-loaded={loaded}>
                {!loaded && <p className="waitlist__loading">{t.loading}</p>}
                {isOpen && (
                  <iframe
                    data-tally-src={TALLY_EMBED_URL}
                    title={t.frameTitle}
                    width="100%"
                    height="480"
                    onLoad={() => setLoaded(true)}
                  />
                )}
              </div>
              <p className="waitlist__alt">
                {t.altQuestion}{' '}
                <a href={TALLY_DIRECT_URL ?? TALLY_EMBED_URL} target="_blank" rel="noopener">
                  {t.altLink}
                </a>
              </p>
            </>
          ) : (
            <div className="waitlist__pending" role="status">
              <p>{t.pending}</p>
              {import.meta.env.DEV && (
                <p className="waitlist__dev">
                  Para el equipo: agrega <code>VITE_TALLY_EMBED_URL</code> en <code>.env</code>.
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
    <Toast pose="happy" dismissLabel={t.dismiss} onDismiss={onDismiss}>
      <strong>{t.thanksLead}</strong> {t.thanks}
    </Toast>
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
