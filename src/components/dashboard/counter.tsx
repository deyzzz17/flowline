'use client'

import { useCountUp } from '@/hooks/dashboard/use-count-up'

export const Counter = ({ to, suffix = '' }: { to: number; suffix?: string }) => {
  const { value, ref } = useCountUp(to)
  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  )
}
