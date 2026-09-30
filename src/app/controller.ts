/**
 * Session controller — the single owner of the step index and the single timer.
 *
 * WHAT IT DOES
 *   The `PlaybackController` the UI talks to: `load`, `play`, `pause`,
 *   `stepForward`, `stepBack`, `restart`, `seek`. Each command is idempotent and
 *   clamped to `0 … trace.length - 1`, and each publishes the new snapshot to its
 *   subscribers (the UI reads it through `useSyncExternalStore`).
 *
 * WHY THIS FILE EXISTS
 *   There is exactly one mutable value in the whole app — the index — and exactly
 *   one timer (ADR-4, ER12). Having them here is what makes playback a pure
 *   function of `(trace, index)` everywhere else, and makes step-back, scrub and
 *   exact replay nearly free (ADR-1). The timer drives the index from *elapsed
 *   time*, not tick counts, so a slow frame drops steps instead of changing the
 *   logical playback rate.
 *
 * RULES
 *   The only layer that knows about time, and only PLAYING owns a timer. It must
 *   not import React or the DOM — it is a plain object, unit-testable in Node.
 *   `reconstruct` is always a fresh copy, so nothing can corrupt a checkpoint.
 */

import { applyListDelta, type LinkedListModel } from '../core/model/linkedList'
import type { GenerateSummary, Step } from '../core/trace/step'
import { createTraceStore, type TraceStore } from '../core/trace/store'
import { canPlay, type Phase } from './stateMachine'

export type ControllerSnapshot = {
  phase: Phase
  index: number
  trace: readonly Step[]
  summary: GenerateSummary | null
  structureId: string | null
  operationId: string | null
  error: string | null
}

export type LoadInput = {
  initial: LinkedListModel
  steps: readonly Step[]
  summary: GenerateSummary
  structureId: string
  operationId: string
}

export type PlaybackController = {
  subscribe(listener: () => void): () => void
  getSnapshot(): ControllerSnapshot
  /** The structure at the current index. */
  getState(): LinkedListModel
  load(input: LoadInput): void
  fail(message: string): void
  play(): void
  pause(): void
  stepForward(): void
  stepBack(): void
  restart(): void
  seek(index: number): void
}

export type ControllerOptions = {
  /** Wall-clock milliseconds between steps while playing. */
  stepMs?: number
  /** How often the timer wakes up to recompute the index. */
  tickMs?: number
  /** Injectable clock, so tests are deterministic. */
  now?: () => number
}

const EMPTY_LIST: LinkedListModel = { nodes: [], links: [], head: null }

export function createPlaybackController(
  options: ControllerOptions = {},
): PlaybackController {
  const stepMs = options.stepMs ?? 700
  const tickMs = options.tickMs ?? 80
  const now = options.now ?? ((): number => performance.now())

  const listeners: (() => void)[] = []
  let store: TraceStore<LinkedListModel> | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let playStartedAt = 0
  let indexAtPlayStart = 0

  let snapshot: ControllerSnapshot = {
    phase: 'IDLE',
    index: 0,
    trace: [],
    summary: null,
    structureId: null,
    operationId: null,
    error: null,
  }

  const publish = (patch: Partial<ControllerSnapshot>): void => {
    snapshot = { ...snapshot, ...patch }
    for (const listener of listeners) {
      listener()
    }
  }

  const lastIndex = (): number => snapshot.trace.length - 1
  const clamp = (index: number): number =>
    Math.max(0, Math.min(index, lastIndex()))

  const stopTimer = (): void => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  const tick = (): void => {
    const advance = Math.floor((now() - playStartedAt) / stepMs)
    const next = clamp(indexAtPlayStart + advance)
    if (next >= lastIndex()) {
      stopTimer()
      publish({ index: next, phase: 'FINISHED' })
    } else if (next !== snapshot.index) {
      publish({ index: next })
    }
  }

  const play = (): void => {
    if (!canPlay(snapshot.phase) || snapshot.trace.length === 0) return

    // Replaying from the end starts over rather than doing nothing.
    const start = snapshot.index >= lastIndex() ? 0 : snapshot.index
    indexAtPlayStart = start
    playStartedAt = now()
    stopTimer()
    publish({ phase: 'PLAYING', index: start })
    timer = setInterval(tick, tickMs)
  }

  const pause = (): void => {
    if (snapshot.phase !== 'PLAYING') return
    stopTimer()
    publish({ phase: snapshot.index >= lastIndex() ? 'FINISHED' : 'PAUSED' })
  }

  /** Any manual jump stops the timer and lands in PAUSED (or FINISHED at the end). */
  const moveTo = (index: number): void => {
    if (snapshot.trace.length === 0) return
    stopTimer()
    const next = clamp(index)
    publish({ index: next, phase: next >= lastIndex() ? 'FINISHED' : 'PAUSED' })
  }

  return {
    subscribe(listener) {
      listeners.push(listener)
      return () => {
        const at = listeners.indexOf(listener)
        if (at !== -1) listeners.splice(at, 1)
      }
    },

    getSnapshot() {
      return snapshot
    },

    getState() {
      if (store === null) return structuredClone(EMPTY_LIST)
      return store.reconstruct(snapshot.index)
    },

    load(input) {
      stopTimer()
      store = createTraceStore(input.initial, input.steps, applyListDelta)
      publish({
        phase: 'READY',
        index: 0,
        trace: input.steps,
        summary: input.summary,
        structureId: input.structureId,
        operationId: input.operationId,
        error: null,
      })
    },

    fail(message) {
      stopTimer()
      publish({ phase: 'ERROR', error: message })
    },

    play,
    pause,

    stepForward() {
      moveTo(snapshot.index + 1)
    },

    stepBack() {
      moveTo(snapshot.index - 1)
    },

    restart() {
      if (snapshot.trace.length === 0) return
      stopTimer()
      publish({ index: 0, phase: 'READY' })
    },

    seek(index) {
      moveTo(index)
    },
  }
}
