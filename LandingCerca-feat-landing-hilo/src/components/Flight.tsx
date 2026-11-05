import { useEffect, useRef, type RefObject } from 'react'
import { useScrollFrame } from '../useScrollFrame'
import { Envelope } from './Envelope'
import { Pigeon } from './Pigeon'

/*
 * El vuelo: una sola ruta de arriba abajo y un sobre que viaja con quien lee.
 * - La ruta se calcula con los marcadores de la página: [data-origin], [data-sign],
 *   [data-home], cada [data-scene] y [data-arrival].
 * - En escritorio el sobre se queda a la misma altura de la ventana, sigue la ruta
 *   del lado contrario al contenido y se inclina con ella. En pantallas angostas no
 *   hay carril libre: vuela de un hueco reservado ([data-park]) al siguiente.
 * - [data-fill] y [data-send] viajan físicamente al sobre; [data-open] lo abre,
 *   [data-seal] lo cierra y [data-landed] lo entrega.
 * - Con "reducir movimiento" no vuela: se queda en el inicio.
 */
const NARROW = 900
const MAX_BANK = 12

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

type Point = { x: number; y: number }

/**
 * Une puntos que siempre bajan. Las asas se quedan dentro del rectángulo
 * entre cada par, así el giro es continuo y no se cruza con el tramo anterior.
 */
function fallingCurve(points: Point[]) {
  const commands = [`M${points[0].x} ${points[0].y}`]
  for (let index = 0; index < points.length - 1; index++) {
    const from = points[index]
    const to = points[index + 1]
    const drop = Math.max(1, to.y - from.y)
    const shift = to.x - from.x
    const handle = drop * 0.46
    const pull = Math.sign(shift) * Math.min(Math.abs(shift) * 0.22, drop * 0.32)
    commands.push(`C${from.x + pull} ${from.y + handle} ${to.x - pull} ${to.y - handle} ${to.x} ${to.y}`)
  }
  return commands.join(' ')
}

/** Añade un punto debajo del anterior. Una caída mínima evita un codo de altura cero. */
function pushDown(points: Point[], x: number, y: number) {
  const last = points[points.length - 1]
  const nextY = last ? Math.max(y, last.y + 32) : y
  if (last && Math.abs(last.x - x) < 0.5 && nextY - last.y < 1) return
  points.push({ x, y: nextY })
}

/** Lleva `el` hasta el sobre y lo deja ahí; al subir de nuevo, lo devuelve. */
function travel(el: HTMLElement, sent: boolean, target: DOMRect, trips: Map<HTMLElement, Animation>) {
  const trip = trips.get(el)
  if (Boolean(trip && trip.playbackRate > 0) === sent) return
  if (!sent) {
    trip?.reverse()
    return
  }
  // De vuelta en la página, un viaje nuevo: el sobre ya está en otro lugar.
  trip?.cancel()
  const r = el.getBoundingClientRect()
  const dx = target.left + target.width / 2 - (r.left + r.width / 2)
  const dy = target.top + target.height / 2 - (r.top + r.height / 2)
  const scale = Math.min(1, (target.width * 0.3) / r.width)
  trips.set(
    el,
    el.animate(
      [
        { transform: 'none', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1, offset: 0.85 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 },
      ],
      { duration: 700, easing: 'cubic-bezier(.77,0,.175,1)', fill: 'forwards' },
    ),
  )
}

export function Flight({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const arcRef = useRef<SVGPathElement>(null)
  const routeRef = useRef<SVGPathElement>(null)
  const carrierRef = useRef<HTMLDivElement>(null)
  const trips = useRef(new Map<HTMLElement, Animation>())
  const m = useRef({ homeX: 0, homeY: 0, homeW: 1, flightW: 1, top: 0, ys: [] as number[], xs: [] as number[] })

  function xAt(y: number) {
    const { ys, xs } = m.current
    let lo = 0
    let hi = ys.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (ys[mid] < y) lo = mid + 1
      else hi = mid
    }
    return xs[lo] ?? 0
  }

  function place() {
    const root = rootRef.current
    const carrier = carrierRef.current
    if (!root || !carrier || !m.current.ys.length) return
    const { homeX, homeY, homeW, flightW, top } = m.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const narrow = window.innerWidth < NARROW
    const vh = window.innerHeight
    const scroll = reduce ? 0 : window.scrollY
    const h = carrier.offsetHeight
    const line = narrow ? vh * 0.55 : homeY

    let x = homeX
    let y = homeY - top // Coordenadas de la página: en teléfono y con "reducir movimiento".
    let scale = 1
    let bank = 0
    let park: DOMRect | null = null
    if (narrow && !reduce) {
      // El último hueco que ya entró a la ventana.
      for (const el of root.querySelectorAll('[data-park]')) {
        const r = el.getBoundingClientRect()
        if (r.top < vh * 0.8) park = r
      }
      if (park) {
        const box = root.getBoundingClientRect()
        x = park.left + park.width / 2 - box.left
        y = park.top + park.height * 0.62 - box.top
        scale = (park.height * 0.92) / (homeW * 1.22)
      }
    } else if (!reduce) {
      y = homeY
      const at = scroll + homeY - top
      x = xAt(at)
      scale = lerp(1, flightW / homeW, clamp01(scroll / (vh * 0.5)))
      const slope = (xAt(at + 40) - xAt(at - 40)) / 80
      bank = Math.max(-MAX_BANK, Math.min(MAX_BANK, (Math.atan(slope) * 180) / Math.PI / 3))
    }
    carrier.style.transform = `translate(${x - homeW / 2}px, ${y - h / 2}px) scale(${scale}) rotate(${bank}deg)`

    if (reduce) return
    const passed = (el: Element | null, offset = 0) => {
      if (!el) return false
      const r = el.getBoundingClientRect()
      return r.top + r.height / 2 + offset < line
    }
    const envelope = carrier.querySelector<HTMLElement>('.env')!
    const target = park ?? envelope.getBoundingClientRect()
    // Una por una: cada estampilla sale un poco después que la anterior.
    const fills = [...root.querySelectorAll<HTMLElement>('[data-fill]')]
    // En teléfono esperan a estar arriba: hasta entonces se ven junto con el sobre.
    const fillShift = narrow ? vh * 0.2 : -60
    const sent = fills.map((li, i) => passed(li, (i - 1) * 70 + fillShift))
    fills.forEach((li, i) => travel(li, sent[i], target, trips.current))
    const letter = root.querySelector<HTMLElement>('[data-send]')
    if (letter) {
      const r = letter.getBoundingClientRect()
      // Se dobla cuando ya casi salió de la vista, no mientras alguien la lee.
      travel(letter, r.bottom < (narrow ? vh * 0.3 : line - 100), target, trips.current)
    }
    const sealed = passed(root.querySelector('[data-seal]'))
    const opened = root.querySelector('[data-open]')
    const isOpen = Boolean(opened && opened.getBoundingClientRect().top < line) && !sealed
    envelope.dataset.state = isOpen ? 'open' : 'closed'
    envelope.dataset.stamps = `${sent.filter(Boolean).length}`
    const landed = root.querySelector('[data-landed]')!.getBoundingClientRect()
    root.dataset.arrived = `${landed.top + landed.height * 0.4 < line}`
  }

  useScrollFrame(place)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    function layout() {
      const box = root!.getBoundingClientRect()
      const at = (selector: string) => {
        const el = root!.querySelector(selector)
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, w: r.width, h: r.height }
      }
      const origin = at('[data-origin]')
      const sign = at('[data-sign]')
      const home = at('[data-home]')
      const arrival = at('[data-arrival]')
      if (!origin || !sign || !home || !arrival) return

      const w = root!.offsetWidth
      const narrow = window.innerWidth < NARROW
      const wrap = root!.querySelector('[data-scene] .wrap, .wrap')!
      const style = getComputedStyle(wrap)
      const wrapBox = wrap.getBoundingClientRect()
      const innerLeft = wrapBox.left - box.left + parseFloat(style.paddingLeft)
      const innerRight = wrapBox.right - box.left - parseFloat(style.paddingRight)
      // Tamaño en vuelo: una sola fuente para la ruta y para el hueco que deja el contenido.
      const flightW = Math.round(Math.max(210, Math.min(window.innerWidth * 0.26, 340)))
      root!.style.setProperty('--cw', `${flightW}px`)

      // Lejos del texto: en escritorio del lado libre; en teléfono, pegada a los bordes.
      const sideX = (side: string | undefined) =>
        narrow ? (side === 'left' ? w * 0.93 : w * 0.07) : side === 'left' ? innerRight - flightW / 2 : innerLeft + flightW / 2

      // Un tramo recto junto a cada escena y el cambio de lado solo en el aire
      // entre una y otra. Así la curva no entra en la carta ni en el sobre.
      const points: Point[] = []
      pushDown(points, sign.x, sign.y)
      pushDown(points, home.x, home.y)
      for (const el of root!.querySelectorAll<HTMLElement>('[data-scene]')) {
        const body = el.querySelector('.scene__body') ?? el
        const r = body.getBoundingClientRect()
        const x = sideX(el.dataset.scene)
        pushDown(points, x, r.top - box.top - 12)
        pushDown(points, x, r.bottom - box.top + 12)
      }
      const landed = root!.querySelector('[data-landed]')
      if (landed) {
        const r = landed.getBoundingClientRect()
        pushDown(points, arrival.x, r.top - box.top - 36)
      }
      pushDown(points, arrival.x, arrival.y)

      routeRef.current!.setAttribute('d', fallingCurve(points))
      // Del origen al nodo, por el cielo: el control de antes bajaba hasta el
      // sobre y la ruta se cruzaba consigo misma.
      const lift = Math.min(64, Math.abs(sign.y - origin.y) * 0.28)
      arcRef.current!.setAttribute(
        'd',
        `M${origin.x} ${origin.y} Q${(origin.x + sign.x) / 2} ${Math.min(origin.y, sign.y) - lift} ${sign.x} ${sign.y}`,
      )
      svgRef.current!.setAttribute('height', `${root!.offsetHeight}`)
      svgRef.current!.setAttribute('viewBox', `0 0 ${w} ${root!.offsetHeight}`)

      // Tabla y → x (la ruta siempre baja) para seguirla con el scroll.
      const route = routeRef.current!
      const length = route.getTotalLength()
      const ys: number[] = []
      const xs: number[] = []
      for (let l = 0; l <= length; l += 8) {
        const p = route.getPointAtLength(l)
        if (ys.length && p.y < ys[ys.length - 1]) continue
        ys.push(p.y)
        xs.push(p.x)
      }

      const carrier = carrierRef.current!
      carrier.style.width = `${home.w}px`
      const top = box.top + window.scrollY
      m.current = {
        homeX: home.x,
        homeY: home.y + top,
        homeW: home.w,
        flightW,
        top,
        ys,
        xs,
      }
      place()
    }

    let frame = 0
    const relayout = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(layout)
    }
    const resize = new ResizeObserver(relayout)
    resize.observe(root)
    document.fonts?.ready.then(relayout)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
    }
    // `place` solo lee refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef])

  return (
    <>
      <svg ref={svgRef} className="route" aria-hidden="true" focusable="false">
        <path ref={arcRef} className="route-line" />
        <path ref={routeRef} className="route-line" />
      </svg>
      <div ref={carrierRef} className="carrier" aria-hidden="true">
        <Pigeon pose="flying" className="carrier__pigeon" />
        <Envelope state="closed" />
      </div>
    </>
  )
}
