/**
 * PseudocodePane — pane 2 of 3: the highlightable listing.
 *
 * WHAT IT DOES
 *   Renders the operation's one authored listing and highlights the line named by
 *   the current step's `codeLine`.
 *
 * WHY THIS FILE EXISTS
 *   The highlight must be a total function of `step.codeLine` (`FR3`, `FR9`), and
 *   the line the learner sees must be the same line the complexity bound belongs
 *   to. Both come from one `OperationMeta` record via the catalogue, so they cannot
 *   drift.
 *
 * RULES
 *   No algorithm state, no timer. If there is no listing, it says so rather than
 *   showing an empty box. Styling uses the semantic tokens in `src/index.css`.
 */

export type PseudocodePaneProps = {
  lines: readonly string[]
  /** 1-based; 0 means "no step selected". */
  activeLine: number
}

export function PseudocodePane({ lines, activeLine }: PseudocodePaneProps) {
  return (
    <section
      aria-label="Pseudocode"
      className="rounded-xl border border-line bg-surface p-3"
    >
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
        Pseudocode
      </h2>
      {lines.length === 0 ? (
        <p className="text-sm text-muted">No listing for this operation.</p>
      ) : (
        <ol className="font-mono text-sm leading-6">
          {lines.map((line, position) => {
            const lineNumber = position + 1
            const isActive = lineNumber === activeLine
            return (
              <li
                key={lineNumber}
                aria-current={isActive ? 'step' : undefined}
                className={
                  isActive ? 'rounded bg-warn/15 text-warn' : 'text-ink-dim'
                }
              >
                <span className="inline-block w-7 pr-2 text-right text-subtle select-none">
                  {lineNumber}
                </span>
                <span className="whitespace-pre">{line}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
