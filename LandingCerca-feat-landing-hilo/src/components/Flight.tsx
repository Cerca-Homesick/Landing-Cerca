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
 *   hay carril libre: se posa en cada hueco reservado ([data-park]) y, entre uno y
 *   otro, vuela chiquita en la esquina de la ventana. Todo depende solo del scroll.
 * - [data-fill] y [data-send] viajan físicamente al sobre; [data-open] lo abre,
 *   [data-seal] lo cierra y [data-landed] lo entrega.
 * - Con "reducir movimiento" no vuela: se queda en el inicio.
 */
const NARROW = 900
const MAX_BANK = 12
/** Teléfono: margen con el borde de la ventana mientras vuela. */
const EDGE = 12
/** Teléfono: tramo de scroll (en alturas de ventana) que dura el despegue y el descenso. */
const LIFT = 0.3
const DIVE = 0.5

type Box = { x: number; y: number; w: number; h: number }
/** Una parada del sobre en teléfono: centro en la página, tamaño y altura de la ventana a la que se posa. */
type Stop = { x: number; y: number; scale: number; dock: number; el: Element }

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => t * t * (3 - 2 * t)

/** Caja de `el` dentro de `root` sin contar transformaciones: no cambia mientras algo viaja. */
function boxIn(el: HTMLElement, root: HTMLElement): Box {
  let x = 0
  let y = 0
  for (let n: HTMLElement | null = el; n && n !== root; n = n.offsetParent as HTMLElement | null) {
    x += n.offsetLeft
    y += n.offsetTop
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

/** Lleva `el` hasta el sobre y lo deja ahí; al subir de nuevo, lo devuelve. */
function travel(el: HTMLElement, sent: boolean, to: () => DOMRect, trips: Map<HTMLElement, Animation>) {
  const trip = trips.get(el)
  if (Boolean(trip && trip.playbackRate > 0) === sent) return
  if (!sent) {
    trip?.reverse()
    return
  }
  // De vuelta en la página, un viaje nuevo: el sobre ya está en otro lugar.
  trip?.cancel()
  const target = to()
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
  const probeRef = useRef<HTMLDivElement>(null)
  const m = useRef({
    homeX: 0,
    homeY: 0,
    homeW: 1,
    flightW: 1,
    top: 0,
    left: 0,
    h: 0,
    svh: 0,
    above: 0,
    flyScale: 1,
    flyX: 0,
    ys: [] as number[],
    xs: [] as number[],
    stops: [] as Stop[],
    fills: [] as { el: HTMLElement; box: Box }[],
    letter: null as { el: HTMLElement; box: Box } | null,
    open: null as Box | null,
    seal: null as Box | null,
    landed: null as Box | null,
  })
  /** Lo último que se escribió en el DOM, para no repetirlo en cada cuadro. */
  const drawn = useRef({ position: '', land: -1 })

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
    const { homeX, homeY, homeW, flightW, top, left, h, above, flyScale, flyX, stops } = m.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const narrow = window.innerWidth < NARROW
    const phone = narrow && !reduce && stops.length > 1
    // En teléfono la barra del navegador cambia la altura visible: se usa la más chica, que no brinca.
    const vh = phone ? m.current.svh : window.innerHeight
    const scroll = reduce ? 0 : window.scrollY
    const line = narrow ? vh * 0.55 : homeY

    let x = homeX
    let y = homeY - top // Coordenadas de la página: posada en teléfono y con "reducir movimiento".
    let scale = 1
    let bank = 0
    let position = ''
    let at = 0 // Teléfono: última parada a la que ya llegó.
    let land = 0 // Teléfono: 0 en vuelo → 1 posada en el destino.
    if (phone) {
      const seen = (s: Stop) => s.y + top - scroll
      for (let i = 1; i < stops.length; i++) if (seen(stops[i]) <= stops[i].dock * vh) at = i
      const cur = stops[at]
      const next = stops[at + 1] as Stop | undefined
      const v = seen(cur)
      // Lo más arriba que puede ir el centro del sobre sin que la paloma se salga de la ventana.
      const ceiling = (s: number) => EDGE + s * (h / 2 + above)
      // Posada sube con la página; al tocar el techo despega: se encoge y se va a la esquina.
      const out = next ? ease(clamp01((ceiling(cur.scale) - v) / (vh * LIFT))) : 0
      let s = lerp(cur.scale, flyScale, out)
      let vx = lerp(cur.x, flyX, out)
      let vy = next ? Math.max(v, ceiling(s)) : v
      let dive = 0
      if (next) {
        // La siguiente parada viene subiendo: baja a encontrarla y se posa.
        const vn = seen(next)
        const span = vh * DIVE
        dive = ease(clamp01((next.dock * vh + span - vn) / span))
        vx = lerp(vx, next.x, dive)
        vy = lerp(vy, vn, dive)
        // A medio camino va chiquita: pasa por encima del contenido sin taparlo.
        s = lerp(lerp(s, next.scale, dive), flyScale, 0.6 * Math.sin(Math.PI * dive))
        if (at + 1 === stops.length - 1) land = dive
      } else {
        land = 1
      }
      scale = s
      if (out > 0 || dive > 0) {
        // En vuelo va fija a la ventana; posada va en la página y el scroll la mueve solo.
        position = 'fixed'
        x = vx + left
        y = vy
      } else {
        position = 'absolute'
        x = cur.x
        y = cur.y
      }
    } else if (!reduce && !narrow) {
      y = homeY
      const here = scroll + homeY - top
      x = xAt(here)
      scale = lerp(1, flightW / homeW, clamp01(scroll / (vh * 0.5)))
      const slope = (xAt(here + 40) - xAt(here - 40)) / 80
      bank = Math.max(-MAX_BANK, Math.min(MAX_BANK, (Math.atan(slope) * 180) / Math.PI / 3))
    }
    if (drawn.current.position !== position) {
      drawn.current.position = position
      carrier.style.position = position
    }
    carrier.style.transform = `translate(${x - homeW / 2}px, ${y - h / 2}px) scale(${scale}) rotate(${bank}deg)`
    const landStep = Math.round(land * 200) / 200
    if (drawn.current.land !== landStep) {
      drawn.current.land = landStep
      carrier.style.setProperty('--land', `${landStep}`)
    }

    if (reduce) return
    const seenTop = (b: Box) => b.y + top - scroll
    const passed = (b: Box | null, offset = 0) => Boolean(b) && seenTop(b!) + b!.h / 2 + offset < line
    const envelope = carrier.querySelector<HTMLElement>('.env')!
    // En teléfono lo que viaja va al hueco donde está posado el sobre, que no se mueve en la página.
    const target = () => (phone ? stops[at].el : envelope).getBoundingClientRect()
    // Una por una: cada estampilla sale un poco después que la anterior.
    // En teléfono esperan a estar arriba: hasta entonces se ven junto con el sobre.
    const fillShift = narrow ? vh * 0.3 : -60
    const fillStep = narrow ? 60 : 70
    const sent = m.current.fills.map(({ box }, i) => (!phone || at >= 1) && passed(box, (i - 1) * fillStep + fillShift))
    m.current.fills.forEach(({ el }, i) => travel(el, sent[i], target, trips.current))
    const letter = m.current.letter
    if (letter) {
      // Se dobla cuando ya casi salió de la vista, no mientras alguien la lee.
      const gone = seenTop(letter.box) + letter.box.h < (narrow ? vh * 0.3 : line - 100)
      travel(letter.el, (!phone || at >= 2) && gone, target, trips.current)
    }
    const sealed = passed(m.current.seal)
    const isOpen = Boolean(m.current.open && seenTop(m.current.open) < line) && !sealed
    const state = isOpen ? 'open' : 'closed'
    if (envelope.dataset.state !== state) envelope.dataset.state = state
    const stamps = `${sent.filter(Boolean).length}`
    if (envelope.dataset.stamps !== stamps) envelope.dataset.stamps = stamps
    const landed = m.current.landed
    const arrived = `${phone ? at === stops.length - 1 : Boolean(landed) && seenTop(landed!) + landed!.h * 0.4 < line}`
    if (root.dataset.arrived !== arrived) root.dataset.arrived = arrived
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

      const points = [
        { x: sign.x, y: sign.y },
        { x: home.x, y: home.y },
      ]
      for (const el of root!.querySelectorAll<HTMLElement>('[data-scene]')) {
        const r = el.getBoundingClientRect()
        const x = sideX(el.dataset.scene)
        // Cruza de un lado a otro en el aire entre escenas, nunca sobre el contenido.
        // En teléfono entra más en la escena (por detrás) para que el barrido no quede en ángulo.
        const air = Math.min(parseFloat(getComputedStyle(el).paddingTop) * (narrow ? 1.7 : 1), r.height / 4)
        // Barridos largos en vez de columnas rectas: entra y sale un poco ladeada.
        const sway = flightW * (narrow ? 0.03 : 0.12)
        points.push({ x: x - sway, y: r.top - box.top + air }, { x: x + sway, y: r.bottom - box.top - air })
      }
      points.push({ x: arrival.x, y: arrival.y })

      const curves = points.slice(1).map((b, i) => {
        const a = points[i]
        const midY = (a.y + b.y) / 2
        return `C${a.x} ${midY} ${b.x} ${midY} ${b.x} ${b.y}`
      })
      routeRef.current!.setAttribute('d', [`M${points[0].x} ${points[0].y}`, ...curves].join(' '))
      arcRef.current!.setAttribute(
        'd',
        `M${origin.x} ${origin.y} C${origin.x + w * 0.34} ${origin.y + 30} ${sign.x - w * 0.16} ${sign.y + home.h * 0.5} ${sign.x} ${sign.y}`,
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
        ys.push(p.y)
        xs.push(p.x)
      }

      const carrier = carrierRef.current!
      carrier.style.width = `${home.w}px`
      const top = box.top + window.scrollY
      const h = carrier.offsetHeight

      // Teléfono: paradas del sobre (inicio, cada hueco y el destino) y tamaño en vuelo.
      const stops: Stop[] = []
      const pigeon = carrier.querySelector<HTMLElement>('.carrier__pigeon')!
      const landedEl = root!.querySelector<HTMLElement>('[data-landed]')
      const landed = landedEl && boxIn(landedEl, root!)
      if (narrow && landedEl && landed) {
        stops.push({ x: home.x, y: home.y, scale: 1, dock: 0, el: carrier })
        for (const el of root!.querySelectorAll<HTMLElement>('[data-park]')) {
          const b = boxIn(el, root!)
          // Llega cuando el hueco apenas entra: lo que viaja al sobre lo encuentra ya ahí.
          if (b.h) stops.push({ x: b.x + b.w / 2, y: b.y + b.h * 0.62, scale: (b.h * 0.92) / (home.w * 1.22), dock: 0.88, el })
        }
        stops.push({ x: landed.x + landed.w / 2, y: landed.y + landed.h / 2, scale: landed.w / home.w, dock: 0.62, el: landedEl })

        // Para posarse igual que la paloma del destino: mismo lugar y tamaño sobre el sobre.
        const there = landedEl.querySelector<HTMLElement>('.landed__pigeon')
        if (there) {
          const k = home.w / landed.w
          const dx = (there.offsetLeft + there.offsetWidth / 2) * k - (pigeon.offsetLeft + pigeon.offsetWidth / 2)
          const dy = (there.offsetTop + there.offsetHeight / 2) * k - (pigeon.offsetTop + pigeon.offsetHeight / 2)
          carrier.style.setProperty('--land-x', `${dx.toFixed(1)}px`)
          carrier.style.setProperty('--land-y', `${dy.toFixed(1)}px`)
          carrier.style.setProperty('--land-scale', `${((there.offsetWidth * k) / pigeon.offsetWidth).toFixed(3)}`)
        }
      }
      const flyW = Math.max(76, Math.min(window.innerWidth * 0.23, 100))
      const one = (selector: string) => {
        const el = root!.querySelector<HTMLElement>(selector)
        return el && { el, box: boxIn(el, root!) }
      }
      m.current = {
        homeX: home.x,
        homeY: home.y + top,
        homeW: home.w,
        flightW,
        top,
        left: box.left + window.scrollX,
        h,
        svh: probeRef.current?.offsetHeight || window.innerHeight,
        above: Math.max(0, -pigeon.offsetTop),
        flyScale: flyW / home.w,
        flyX: w - EDGE - flyW * 0.56,
        ys,
        xs,
        stops,
        fills: [...root!.querySelectorAll<HTMLElement>('[data-fill]')].map((el) => ({ el, box: boxIn(el, root!) })),
        letter: one('[data-send]'),
        open: one('[data-open]')?.box ?? null,
        seal: one('[data-seal]')?.box ?? null,
        landed,
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
      <div ref={probeRef} className="svh-probe" aria-hidden="true" />
      <div ref={carrierRef} className="carrier" aria-hidden="true">
        <Pigeon pose="flying" className="carrier__pigeon" />
        <Envelope state="closed" />
      </div>
    </>
  )
}
