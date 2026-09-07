'use client'

import { useEffect, useRef } from 'react'

export function ClickSoundProvider({ children }: { children: React.ReactNode }) {
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const playClickSound = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        
        const ctx = audioCtxRef.current
        if (ctx.state === 'suspended') {
          ctx.resume()
        }

        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        // Gamified "pop/click" sound
        // Start high, drop fast
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(800, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04)
        
        // Very short volume envelope
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
        
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.04)
      } catch (e) {
        // Silently fail if audio isn't supported or allowed yet
      }
    }

    const handleClick = (e: MouseEvent) => {
      // Traverse up to find if a clickable element was clicked
      let target = e.target as HTMLElement | null
      let isClickable = false
      
      while (target && target !== document.body) {
        const tag = target.tagName.toLowerCase()
        const role = target.getAttribute('role')
        
        const classNameStr = typeof target.className === 'string' 
          ? target.className 
          : (target.className && typeof (target.className as any).baseVal === 'string') 
            ? (target.className as any).baseVal 
            : ''
        
        if (
          tag === 'button' || 
          tag === 'a' || 
          role === 'button' ||
          target.onclick != null ||
          classNameStr.includes('cursor-pointer') ||
          classNameStr.includes('hover:')
        ) {
          isClickable = true
          break
        }
        target = target.parentElement
      }

      if (isClickable) {
        playClickSound()
      }
    }

    // Capture phase so it fires even if e.stopPropagation() is called by the button
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
      if (audioCtxRef.current?.state !== 'closed') {
        audioCtxRef.current?.close().catch(() => {})
      }
    }
  }, [])

  return <>{children}</>
}
