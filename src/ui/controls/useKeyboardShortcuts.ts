/**
 * useKeyboardShortcuts — the keyboard half of the controls.
 *
 * WHAT IT DOES
 *   Binds `Space` (play/pause), `←`/`→` (step) and `R` (restart) to the *same*
 *   controller commands the buttons call.
 *
 * WHY THIS FILE EXISTS
 *   Keyboard parity is a requirement, not a nicety (`NFR-U2`). Sharing the code
 *   path is what makes the accessible route the real route rather than a parallel
 *   one.
 *
 * RULES
 *   Handlers are read through a ref that is refreshed every render, so the listener
 *   is attached once and never captures a stale index. Typing in an input or a
 *   textarea is ignored.
 */

import { useEffect, useRef } from 'react'

export type ShortcutHandlers = {
  onTogglePlay(): void
  onStepForward(): void
  onStepBack(): void
  onRestart(): void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  const latest = useRef(handlers)

  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        target?.isContentEditable === true
      ) {
        return
      }

      switch (event.key) {
        case ' ':
          event.preventDefault()
          latest.current.onTogglePlay()
          break
        case 'ArrowRight':
          event.preventDefault()
          latest.current.onStepForward()
          break
        case 'ArrowLeft':
          event.preventDefault()
          latest.current.onStepBack()
          break
        case 'r':
        case 'R':
          latest.current.onRestart()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
