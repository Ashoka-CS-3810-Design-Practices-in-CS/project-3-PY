/**
 * StructurePane — pane 1 of 3: the structure view.
 *
 * WHAT IT DOES
 *   Renders the current structure through the matching `render/renderers/*`
 *   component, inside an error boundary, with a legend so the node colours are not
 *   the only explanation of what is happening.
 *
 * WHY THIS FILE EXISTS
 *   It is the host for per-structure renderers, so the shell never has to know
 *   which structure is loaded. The structure and the step are handed in; the pane
 *   owns nothing (`ADR-1`).
 *
 * RULES
 *   No algorithm state, no step index, no timer. Failure stays local (ER13).
 *   Styling uses the semantic tokens in `src/index.css`.
 */

import type { LinkedListModel } from '../../core/model/linkedList'
import type { Step } from '../../core/trace/step'
import { ListRenderer } from '../../render/renderers/list'
import { ErrorBoundary } from '../ErrorBoundary'

export type StructurePaneProps = {
  state: LinkedListModel
  step: Step | undefined
}

export function StructurePane({ state, step }: StructurePaneProps) {
  return (
    <section
      aria-label="Structure view"
      className="rounded-xl border border-line bg-surface p-3"
    >
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
        Structure
      </h2>
      <ErrorBoundary title="structure view">
        {state.nodes.length === 0 ? (
          <p className="p-8 text-sm text-muted">
            Load a trace to see the list.
          </p>
        ) : (
          <ListRenderer state={state} step={step} />
        )}
      </ErrorBoundary>
      <Legend />
    </section>
  )
}

function Legend() {
  return (
    <ul className="mt-2 flex flex-wrap gap-3 text-xs text-ink-dim">
      <LegendItem colour="var(--color-node-current)" label="current" />
      <LegendItem colour="var(--color-node-frontier)" label="touched" />
      <LegendItem colour="var(--color-node-undiscovered)" label="idle" />
      <li className="text-muted">floating = created but not linked yet</li>
    </ul>
  )
}

function LegendItem({ colour, label }: { colour: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="inline-block h-3 w-3 rounded-full border border-base"
        style={{ backgroundColor: colour }}
      />
      {label}
    </li>
  )
}
