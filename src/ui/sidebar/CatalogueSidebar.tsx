/**
 * CatalogueSidebar — navigation over the structure catalogue.
 *
 * WHAT IT DOES
 *   Lists the structures and their operations; both are selectable, and the current
 *   structure and operation are marked. Selecting a structure shows its first
 *   operation by default.
 *
 * WHY THIS FILE EXISTS
 *   The catalogue is the entry point for the whole app, and it is static versioned
 *   data — the sidebar reads it and never fetches anything (NFR-Se1). It is also
 *   where a new structure appears once its catalogue record exists, and where a new
 *   operation appears once its `OperationMeta` is authored.
 *
 * RULES
 *   No algorithm state, no step index, no timer. It only reports selections upward.
 *   Styling uses the semantic tokens in `src/index.css`.
 */

import { getOperationMeta } from '../../app/catalogue'
import type { CatalogueEntry } from '../../data/catalogue'

export type CatalogueSidebarProps = {
  entries: readonly CatalogueEntry[]
  selectedId: string | null
  selectedOperationId: string | null
  onSelect(id: string): void
  onSelectOperation(id: string): void
}

export function CatalogueSidebar({
  entries,
  selectedId,
  selectedOperationId,
  onSelect,
  onSelectOperation,
}: CatalogueSidebarProps) {
  return (
    <nav aria-label="Structures">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
        Structures
      </h2>
      <ul className="space-y-2">
        {entries.map((entry) => {
          const isSelected = entry.id === selectedId
          return (
            <li key={entry.id}>
              <button
                type="button"
                aria-current={isSelected ? 'true' : undefined}
                onClick={() => onSelect(entry.id)}
                className={`w-full rounded-md border px-2 py-1.5 text-left text-sm ${
                  isSelected
                    ? 'border-accent/60 bg-accent/15 text-accent'
                    : 'border-line bg-base-deep/60 text-ink-dim hover:bg-raised'
                }`}
              >
                {entry.label}
              </button>
              <ul className="mt-1 ml-2 space-y-0.5 text-xs">
                {entry.operations.map((operationId) => {
                  const isCurrent = operationId === selectedOperationId
                  return (
                    <li key={operationId}>
                      <button
                        type="button"
                        aria-current={isCurrent ? 'true' : undefined}
                        onClick={() => {
                          onSelect(entry.id)
                          onSelectOperation(operationId)
                        }}
                        className={`w-full rounded px-1.5 py-1 text-left ${
                          isCurrent
                            ? 'bg-accent/15 text-accent'
                            : 'text-muted hover:bg-raised hover:text-ink-dim'
                        }`}
                      >
                        {getOperationMeta(operationId)?.label ?? operationId}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
