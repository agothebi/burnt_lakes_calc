import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number    // ms
  formatFn?: (n: number) => string
  className?: string
}

/**
 * Rolls a number up from its previous value to the new value over `duration`ms.
 * Uses requestAnimationFrame for smooth 60fps animation.
 * Falls back gracefully if the browser reduces motion.
 */
export function AnimatedNumber({
  value,
  duration = 1400,
  formatFn = n => Math.round(n).toLocaleString(),
  className = '',
}: AnimatedNumberProps) {
  const [displayed, setDisplayed] = useState(0)
  const prevRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    prevRef.current = value

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    startTimeRef.current = null

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(to)
      return
    }

    function step(timestamp: number) {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(from + (to - from) * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return (
    <span className={className}>
      {formatFn(displayed)}
    </span>
  )
}
