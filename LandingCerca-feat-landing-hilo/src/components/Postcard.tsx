import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { track } from '../analytics'
import { DISTANCE, MOMENTS, type Moment } from '../content'
import { useCopy } from '../i18n'
import { Postmark } from './Postmark'
import { Stamp } from './Stamp'

type View = 'momentos' | 'mapa'
const VIEWS: View[] = ['momentos', 'mapa']

export function Postcard({ onDiscover }: { onDiscover: (id: string) => void }) {
  const [view, setView] = useState<View>('momentos')
  const [openId, setOpenId] = useState<string | null>(null)
  const tabRefs = useRef<Record<View, HTMLButtonElement | null>>({ momentos: null, mapa: null })
  const photoRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const detailRef = useRef<HTMLDivElement>(null)
  const copy = useCopy()
  const t = copy.postcard
  const people = copy.people
  const moment = MOMENTS.find((m) => m.id === openId) ?? null
  const momentText = moment ? copy.moments[moment.id] : null

  function changeView(next: View, focusTab = false) {
    setOpenId(null)
    setView(next)
    track('postcard_view_change', { view: next })
    if (focusTab) tabRefs.current[next]?.focus()
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    const i = VIEWS.indexOf(view)
    let next = -1
    if (event.key === 'ArrowRight') next = (i + 1) % VIEWS.length
    if (event.key === 'ArrowLeft') next = (i - 1 + VIEWS.length) % VIEWS.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = VIEWS.length - 1
    if (next < 0) return
    event.preventDefault()
    changeView(VIEWS[next], true)
  }

  function openMoment(m: Moment) {
    setOpenId(m.id)
    onDiscover(m.id)
    track('postcard_moment_open', { moment: m.id })
  }

  function closeMoment() {
    const id = openId
    setOpenId(null)
    if (id) photoRefs.current[id]?.focus()
  }

  useEffect(() => {
    if (openId) detailRef.current?.focus()
  }, [openId])

  return (
    <div className="postcard-block">
      <div className="postcard-controls">
        <div className="tabs" role="tablist" aria-label={t.sides}>
          {VIEWS.map((v) => (
            <button
              key={v}
              ref={(el) => {
                tabRefs.current[v] = el
              }}
              type="button"
              role="tab"
              id={`tab-${v}`}
              aria-selected={view === v}
              aria-controls={`face-${v}`}
              tabIndex={view === v ? 0 : -1}
              className="tab"
              onClick={() => changeView(v)}
              onKeyDown={onTabKey}
            >
              {v === 'momentos' ? <PhotoIcon /> : <PinIcon />}
              {v === 'momentos' ? t.moments : t.map}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="flip-btn"
          onClick={() => changeView(view === 'momentos' ? 'mapa' : 'momentos')}
        >
          <FlipIcon /> {t.flip}
        </button>
      </div>

      <div className="postcard-wrap">
        <span className="node node--pin postcard-pin" data-anchor aria-hidden="true" />
        <div className="postcard" data-view={view} data-reveal-card>
          <div className="postcard__inner">
            {/* Lado A · Momentos */}
            <div
              className="postcard__face postcard__face--front"
              role="tabpanel"
              id="face-momentos"
              aria-labelledby="tab-momentos"
              inert={view !== 'momentos'}
            >
              <div className="face-head">
                <p className="face-title">
                  <span className="face-title__big">
                    {t.pair(people.valeria.name, people.mama.name)}
                  </span>
                  <span className="face-title__small">{t.sample}</span>
                </p>
              </div>

              <ul className="moment-grid">
                {MOMENTS.map((m, i) => (
                  <li key={m.id} style={{ '--r': `${[-3, 2.5, 1.5, -2][i]}deg` } as CSSProperties}>
                    <button
                      type="button"
                      className="moment-btn"
                      ref={(el) => {
                        photoRefs.current[m.id] = el
                      }}
                      onClick={() => openMoment(m)}
                      aria-label={t.openMoment(copy.moments[m.id].label, people[m.from].name)}
                    >
                      <Stamp art={m.art} tone={m.tone} image={m.image} />
                      <span className="moment-btn__label hand">{copy.moments[m.id].label}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <p className="hand annotation annotation--photos" aria-hidden="true">
                {t.tapHint}
                <svg viewBox="0 0 60 30">
                  <path d="M6 26 C20 24 34 16 46 5 M46 5 l-10 1 M46 5 l-1 10" />
                </svg>
              </p>

              <button type="button" className="post-stamp post-stamp--map" onClick={() => changeView('mapa')}>
                <span className="post-stamp__art" aria-hidden="true">
                  <PinIcon />
                </span>
                <span className="post-stamp__text">{t.seeMap}</span>
              </button>

              {moment && momentText && (
                <div
                  ref={detailRef}
                  className="moment-detail"
                  role="region"
                  aria-label={t.momentRegion(momentText.label)}
                  tabIndex={-1}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.stopPropagation()
                      closeMoment()
                    }
                  }}
                >
                  <div className="moment-detail__photo" style={{ '--r': '-2deg' } as CSSProperties}>
                    <Stamp art={moment.art} tone={moment.tone} image={moment.image} />
                  </div>
                  <div className="moment-detail__body">
                    <p className="moment-detail__meta">
                      {people[moment.from].name} · {people[moment.from].city} · {momentText.time}
                    </p>
                    <p className="moment-detail__message">{copy.quote(momentText.message)}</p>
                    <p className="hand moment-detail__note">
                      {t.arrived(moment.from === 'valeria' ? people.mama.city : people.valeria.city)}
                    </p>
                    <button type="button" className="btn btn--ghost" onClick={closeMoment}>
                      {t.back}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lado B · Mapa */}
            <div
              className="postcard__face postcard__face--back"
              role="tabpanel"
              id="face-mapa"
              aria-labelledby="tab-mapa"
              inert={view !== 'mapa'}
            >
              <div className="map-side">
                <MiniMap label={t.mapLabel(people.mama.city, people.valeria.city)} cities={[people.mama.city, people.valeria.city]} />
                <span className="demo-tag demo-tag--map">{t.mapTag}</span>
              </div>
              <div className="address-side">
                <div className="stamp-box">
                  <button type="button" className="post-stamp post-stamp--moments" onClick={() => changeView('momentos')}>
                    <span className="post-stamp__art" aria-hidden="true">
                      <PhotoIcon />
                    </span>
                    <span className="post-stamp__text">{t.seeMoments}</span>
                  </button>
                  <Postmark className="back-postmark" ring={`${people.mama.city.toUpperCase()} · ${people.valeria.city.toUpperCase()} · `} center="DEMO" waves />
                </div>
                <dl className="address">
                  <div>
                    <dt>{t.here}</dt>
                    <dd>
                      {people.mama.name} <span>{people.mama.city}, {people.mama.country}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>{t.there}</dt>
                    <dd>
                      {people.valeria.name} <span>{people.valeria.city}, {people.valeria.country}</span>
                    </dd>
                  </div>
                </dl>
                <p className="distance">
                  <span className="distance__km">{DISTANCE.km} km</span>
                  <span className="distance__hours">{t.hours(DISTANCE.hours)}</span>
                </p>
                <p className="hand annotation annotation--map">{t.sameThread}</p>
              </div>
            </div>
          </div>
        </div>
        <span className="anchor-ghost postcard-exit" data-anchor aria-hidden="true" />
      </div>
    </div>
  )
}

// Proyección equirectangular simple de una parte del mundo (lon −130…40, lat 10…62).
const project = ([lon, lat]: number[]) => [((lon + 130) / 170) * 600, ((62 - lat) / 52) * 340]
const poly = (points: number[][]) =>
  'M' + points.map((p) => project(p).map((n) => n.toFixed(1)).join(' ')).join(' L') + 'Z'

const AMERICA = poly([
  [-130, 62], [-130, 55], [-125, 48], [-124, 40], [-117, 32], [-110, 23], [-105, 20], [-97, 16], [-92, 15],
  [-88, 14], [-84, 10], [-80, 9], [-78, 10], [-83, 15], [-87, 21], [-90, 21], [-97, 22], [-97, 27], [-90, 30],
  [-84, 30], [-81, 25], [-80, 31], [-76, 35], [-74, 40], [-70, 42], [-66, 44], [-60, 46], [-55, 50], [-58, 55],
  [-62, 58], [-64, 62],
])
const CUBA = poly([[-85, 22], [-80, 23.2], [-75, 20.2], [-78, 20.6]])
const EUROPE = poly([
  [-9, 37], [-9, 43], [-2, 43.5], [-1, 46], [-4, 48], [-2, 49], [2, 51], [4, 52], [8, 54], [9, 57], [5, 59],
  [5, 62], [40, 62], [40, 42], [28, 41], [26, 40], [23, 38], [20, 40], [19, 42], [13.5, 45], [16, 41.5],
  [18.5, 40], [16, 38], [15.6, 40], [12, 42], [10, 44], [7, 44], [3, 43], [0, 39], [-2, 37], [-6, 36],
])
const AFRICA = poly([
  [-6, 35.8], [-10, 30], [-16, 22], [-17, 15], [-17, 10], [40, 10], [43, 12], [40, 16], [35, 25], [33, 30],
  [32, 31], [25, 32], [20, 31], [11, 33], [10, 37], [-2, 35.2],
])
const BRITAIN = poly([[-5, 50], [1.5, 51], [0, 53], [-3, 56], [-6, 58], [-5, 54]])
const MTY = project([-100.31, 25.67])
const NAP = project([14.27, 40.85])

function MiniMap({ label, cities }: { label: string; cities: [string, string] }) {
  const mid = [(MTY[0] + NAP[0]) / 2, Math.min(MTY[1], NAP[1]) - 110]
  return (
    <svg className="mini-map" viewBox="0 0 600 340" role="img" aria-label={label}>
      <rect width="600" height="340" className="mini-map__sea" />
      {[60, 120, 180, 240, 300].map((y) => (
        <path key={y} d={`M0 ${y} H600`} className="mini-map__grid" />
      ))}
      {[AMERICA, CUBA, EUROPE, AFRICA, BRITAIN].map((d) => (
        <path key={d.slice(0, 12)} d={d} className="mini-map__land" />
      ))}
      <path
        className="mini-map__thread"
        d={`M${MTY[0]} ${MTY[1]} Q${mid[0]} ${mid[1]} ${NAP[0]} ${NAP[1]}`}
        pathLength={1}
      />
      {[MTY, NAP].map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="11" className="mini-map__halo" />
          <circle cx={x} cy={y} r="6" className="mini-map__pin" />
        </g>
      ))}
      <text x={MTY[0]} y={MTY[1] + 30} textAnchor="middle" className="mini-map__label">{cities[0]}</text>
      <text x={NAP[0]} y={NAP[1] + 30} textAnchor="middle" className="mini-map__label">{cities[1]}</text>
    </svg>
  )
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M4 17l5-4.5 4 3.5 2.5-2 4.5 3.5" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
      <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  )
}

function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" />
    </svg>
  )
}
