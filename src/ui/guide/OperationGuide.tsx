/**
 * OperationGuide — guided entry for the selected operation.
 *
 * WHAT IT DOES
 *   Renders one field per input the operation's `OperationMeta.inputs` names and
 *   reports validation results. The algorithm is only reachable through the
 *   validation report, so a malformed token never becomes part of a structure
 *   (`ADR-7`, FR6). Which fields appear, and what they are called, comes from the
 *   catalogue — so the form and the pipeline cannot disagree about an operation's
 *   inputs.
 *
 * WHY THIS FILE EXISTS
 *   It is the single place where user text becomes typed values. The report lists
 *   every rejected token with a reason, rather than stopping at the first, so the
 *   learner can fix the whole input in one pass. A preset fills the same fields a
 *   user would type into, so presets take the identical validation path (FR5).
 *
 * RULES
 *   Only reports edits — the parent owns the text. No step index, no timer, no
 *   algorithm. Styling uses the semantic tokens in `src/index.css`.
 */

import type { ValidationReport } from '../../app/validate'
import type { OperationInput, OperationMeta } from '../../data/catalogue'
import type { PresetDataset } from '../../data/presets'
import { ValidationFeedback } from './ValidationFeedback'

export type OperationGuideProps = {
  structureId: string
  operation: OperationMeta | undefined
  valuesText: string
  valueText: string
  edgesText: string
  sourceText: string
  directed: boolean
  presets: readonly PresetDataset[]
  report: ValidationReport | null
  onValuesChange(value: string): void
  onValueChange(value: string): void
  onEdgesChange(value: string): void
  onSourceChange(value: string): void
  onDirectedChange(value: boolean): void
  onPresetSelect(id: string): void
  onVisualise(): void
}

const FIELD =
  'w-full rounded-md border border-raised bg-base-deep px-3 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent'

/** Field label per structure; the list wording is asserted by the app test. */
const VALUES_LABEL: Record<string, string> = {
  list: 'Initial values (list order)',
  bst: 'Initial keys (insertion order)',
  heap: 'Heap array (array order)',
}

const VALUES_PLACEHOLDER: Record<string, string> = {
  list: '50, 30, 70',
  bst: '9, 5, 13, 3, 7',
  heap: '42, 7, 19, 3, 88',
}

function valueLabel(
  structureId: string,
  operationId: string | undefined,
): string {
  if (structureId === 'bst') return 'Key'
  if (operationId === 'insertAtHead') return 'Value to insert at the head'
  return 'Value to insert'
}

/** One sentence of guidance under the button, per structure. */
function hint(structureId: string, inputs: readonly OperationInput[]): string {
  if (structureId === 'heap') {
    return 'Each value is appended and sifted up in turn; build-heap instead heapifies the raw array in O(n).'
  }
  if (inputs.includes('edges')) {
    return 'One edge per line: A-B or A-B:weight. The load is atomic — a bad line blocks it.'
  }
  if (structureId === 'bst') {
    return 'Sorted input degenerates the tree to a chain — that is the lesson.'
  }
  return 'Leave the list empty to insert into an empty list.'
}

export function OperationGuide({
  structureId,
  operation,
  valuesText,
  valueText,
  edgesText,
  sourceText,
  directed,
  presets,
  report,
  onValuesChange,
  onValueChange,
  onEdgesChange,
  onSourceChange,
  onDirectedChange,
  onPresetSelect,
  onVisualise,
}: OperationGuideProps) {
  const inputs = operation?.inputs ?? []
  const heading = operation
    ? `Operation · ${operation.label}`
    : 'Operation · choose one'
  const invalid = report !== null && !report.ok

  return (
    <form
      className="rounded-xl border border-line bg-surface p-3"
      onSubmit={(event) => {
        event.preventDefault()
        onVisualise()
      }}
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
          {heading}
        </h2>
        {presets.length > 0 && (
          <label className="flex items-center gap-1.5 text-xs text-ink-dim">
            Preset
            <select
              className="rounded-md border border-raised bg-base-deep px-2 py-1 text-xs text-ink outline-none focus:border-accent"
              value=""
              onChange={(event) => {
                if (event.target.value !== '')
                  onPresetSelect(event.target.value)
              }}
            >
              <option value="">Choose…</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {inputs.includes('values') && (
          <label className="flex flex-col gap-1 text-xs text-ink-dim">
            {VALUES_LABEL[structureId] ?? 'Values'}
            <input
              className={FIELD}
              value={valuesText}
              onChange={(event) => onValuesChange(event.target.value)}
              placeholder={VALUES_PLACEHOLDER[structureId] ?? '1, 2, 3'}
              aria-invalid={invalid}
            />
          </label>
        )}

        {inputs.includes('value') && (
          <label className="flex flex-col gap-1 text-xs text-ink-dim">
            {valueLabel(structureId, operation?.id)}
            <input
              className={FIELD}
              value={valueText}
              onChange={(event) => onValueChange(event.target.value)}
              placeholder="45"
              aria-invalid={invalid}
            />
          </label>
        )}

        {inputs.includes('source') && (
          <label className="flex flex-col gap-1 text-xs text-ink-dim">
            Source vertex
            <input
              className={FIELD}
              value={sourceText}
              onChange={(event) => onSourceChange(event.target.value)}
              placeholder="A"
              aria-invalid={invalid}
            />
          </label>
        )}

        {inputs.includes('edges') && (
          <label className="flex flex-col gap-1 text-xs text-ink-dim sm:col-span-2">
            Edge list (one per line)
            <textarea
              className={`${FIELD} min-h-24 resize-y`}
              value={edgesText}
              onChange={(event) => onEdgesChange(event.target.value)}
              placeholder={'A-B\nB-C\nA-C'}
              aria-invalid={invalid}
            />
          </label>
        )}
      </div>

      {structureId === 'graph' && (
        <label className="mt-2 flex items-center gap-2 text-xs text-ink-dim">
          <input
            type="checkbox"
            checked={directed}
            onChange={(event) => onDirectedChange(event.target.checked)}
            className="accent-accent"
          />
          Directed graph
        </label>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md border border-accent/60 bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent hover:bg-accent/30"
        >
          Visualise
        </button>
        <span className="text-xs text-muted">{hint(structureId, inputs)}</span>
      </div>

      <ValidationFeedback tokens={report?.tokens ?? []} error={report?.error} />
    </form>
  )
}
