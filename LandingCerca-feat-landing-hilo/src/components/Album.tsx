import { useState } from 'react'
import { track } from '../analytics'
import { ALBUM } from '../content'
import type { ArtName, Tone } from '../content'
import { useCopy } from '../i18n'
import { Pigeon } from './Pigeon'
import { Stamp } from './Stamp'

const filled: Record<number, ArtName | undefined> = ALBUM.filled
const tones: readonly Tone[] = ALBUM.tones

export function Album() {
  const [picked, setPicked] = useState<number | null>(null)
  const t = useCopy().album
  const [first, second] = ALBUM.pages

  function page(from: number, to: number) {
    const blanks = (ALBUM.firstWeekday + from - 1) % 7
    const days = Array.from({ length: to - from + 1 }, (_, i) => from + i)
    return (
      <div className="days">
        {t.weekdays.map((d, i) => (
          <span key={i} className="dow" aria-hidden="true">
            {d}
          </span>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={i} />
        ))}
        {days.map((day) => (
          <Slot key={day} day={day} onPick={pick} />
        ))}
      </div>
    )
  }

  function pick(day: number) {
    track('album_day_open', { day: `${day}` })
    setPicked(day)
  }

  return (
    <>
      <div className="album">
        <div className="album__page">
          <div className="album__head">
            <p className="album__month">{t.month}</p>
            <p className="meta">
              {first[0]} – {first[1]}
            </p>
          </div>
          {page(...first)}
        </div>
        <div className="album__page">
          <div className="album__head">
            <p className="meta">
              {second[0]} – {second[1]}
            </p>
            <span className="demo-tag demo-tag--cream">{t.sample}</span>
          </div>
          {page(...second)}
        </div>
      </div>
      <Picked day={picked} />
    </>
  )
}

function Slot({ day, onPick }: { day: number; onPick: (day: number) => void }) {
  const t = useCopy().album
  const art = filled[day]
  const stacked = Boolean(t.stacked[day])
  const future = day > ALBUM.today
  const today = day === ALBUM.today
  const state = future ? t.future : !art ? t.empty : stacked ? t.many : t.one
  const kind = future ? 'slot--future' : art ? 'slot--filled' : 'slot--empty'
  const classes = ['slot', kind, stacked && 'slot--stack', today && 'slot--today'].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={classes}
      disabled={future}
      aria-label={`${t.date(day)}${today ? `, ${t.today}` : ''}, ${state}`}
      onClick={() => onPick(day)}
    >
      {art && !future && <Stamp art={art} tone={tones[day % 4]} tilt={((day * 37) % 9) - 4} />}
      <span className="slot__num">{day}</span>
    </button>
  )
}

function Picked({ day }: { day: number | null }) {
  const t = useCopy().album
  if (day === null) {
    return (
      <div className="album-pick" aria-live="polite">
        <Pigeon pose="curious" />
        <p>
          <b>{t.hintLead}</b> {t.hint}
        </p>
      </div>
    )
  }
  const has = Boolean(filled[day])
  const letters = t.stacked[day]
  return (
    <div className="album-pick" aria-live="polite">
      <Pigeon pose={has ? 'happy' : 'sad'} />
      <p>
        <b>
          {t.date(day)}
          {day === ALBUM.today && ` · ${t.today}`}.
        </b>{' '}
        {!has ? t.pickedEmpty : letters ? t.pickedMany(letters) : t.pickedOne}
      </p>
    </div>
  )
}
