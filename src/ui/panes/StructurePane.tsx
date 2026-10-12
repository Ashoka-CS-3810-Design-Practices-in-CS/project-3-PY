/**
 * StructurePane — pane 1 of 3: the structure view.
 *
 * WHAT IT DOES
 *   Picks the renderer that matches the loaded structure and hosts it inside an
 *   error boundary, with a legend so node colours are never the only explanation of
 *   what is happening. The state is a discriminated `StructureState`, so switching
 *   on `structureId` gives the matching model type — no casts here.
 *
 * WHY THIS FILE EXISTS
 *   One host for every structure means the shell never has to know which one is
 *   loaded, and a new structure adds a case here plus a renderer, not a new pane
 *   (`ADR-1`, A2 Listing 18). Failure stays local: a renderer that throws is
 *   replaced by a fallback and the code/aux panes keep working (`ER13`).
 *
 * RULES
 *   No algorithm state, no step index, no timer. Styling uses the semantic tokens
 *   in `src/index.css`.
 */

import type { StructureState } from '../../app/reducers'
import type { Step } from '../../core/trace/step'
import { GraphRenderer } from '../../render/renderers/graph'
import { HeapRenderer } from '../../render/renderers/heap'
import { ListRenderer } from '../../render/renderers/list'
import { TreeRenderer } from '../../render/renderers/tree'
import { ErrorBoundary } from '../ErrorBoundary'

export type StructurePaneProps = {
  /** `null` before any trace is loaded, so the pane can say so. */
  state: StructureState | null
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
        {state === null ? (
          <EmptyState text="Load a trace to see the structure." />
        ) : (
          <StructureView state={state} step={step} />
        )}
      </ErrorBoundary>
      <Legend structureId={state?.structureId ?? null} />
    </section>
  )
}

function StructureView({
  state,
  step,
}: {
  state: StructureState
  step: Step | undefined
}) {
  switch (state.structureId) {
    case 'list':
      return state.model.nodes.length === 0 ? (
        <EmptyState text="Load a trace to see the list." />
      ) : (
        <ListRenderer state={state.model} step={step} />
      )
    case 'bst':
      return state.model.root === null ? (
        <EmptyState text="The tree is empty — insert a key to see it." />
      ) : (
        <TreeRenderer state={state.model} step={step} />
      )
    case 'heap':
      return state.model.entries.length === 0 ? (
        <EmptyState text="The heap is empty." />
      ) : (
        <HeapRenderer state={state.model} step={step} />
      )
    case 'graph':
      return state.model.vertices.length === 0 ? (
        <EmptyState text="The graph is empty." />
      ) : (
        <GraphRenderer state={state.model} step={step} />
      )
  }
}

function EmptyState({ text }: { text: string }) {
  return <p className="p-8 text-sm text-muted">{text}</p>
}

/** One legend per structure, because the four states differ by structure. */
function Legend({ structureId }: { structureId: string | null }) {
  if (structureId === 'graph') {
    return (
      <ul className="mt-2 flex flex-wrap gap-3 text-xs text-ink-dim">
        <LegendItem
          colour="var(--color-node-undiscovered)"
          label="undiscovered"
        />
        <LegendItem colour="var(--color-node-frontier)" label="frontier" />
        <LegendItem colour="var(--color-node-current)" label="current" />
        <LegendItem colour="var(--color-node-visited)" label="visited" />
      </ul>
    )
  }

  if (structureId === 'bst' || structureId === 'heap') {
    return (
      <ul className="mt-2 flex flex-wrap gap-3 text-xs text-ink-dim">
        <LegendItem colour="var(--color-node-current)" label="current" />
        <LegendItem colour="var(--color-node-frontier)" label="examined" />
        <LegendItem colour="var(--color-node-visited)" label="visited" />
        <LegendItem colour="var(--color-node-undiscovered)" label="idle" />
        {structureId === 'heap' && (
          <li className="text-muted">array index = tree slot</li>
        )}
      </ul>
    )
  }

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
