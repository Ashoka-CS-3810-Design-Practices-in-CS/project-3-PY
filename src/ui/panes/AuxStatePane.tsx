/**
 * AuxStatePane — pane 3 of 3: the auxiliary state.
 *
 * WHAT IT DOES
 *   Renders `step.aux`, choosing the view by `aux.kind`. When a step carries no
 *   `aux` — which is the honest case for linked-list insert, whose auxiliary space
 *   is O(1) — it says so rather than inventing a container.
 *
 * WHY THIS FILE EXISTS
 *   `aux.kind` selects which panel renders (`FR10`). Keeping the choice explicit
 *   here means a new structure adds a case, not a new pane. An absent `aux` is
 *   distinct from "no step selected", so the two are reported separately.
 *
 * RULES
 *   No algorithm state, no timer. It never recomputes anything from the model: it
 *   displays exactly what the step carries. Styling uses the semantic tokens in
 *   `src/index.css`.
 */

import type { AuxState, AuxKind } from '../../core/trace/step'

export type AuxStatePaneProps = {
  aux: AuxState | undefined
  /** False before any trace is loaded, so "no step" is not confused with "no aux". */
  hasStep: boolean
}

const KIND_LABEL: Record<AuxKind, string> = {
  array: 'array (values in list order)',
  stack: 'stack',
  queue: 'queue (frontier)',
  heap: 'heap',
  visited: 'visited set',
  recursion: 'call-stack frames',
}

export function AuxStatePane({ aux, hasStep }: AuxStatePaneProps) {
  return (
    <section
      aria-label="Auxiliary state"
      className="rounded-xl border border-line bg-surface p-3"
    >
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
        Auxiliary state
      </h2>

      {!hasStep ? (
        <p className="text-sm text-muted">No step selected.</p>
      ) : aux === undefined ? (
        <p className="text-sm text-ink-dim">
          None — this operation keeps O(1) auxiliary state, so there is no
          container to show.
        </p>
      ) : aux.kind === 'array' ? (
        <ul className="flex flex-wrap gap-2">
          {(aux.values ?? []).length === 0 ? (
            <li className="text-sm text-muted">empty</li>
          ) : (
            (aux.values ?? []).map((value, position) => (
              <li
                key={`${position}-${String(value)}`}
                className="rounded border border-raised bg-base-deep px-2 py-1 font-mono text-sm text-ink"
              >
                {String(value)}
              </li>
            ))
          )}
        </ul>
      ) : (
        <p className="text-sm text-ink-dim">{KIND_LABEL[aux.kind]}</p>
      )}

      {aux !== undefined && (
        <p className="mt-2 text-xs text-muted">
          kind: <span className="font-mono">{KIND_LABEL[aux.kind]}</span> ·
          comparisons: {aux.comparisons ?? 0}
        </p>
      )}
    </section>
  )
}
