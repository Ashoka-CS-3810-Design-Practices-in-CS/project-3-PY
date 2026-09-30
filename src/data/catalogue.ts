/**
 * Catalogue data — the static, versioned content of the application.
 *
 * WHAT GOES HERE
 *   The `OperationMeta` records (A2 Listing 16), the one authored pseudocode
 *   listing per operation, and the `CatalogueEntry` records that describe the
 *   structures.
 *
 * WHY THIS FILE EXISTS
 *   Complexity is **data, not prose scattered through the interface**. One record
 *   supplies the menu label, the guide text, the `pseudocodeId` (the link to the
 *   single authored listing) and the complexity card, so a bound cannot attach
 *   itself to the wrong operation and a missing bound is a visible content gap
 *   (`Listing 16`, `FR11`). It is also one of the three edits needed to add an
 *   operation (A2 §5.7).
 *
 * HOW IT IS SHARED
 *   `app/catalogue.ts` reads these records and is the only thing the UI imports,
 *   so "what operations exist" has a single source.
 *
 * RULES
 *   Static and typed; no fetching, no React, no D3, no DOM (`NFR-Se1`).
 */

/** A2 Listing 16. */
export type OperationMeta = {
  id: string
  label: string
  pseudocodeId: string
  best: string
  average: string
  worst: string
  space: string
  assumptions: string[]
  notes?: string
}

/** One authored listing; `lines[codeLine - 1]` is the line a `Step` highlights. */
export type PseudocodeListing = {
  id: string
  lines: string[]
}

export type CatalogueEntry = {
  id: string
  label: string
  description: string
  operations: string[]
  rules: string[]
}

/** The single authored source for each operation's pseudocode (`FR9`). */
export const PSEUDOCODE_LISTINGS: Record<string, PseudocodeListing> = {
  insertAtHead: {
    id: 'insertAtHead',
    lines: [
      'function insertAtHead(head, value):',
      '    node ← new Node(value)',
      '    node.next ← head',
      '    head ← node',
      '    return head',
    ],
  },
}

export const OPERATION_META: Record<string, OperationMeta> = {
  insertAtHead: {
    id: 'insertAtHead',
    label: 'Insert at head',
    pseudocodeId: 'insertAtHead',
    best: 'O(1)',
    average: 'O(1)',
    worst: 'O(1)',
    space: 'O(1)',
    assumptions: [
      'Only the head pointer changes; the existing list is never walked.',
    ],
  },
}

export const CATALOGUE: CatalogueEntry[] = [
  {
    id: 'list',
    label: 'Linked list',
    description:
      'A sequence of nodes joined by next pointers, reached through a single head reference.',
    operations: ['insertAtHead'],
    rules: ['Values are numbers or short strings.'],
  },
]
