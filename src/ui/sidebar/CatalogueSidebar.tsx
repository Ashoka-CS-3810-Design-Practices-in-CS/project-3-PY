/**
 * CatalogueSidebar — navigation over the structure catalogue.
 *
 * WHAT IT DOES
 *   Lists the structures and their operations, marking the one that is loaded.
 *
 * WHY THIS FILE EXISTS
 *   The catalogue is the entry point for the whole app, and it is static versioned
 *   data — the sidebar reads it and never fetches anything (NFR-Se1). It is also
 *   where a new structure appears once its catalogue record exists.
 *
 * RULES
 *   No algorithm state, no step index, no timer. Styling uses the semantic tokens
 *   in `src/index.css`.
 */

import { getOperationMeta } from '../../app/catalogue'
import type { CatalogueEntry } from '../../data/catalogue'

export type CatalogueSidebarProps = {
  entries: readonly CatalogueEntry[]
  selectedId: string | null
  onSelect(id: string): void
}

export function CatalogueSidebar({
  entries,
  selectedId,
  onSelect,
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
              <ul className="mt-1 ml-2 space-y-0.5 text-xs text-muted">
                {entry.operations.map((operationId) => (
                  <li key={operationId}>
                    · {getOperationMeta(operationId)?.label ?? operationId}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
