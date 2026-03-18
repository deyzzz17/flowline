import { useEffect, useRef, useState } from 'react'

export function useCountUp(to: number) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        let start = 0
        const step = to / 60
        const tick = () => {
          start += step
          if (start >= to) {
            setValue(to)
            return
          }
          setValue(Math.floor(start))
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [to])

  return { value, ref }
}
