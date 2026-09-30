/**
 * Run an operation — the five-stage request pipeline, in one place.
 *
 * WHAT IT DOES
 *   `parse → validate → build → execute → hand the result to the controller`.
 *   It is the only module that knows the whole chain for the list slice.
 *
 * WHY THIS FILE EXISTS
 *   The pipeline is core application logic, so it belongs in `app/` — not in the
 *   entry file and not in `ui/`. Keeping it here is what lets `App.tsx` stay a
 *   composition root that only wires components, and keeps the "presentation must
 *   not import the algorithm directly" rule (A2 Table 5) intact.
 *
 * HOW IT IS SHARED
 *   Returns a discriminated `RunOutcome`: either a validation report and the
 *   `LoadInput` the controller wants, or just the report. The caller never sees an
 *   exception for bad input.
 *
 * RULES
 *   No React, D3 or DOM; no timer. Deterministic for the same text (NFR-C2).
 */

import { buildList } from '../core/model/linkedList'
import { insertAtHead } from '../core/operations/list/insertAtHead'
import type { LoadInput } from './controller'
import {
  validateValue,
  validateValues,
  type ValidationReport,
} from './validate'

export type RunOutcome =
  | { ok: true; report: ValidationReport; input: LoadInput }
  | { ok: false; report: ValidationReport }

/** The catalogue ids this slice can run. */
export const LIST_STRUCTURE_ID = 'list'
export const INSERT_AT_HEAD_OPERATION_ID = 'insertAtHead'

export function runInsertAtHead(
  valuesText: string,
  insertText: string,
): RunOutcome {
  const valuesReport = validateValues(valuesText)
  const insertReport = validateValue(insertText)

  const report: ValidationReport = {
    ok: valuesReport.ok && insertReport.ok,
    tokens: [...valuesReport.tokens, ...insertReport.tokens],
    accepted: [...valuesReport.accepted, ...insertReport.accepted],
  }
  if (!report.ok) return { ok: false, report }

  const initial = buildList(valuesReport.accepted)
  const result = insertAtHead(initial, { value: insertReport.accepted[0] })

  return {
    ok: true,
    report,
    input: {
      initial,
      steps: result.trace,
      summary: result.summary,
      structureId: LIST_STRUCTURE_ID,
      operationId: INSERT_AT_HEAD_OPERATION_ID,
    },
  }
}
