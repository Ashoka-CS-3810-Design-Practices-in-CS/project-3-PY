/**
 * AuxStatePane — pane 3 of 3: the auxiliary state.
 *
 * WHAT IT DOES
 *   Renders `step.aux`, choosing the view by `aux.kind`: an array, a stack, a FIFO
 *   frontier, the heap array with its live indices, a visited set, or the recursion
 *   frames. When a step carries no `aux` — the honest case for linked-list insert,
 *   whose auxiliary space is O(1) — it says so rather than inventing a container.
 *
 * WHY THIS FILE EXISTS
 *   `aux.kind` selects which panel renders (`FR10`). Keeping the choice explicit in
 *   one component means a new structure adds a case, not a new pane, and the panel
 *   never recomputes anything: it displays exactly what the step carries, so the
 *   picture of the frontier is the frontier the algorithm actually used.
 *
 * RULES
 *   No algorithm state, no timer. An absent `aux` is distinct from "no step
 *   selected", so the two are reported separately. Styling uses the semantic tokens
 *   in `src/index.css`.
 */

import type { ReactNode } from 'react'
import type { AuxState, AuxKind } from '../../core/trace/step'

export type AuxStatePaneProps = {
  aux: AuxState | undefined
  /** False before any trace is loaded, so "no step" is not confused with "no aux". */
  hasStep: boolean
}

const KIND_LABEL: Record<AuxKind, string> = {
  array: 'array',
  stack: 'stack (top last)',
  queue: 'queue (front first)',
  heap: 'heap array (index = tree slot)',
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
      ) : (
        <>
          <AuxView aux={aux} />
          {aux.output !== undefined && <Output values={aux.output} />}
        </>
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

function AuxView({ aux }: { aux: AuxState }) {
  switch (aux.kind) {
    case 'array':
      return (
        <Block>
          <ChipRow values={aux.values ?? []} />
        </Block>
      )

    case 'stack':
      return (
        <Block>
          <ChipRow values={aux.values ?? []} />
          <Visited visited={aux.visited} />
        </Block>
      )

    case 'queue':
      return (
        <Block>
          <ChipRow values={aux.values ?? []} />
          <Visited visited={aux.visited} />
        </Block>
      )

    case 'heap':
      return (
        <Block>
          <ChipRow
            values={aux.values ?? []}
            activeIndices={aux.indices ?? []}
            showIndex
          />
        </Block>
      )

    case 'visited':
      return (
        <Block>
          <Visited visited={aux.visited} />
        </Block>
      )

    case 'recursion':
      return (
        <Block>
          {(aux.frameIds ?? []).length === 0 ? (
            <p className="text-sm text-muted">empty call stack</p>
          ) : (
            <ol className="flex flex-wrap items-center gap-1 text-sm">
              {(aux.frameIds ?? []).map((id, depth) => (
                <li
                  key={`${depth}-${id}`}
                  className="rounded border border-raised bg-base-deep px-2 py-0.5 font-mono text-xs text-ink"
                >
                  {aux.frameValues?.[depth] ?? id}
                  <span className="ml-1 text-[10px] text-muted">
                    {id} d{aux.frames?.[depth] ?? depth}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <Visited visited={aux.visited} />
        </Block>
      )
  }
}

function Block({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

function ChipRow({
  values,
  activeIndices = [],
  showIndex = false,
}: {
  values: readonly (string | number)[]
  activeIndices?: readonly number[]
  showIndex?: boolean
}) {
  if (values.length === 0) {
    return <p className="text-sm text-muted">empty</p>
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {values.map((value, position) => {
        const isActive = activeIndices.includes(position)
        return (
          <li
            key={`${position}-${String(value)}`}
            className={`rounded border px-2 py-1 font-mono text-sm ${
              isActive
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-raised bg-base-deep text-ink'
            }`}
            aria-current={isActive ? 'true' : undefined}
          >
            {String(value)}
            {showIndex && (
              <span className="ml-1 text-[10px] text-muted">[{position}]</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** The traversal/extract result so far, rendered as a growing value sequence. */
function Output({ values }: { values: readonly (string | number)[] }) {
  return (
    <div className="mt-2 border-t border-line pt-2">
      <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
        output
      </p>
      <ChipRow values={values} />
    </div>
  )
}

function Visited({ visited }: { visited: readonly string[] | undefined }) {
  if (visited === undefined || visited.length === 0) {
    return <p className="text-xs text-muted">visited: none yet</p>
  }
  return (
    <p className="text-xs text-ink-dim">
      visited: <span className="font-mono">{visited.join(' → ')}</span>
    </p>
  )
}
