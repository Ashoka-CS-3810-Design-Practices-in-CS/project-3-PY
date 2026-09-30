/**
 * WorkspaceShell — the fixed frame everything is mounted inside.
 *
 * WHAT IT DOES
 *   Lays out the catalogue sidebar, the guide, the three panes, the complexity
 *   panel and the playback controls. Below 1024 px it collapses to one column.
 *
 * WHY THIS FILE EXISTS
 *   The shell is deliberately dumb: it receives already-built nodes and places
 *   them. It owns no state, so the step index still lives in exactly one place
 *   (`ADR-4`), and the layout is the only thing that changes when panes move.
 *
 * RULES
 *   No algorithm state, no step index, no timer. The panes it hosts are
 *   independent pure functions of `(trace, index)`. Styling comes from the
 *   semantic design tokens in `src/index.css` (NFR-U2), never from raw hex.
 */

import type { ReactNode } from 'react'

export type WorkspaceShellProps = {
  sidebar: ReactNode
  guide: ReactNode
  structure: ReactNode
  pseudocode: ReactNode
  aux: ReactNode
  complexity: ReactNode
  controls: ReactNode
  announcer: ReactNode
  phaseLabel: string
  error: string | null
}

export function WorkspaceShell({
  sidebar,
  guide,
  structure,
  pseudocode,
  aux,
  complexity,
  controls,
  announcer,
  phaseLabel,
  error,
}: WorkspaceShellProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col gap-4 bg-base p-4 text-ink">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-lg font-semibold text-ink">
          Interactive Data Structure &amp; Algorithm Visualiser
        </h1>
        <p className="text-xs text-muted">
          status: <span className="text-ink-dim">{phaseLabel}</span>
          {error !== null && <span className="ml-2 text-bad">{error}</span>}
        </p>
      </header>

      {error !== null && (
        <p
          role="alert"
          className="rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad"
        >
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-line bg-surface p-3">
          {sidebar}
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          {guide}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {structure}
            <div className="flex flex-col gap-4">
              {pseudocode}
              {aux}
              {complexity}
            </div>
          </div>
        </div>
      </div>

      <footer className="rounded-xl border border-line bg-surface p-3">
        {controls}
        {announcer}
      </footer>
    </div>
  )
}
