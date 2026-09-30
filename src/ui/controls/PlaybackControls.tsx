/**
 * PlaybackControls — play, pause, step, restart and scrub.
 *
 * WHAT IT DOES
 *   Every control dispatches a controller command, so a button and a keyboard
 *   shortcut take the same code path (`NFR-U2`). Buttons disable themselves
 *   according to the phase and the index, so the UI cannot reach an invalid state.
 *
 * WHY THIS FILE EXISTS
 *   Playback is index arithmetic over one trace (`ADR-1`, `ADR-4`). The controls
 *   own no state of their own; they read the controller snapshot and call into it.
 *
 * RULES
 *   No timer here — PLAYING is the only phase that owns one, and it lives in
 *   `app/controller.ts`. Styling uses the semantic tokens in `src/index.css`.
 */

import type { ControllerSnapshot } from '../../app/controller'
import { holdsTrace } from '../../app/stateMachine'

export type PlaybackControlsProps = {
  snapshot: ControllerSnapshot
  onPlay(): void
  onPause(): void
  onStepForward(): void
  onStepBack(): void
  onRestart(): void
  onSeek(index: number): void
}

const BUTTON =
  'rounded-md border border-raised bg-surface px-3 py-1.5 text-sm text-ink hover:bg-raised disabled:cursor-not-allowed disabled:opacity-40'

export function PlaybackControls({
  snapshot,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onRestart,
  onSeek,
}: PlaybackControlsProps) {
  const total = snapshot.trace.length
  const loaded = holdsTrace(snapshot.phase) && total > 0
  const playing = snapshot.phase === 'PLAYING'
  const atStart = snapshot.index === 0
  const atEnd = total === 0 || snapshot.index >= total - 1

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Playback"
    >
      <button
        type="button"
        className={BUTTON}
        onClick={onRestart}
        disabled={!loaded}
      >
        Restart
      </button>
      <button
        type="button"
        className={BUTTON}
        onClick={onStepBack}
        disabled={!loaded || atStart}
      >
        Previous step
      </button>
      <button
        type="button"
        className={BUTTON}
        onClick={playing ? onPause : onPlay}
        disabled={!loaded}
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        className={BUTTON}
        onClick={onStepForward}
        disabled={!loaded || atEnd}
      >
        Next step
      </button>

      <label className="flex min-w-56 flex-1 items-center gap-3 text-xs text-ink-dim">
        <span className="sr-only">Scrub to a step</span>
        <input
          type="range"
          min={0}
          max={Math.max(total - 1, 0)}
          value={snapshot.index}
          disabled={!loaded}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="w-full [accent-color:var(--color-accent)]"
          aria-label="Scrub to a step"
        />
        <span className="tabular-nums">
          {total === 0 ? '0 / 0' : `${snapshot.index + 1} / ${total}`}
        </span>
      </label>
    </div>
  )
}
