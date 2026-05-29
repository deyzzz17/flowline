'use client'

import { useCallback, useRef } from 'react'

export const useTimerSounds = () => {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(async (): Promise<AudioContext> => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )()
    }

    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume()
    }

    return audioCtxRef.current
  }, [])

  const playPhaseChange = useCallback(async () => {
    try {
      const ctx = await getCtx()
      const now = ctx.currentTime
      const notes = [523.25, 659.25]

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + i * 0.15)
        gain.gain.setValueAtTime(0, now + i * 0.15)
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.15 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.25)
        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.25)
      })
    } catch {}
  }, [getCtx])

  const playSessionEnd = useCallback(async () => {
    try {
      const ctx = await getCtx()
      const now = ctx.currentTime
      const notes = [
        { freq: 523.25, time: 0 },
        { freq: 659.25, time: 0.18 },
        { freq: 783.99, time: 0.36 },
        { freq: 1046.5, time: 0.54 },
      ]

      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc.connect(gain)
        osc2.connect(gain2)
        gain.connect(ctx.destination)
        gain2.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + time)
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(freq * 2, now + time)
        gain2.gain.setValueAtTime(0.05, now + time)
        gain2.gain.exponentialRampToValueAtTime(0.001, now + time + 0.5)
        gain.gain.setValueAtTime(0, now + time)
        gain.gain.linearRampToValueAtTime(0.22, now + time + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.5)
        osc.start(now + time)
        osc.stop(now + time + 0.5)
        osc2.start(now + time)
        osc2.stop(now + time + 0.5)
      })
    } catch {}
  }, [getCtx])

  return { playPhaseChange, playSessionEnd }
}
