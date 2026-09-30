# `src/ui/shell/`

The fixed three-pane workspace frame that everything else is mounted inside: catalogue sidebar on
the left, structure / pseudocode / auxiliary panes in the middle, controls and complexity along the
bottom. Below 1024 px the fixed shell collapses to a single stacked column (`NFR-Po2`).

Expected files (names are a suggestion, not fixed by A2):

- `WorkspaceShell.tsx` — layout + mount points, receives `(trace, index, controller)`.

Keeps no state of its own beyond layout: the step index belongs to `app/controller.ts` (`ADR-4`).
