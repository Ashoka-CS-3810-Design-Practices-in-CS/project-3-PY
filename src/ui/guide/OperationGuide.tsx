/**
 * OperationGuide — guided entry for the selected operation.
 *
 * WHAT IT DOES
 *   Collects the initial values and the value to insert, and reports validation
 *   results. The algorithm is only reachable through the validation report, so a
 *   malformed token never becomes part of a structure (`ADR-7`, FR6).
 *
 * WHY THIS FILE EXISTS
 *   It is the single place where user text becomes typed values. The report lists
 *   every rejected token with a reason, rather than stopping at the first, so the
 *   learner can fix the whole input in one pass.
 *
 * RULES
 *   Owns only form state (the raw text). No step index, no timer, no algorithm.
 *   Styling uses the semantic tokens in `src/index.css`.
 */

import type { ValidationReport } from '../../app/validate'

export type OperationGuideProps = {
  valuesText: string
  insertText: string
  report: ValidationReport | null
  onValuesChange(value: string): void
  onInsertChange(value: string): void
  onVisualise(): void
}

const FIELD =
  'w-full rounded-md border border-raised bg-base-deep px-3 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent'

export function OperationGuide({
  valuesText,
  insertText,
  report,
  onValuesChange,
  onInsertChange,
  onVisualise,
}: OperationGuideProps) {
  const rejected =
    report?.tokens.filter((token) => token.status === 'rejected') ?? []

  return (
    <form
      className="rounded-xl border border-line bg-surface p-3"
      onSubmit={(event) => {
        event.preventDefault()
        onVisualise()
      }}
    >
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
        Operation · Linked list / Insert at head
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-ink-dim">
          Initial values (list order)
          <input
            className={FIELD}
            value={valuesText}
            onChange={(event) => onValuesChange(event.target.value)}
            placeholder="50, 30, 70"
            aria-invalid={report !== null && !report.ok}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-dim">
          Value to insert at the head
          <input
            className={FIELD}
            value={insertText}
            onChange={(event) => onInsertChange(event.target.value)}
            placeholder="45"
            aria-invalid={report !== null && !report.ok}
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md border border-accent/60 bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent hover:bg-accent/30"
        >
          Visualise
        </button>
        <span className="text-xs text-muted">
          Leave the list empty to insert into an empty list.
        </span>
      </div>

      {rejected.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-bad" aria-live="polite">
          {rejected.map((token, position) => (
            <li key={`${position}-${token.token}`}>
              <span className="font-mono">“{token.token}”</span> —{' '}
              {token.reason}
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
