# `src/ui/controls/`

Playback: play, pause, step forward, step back, scrub, restart and exact replay of any step. Every
control is an operation on the **single** step index owned by `app/controller.ts` (`ADR-4`).

Expected files:

- `PlaybackControls.tsx` — the button row; each button calls a controller command.
- `StepScrubber.tsx` — a slider/range over `0 … trace.length - 1` (rendered as a `<input
  type="range">` so it is keyboard operable for free).
- `useKeyboardShortcuts.ts` — `Space`, `←`/`→`, `R`, dispatching the *same* controller commands as
  the buttons (`NFR-U2`).

`PLAYING` is the only state that owns a timer; play must be idempotent so rapid input cannot start
two animations (`ER12`, `ADR-4`).
