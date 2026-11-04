import { useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { track } from '../analytics'
import { MY_PAGE, THEIR_PAGE } from '../content'
import { useCopy } from '../i18n'
import { Pigeon } from './Pigeon'
import { Stamp } from './Stamp'

type Side = 'theirs' | 'mine'

// En escritorio la carta se ve abierta, con las dos páginas; en teléfono se voltea.
const WIDE = '(min-width: 900px)'
const subscribeWide = (notify: () => void) => {
  const query = window.matchMedia(WIDE)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const isWide = () => window.matchMedia(WIDE).matches

export function Letter() {
  const [side, setSide] = useState<Side>('theirs')
  const theirsTab = useRef<HTMLButtonElement>(null)
  const mineTab = useRef<HTMLButtonElement>(null)
  const wide = useSyncExternalStore(subscribeWide, isWide)
  const copy = useCopy()
  const t = copy.letter

  function show(next: Side) {
    if (next !== side) track('letter_side_change', { side: next })
    setSide(next)
  }

  function onTabKey(event: KeyboardEvent) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const next = side === 'mine' ? 'theirs' : 'mine'
    show(next)
    ;(next === 'mine' ? mineTab : theirsTab).current?.focus()
  }

  const collage = (page: typeof THEIR_PAGE) => (
    <ul className="collage">
      {page.map((s) => (
        <li key={s.id}>
          <Stamp art={s.art} tone={s.tone} tilt={s.tilt} alt={copy.art[s.art]} />
          <span className="hand label">{t.stamps[s.id]}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      {!wide && (
      <div className="tabs" role="tablist" aria-label={t.pages} onKeyDown={onTabKey}>
        <button
          ref={theirsTab}
          type="button"
          className="tab"
          id="tab-theirs"
          role="tab"
          aria-selected={side === 'theirs'}
          aria-controls="face-theirs"
          tabIndex={side === 'theirs' ? 0 : -1}
          onClick={() => show('theirs')}
        >
          {t.theirsTab}
        </button>
        <button
          ref={mineTab}
          type="button"
          className="tab"
          id="tab-mine"
          role="tab"
          aria-selected={side === 'mine'}
          aria-controls="face-mine"
          tabIndex={side === 'mine' ? 0 : -1}
          onClick={() => show('mine')}
        >
          {t.mineTab}
        </button>
      </div>
      )}

      <div className={wide ? 'letter letter--spread' : 'letter'} data-side={side} data-send>
        <div className="letter__inner">
          <article className="face face--theirs" id="face-theirs" {...(wide ? {} : { role: 'tabpanel', 'aria-labelledby': 'tab-theirs', inert: side !== 'theirs' })}>
            <p className="face__title">{t.theirsTitle}</p>
            {collage(THEIR_PAGE)}
            <p className="hand letter-note">{t.theirsNote}</p>
          </article>
          <article className="face face--mine" id="face-mine" {...(wide ? {} : { role: 'tabpanel', 'aria-labelledby': 'tab-mine', inert: side !== 'mine' })}>
            <p className="face__title">{t.mineTitle}</p>
            {collage(MY_PAGE)}
            <div className="voice">
              <Pigeon pose="singing" />
              <p className="hand letter-note">{t.voice}</p>
            </div>
          </article>
        </div>
      </div>
    </>
  )
}
