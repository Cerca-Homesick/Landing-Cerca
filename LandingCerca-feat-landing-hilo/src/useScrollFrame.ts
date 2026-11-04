import { useEffect, useRef } from 'react'

/** Llama a `onFrame` como máximo una vez por cuadro al hacer scroll o cambiar el tamaño. */
export function useScrollFrame(onFrame: () => void) {
  const latest = useRef(onFrame)
  useEffect(() => {
    latest.current = onFrame
  })

  useEffect(() => {
    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        latest.current()
      })
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
    }
  }, [])
}
