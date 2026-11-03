import { gsap } from 'gsap'
import { useEffect, useRef, type RefObject } from 'react'

/*
 * El hilo rojo. Recorre, en orden del documento, los elementos marcados con
 * `data-anchor` dentro de `rootRef` y termina formando una X sobre
 * `[data-x-mark]`. Los anclajes visibles (`.node`) se encienden cuando el hilo
 * los alcanza. `data-tangent="x,y"` cambia la dirección con que el hilo pasa
 * por un anclaje (por defecto, hacia abajo); `data-tangent-out`, la dirección
 * con que sale, para hacer un nudo.
 *
 * La punta del hilo sigue al scroll nativo: se dibuja hasta la altura del 62 %
 * de la ventana. No fija secciones ni bloquea el desplazamiento.
 */

type Anchor = { el: HTMLElement; x: number; y: number; tx: number; ty: number; ox: number; oy: number }

const TIP_AT = 0.62
const SAMPLE_STEP = 6

/** Posición sin transformaciones, para que las animaciones de entrada no muevan el trazo. */
function offsetWithin(el: HTMLElement, root: HTMLElement) {
  let x = el.offsetWidth / 2
  let y = el.offsetHeight / 2
  let node: HTMLElement | null = el
  while (node && node !== root) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return { x, y }
}

function segment(a: Anchor, b: { x: number; y: number; tx: number; ty: number }) {
  const k = Math.hypot(b.x - a.x, b.y - a.y) * 0.45
  return `C${a.x + a.ox * k} ${a.y + a.oy * k} ${b.x - b.tx * k} ${b.y - b.ty * k} ${b.x} ${b.y}`
}

function unit(value: string | undefined, fallback: string) {
  const [x, y] = (value ?? fallback).split(',').map(Number)
  const len = Math.hypot(x, y) || 1
  return [x / len, y / len]
}

/** La X: el hilo llega a la esquina superior izquierda y la cruza; el segundo brazo se dibuja después. */
function xMark(cx: number, cy: number, s: number) {
  const d = Math.SQRT1_2
  return {
    start: { x: cx - s, y: cy - s, tx: d, ty: d },
    first: `L${cx + s} ${cy + s}`,
    second: `M${cx + s} ${cy - s} L${cx - s} ${cy + s}`,
  }
}

export function Thread({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const crossRef = useRef<SVGPathElement>(null)
  const shadowRef = useRef<SVGPathElement>(null)
  const crossShadowRef = useRef<SVGPathElement>(null)
  const tipRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const svg = svgRef.current
    const path = pathRef.current
    const cross = crossRef.current
    const tip = tipRef.current
    const shadow = shadowRef.current
    const crossShadow = crossShadowRef.current
    if (!root || !svg || !path || !cross || !tip || !shadow || !crossShadow) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let total = 0
    let mainLen = 0
    let crossLen = 0
    let nodes: { el: HTMLElement; at: number }[] = []
    let maxY: Float32Array = new Float32Array(0)
    const state = { drawn: 0 }
    let laidOut = false

    function layout() {
      const anchors: Anchor[] = [...root!.querySelectorAll<HTMLElement>('[data-anchor]')]
        .filter((el) => el.offsetParent !== null)
        .map((el) => {
          const [tx, ty] = unit(el.dataset.tangent, '0,1')
          const [ox, oy] = unit(el.dataset.tangentOut, el.dataset.tangent ?? '0,1')
          return { el, ...offsetWithin(el, root!), tx, ty, ox, oy }
        })
      const mark = root!.querySelector<HTMLElement>('[data-x-mark]')
      if (anchors.length < 2) return

      const w = root!.offsetWidth
      const h = root!.offsetHeight
      svg!.setAttribute('viewBox', `0 0 ${w} ${h}`)
      svg!.style.height = `${h}px`

      const parts = [`M${anchors[0].x} ${anchors[0].y}`]
      const prefixes: string[] = [parts[0]]
      for (let i = 1; i < anchors.length; i++) {
        parts.push(segment(anchors[i - 1], anchors[i]))
        prefixes.push(parts.join(' '))
      }
      if (mark) {
        const { x, y } = offsetWithin(mark, root!)
        const x0 = xMark(x, y, mark.offsetWidth * 0.32)
        parts.push(segment(anchors[anchors.length - 1], x0.start), x0.first)
        cross!.setAttribute('d', x0.second)
        crossShadow!.setAttribute('d', x0.second)
      } else {
        cross!.removeAttribute('d')
        crossShadow!.removeAttribute('d')
      }
      path!.setAttribute('d', parts.join(' '))
      shadow!.setAttribute('d', parts.join(' '))
      mainLen = path!.getTotalLength()
      crossLen = mark ? cross!.getTotalLength() : 0
      total = mainLen + crossLen

      // Largo del hilo en cada anclaje, para encender sus nodos.
      const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      svg!.appendChild(probe)
      nodes = anchors
        .map((a, i) => {
          probe.setAttribute('d', prefixes[i])
          return { el: a.el, at: i === 0 ? 0 : probe.getTotalLength() }
        })
        .filter((n) => n.el.classList.contains('node'))
      probe.remove()
      if (mark) nodes.push({ el: mark, at: total - 4 })

      // Tabla largo → altura máxima alcanzada, para traducir scroll en trazo.
      const samples = Math.ceil(mainLen / SAMPLE_STEP) + 1
      maxY = new Float32Array(samples)
      let m = -Infinity
      for (let i = 0; i < samples; i++) {
        m = Math.max(m, path!.getPointAtLength(Math.min(i * SAMPLE_STEP, mainLen)).y)
        maxY[i] = m
      }

      for (const p of [path!, shadow!]) p.style.strokeDasharray = `${mainLen} ${mainLen}`
      for (const p of [cross!, crossShadow!]) p.style.strokeDasharray = `${crossLen} ${crossLen}`
      laidOut = true
      if (reduce.matches) state.drawn = total
      render()
      update(true)
    }

    function lengthAt(y: number) {
      let lo = 0
      let hi = maxY.length - 1
      if (y >= maxY[hi]) return total
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (maxY[mid] < y) lo = mid + 1
        else hi = mid
      }
      return Math.min(lo * SAMPLE_STEP, mainLen)
    }

    function target() {
      const doc = document.documentElement
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 4) return total
      const top = root!.getBoundingClientRect().top
      return lengthAt(window.innerHeight * TIP_AT - top)
    }

    function render() {
      const onMain = Math.min(state.drawn, mainLen)
      const onCross = Math.max(0, state.drawn - mainLen)
      for (const p of [path!, shadow!]) p.style.strokeDashoffset = `${mainLen - onMain}`
      for (const p of [cross!, crossShadow!]) p.style.strokeDashoffset = `${crossLen - onCross}`
      const p = onCross > 0 ? cross!.getPointAtLength(onCross) : path!.getPointAtLength(onMain)
      tip!.setAttribute('cx', `${p.x}`)
      tip!.setAttribute('cy', `${p.y}`)
      tip!.style.opacity = state.drawn > 0 && state.drawn < total - 1 ? '1' : '0'
      for (const n of nodes) n.el.classList.toggle('is-lit', state.drawn >= n.at - 2)
    }

    function update(instant = false) {
      if (!laidOut) return
      const goal = reduce.matches ? total : target()
      if (instant && reduce.matches) {
        state.drawn = goal
        render()
        return
      }
      // Un poco de inercia, como un hilo que se desenrolla; nunca bloquea el scroll.
      gsap.to(state, {
        drawn: goal,
        duration: instant ? 1.4 : 0.7,
        ease: instant ? 'power2.inOut' : 'power3.out',
        overwrite: true,
        onUpdate: render,
      })
    }

    // Scroll nativo (pasivo): no depende del orden ni del espacio de los pines de ScrollTrigger.
    let scrollFrame = 0
    const onScroll = () => {
      cancelAnimationFrame(scrollFrame)
      scrollFrame = requestAnimationFrame(() => update())
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    let frame = 0
    const relayout = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(layout)
    }
    const observer = new ResizeObserver(relayout)
    observer.observe(root)
    document.fonts?.ready.then(relayout)
    reduce.addEventListener('change', relayout)

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(scrollFrame)
      observer.disconnect()
      cancelAnimationFrame(frame)
      reduce.removeEventListener('change', relayout)
      gsap.killTweensOf(state)
    }
  }, [rootRef])

  return (
    <svg ref={svgRef} className="thread" aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <path ref={shadowRef} className="thread__shadow" />
      <path ref={crossShadowRef} className="thread__shadow" />
      <path ref={pathRef} className="thread__line" />
      <path ref={crossRef} className="thread__line" />
      <circle ref={tipRef} className="thread__tip" r="4.5" />
    </svg>
  )
}
