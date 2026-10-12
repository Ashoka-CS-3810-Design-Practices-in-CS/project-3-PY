/**
 * The trace contract — the single module that defines what an algorithm emits and
 * what every panel reads (A2 Listing 17, ADR-6, NFR-M3).
 *
 * ==================== FROZEN · v1.1 (additive over v1) ====================
 * v1 was frozen when the first vertical slice (linked-list `insertAtHead`) was
 * working, as A2 §5.7 requires: build one slice, freeze the contract, then add
 * structures. v1.1 adds only OPTIONAL fields, exactly the mechanism ADR-8 sets
 * out for "the concrete shapes for `aux` kinds other than none" and for the
 * heap/BST/graph deltas:
 *
 *   - `StructureDelta.removed`  — a node/entry leaves the structure (BST delete,
 *                                 heap extract). Without it a deleted node would
 *                                 have to linger in `nodes`, which would be a lie.
 *   - `StructureDelta.moved`    — an array-backed entry changes position (heap
 *                                 swap). A swap is neither a link nor a value
 *                                 change, so it gets its own channel rather than
 *                                 being smuggled through `updated`.
 *   - `AuxState.indices`        — the array slots an algorithm is looking at
 *                                 (heap sift path), so the auxiliary panel can
 *                                 mark exactly those cells.
 *   - `AuxState.frameIds`       — the node ids of the live recursion frames, so
 *                                 the recursion panel shows the call PATH and not
 *                                 just its depth.
 *
 * Because every addition is optional and no existing generator emits it, the v1
 * golden trace and the shape-lock test are unchanged: a v1 trace is still a valid
 * v1.1 trace. See `ProjectResources/ADR-8-step-contract-freeze.md` for the
 * decisions and the rationale for each field.
 *
 * The change policy from here:
 *   - ADDITIVE changes (a new optional field, a new `AuxKind`) are cheap: bump the
 *     version note, regenerate the golden traces, done.
 *   - BREAKING changes (rename / remove / retype a field) are a deliberate,
 *     visible event: update every producer and consumer, regenerate every golden
 *     fixture, and add a migration note — in one commit. Never silently.
 *
 * What the freeze guarantees to callers:
 *   - `Step[]` is JSON-serialisable and `structuredClone`-safe, so the same trace
 *     crosses the Worker boundary, becomes a fixture, and is rendered by React
 *     unchanged (ADR-1, NFR-C2).
 *   - Generation is deterministic: no wall-clock, no randomness, fixed neighbour
 *     order. The same input always yields a byte-identical trace.
 *   - `delta` is the change; `highlight` is the emphasis. They are allowed to
 *     disagree (the final step has an empty delta but still highlights a node).
 * =====================================================================
 *
 * Note: A2 Listing 17 writes the delta payloads as `Node[]` / `Edge[]`. They are
 * named `TraceNode` / `TraceEdge` here to avoid shadowing the DOM `Node` type in a
 * codebase that also type-checks UI code against the DOM lib.
 */

/** Stable identifier for a structure node or graph vertex (e.g. `n1`, `n2`). */
export type NodeId = string

/**
 * Reserved prefix for a *field of the structure itself* rather than a node.
 *
 * Node ids never start with `@`, so a pointer edit (`@head`, and later `@tail`,
 * `@root`, `@size`) can never be confused with a node's value changing. Pointer
 * edits travel in `StructureDelta.updated`, whose `from`/`to` are `unknown` for
 * exactly this reason: they may hold a node id or `null`.
 */
export const FIELD_ID_PREFIX = '@'

export function isFieldId(id: NodeId): boolean {
  return id.startsWith(FIELD_ID_PREFIX)
}

/** A node as it appears in a structure delta. */
export type TraceNode = {
  id: NodeId
  value: string | number
}

/**
 * The link kinds the five structures need. `undefined` means "an untyped edge",
 * which is the normal case for graph edges; `index` covers the heap's parent/child
 * slot arithmetic. A closed union so a typo is a compile error, not a silent
 * no-match in a renderer.
 */
export const EDGE_KINDS = ['next', 'left', 'right', 'parent', 'index'] as const

export type EdgeKind = (typeof EDGE_KINDS)[number]

/** An edge as it appears in a structure delta. */
export type TraceEdge = {
  from: NodeId
  to: NodeId
  kind?: EdgeKind
}

export type StructureDelta = {
  created?: TraceNode[] // ids and values of new nodes
  linked?: TraceEdge[] // parent/child, next, or heap index edits
  unlinked?: TraceEdge[]
  updated?: { id: NodeId; from: unknown; to: unknown }[] // node values and @fields
  /**
   * ADDITIVE (v1.1) — nodes/entries that leave the structure.
   *
   * `unlinked` only says an edge was cut; it cannot say the node itself is gone.
   * A BST `delete` and a heap `extract` both remove a node outright, and keeping
   * it in the model would draw a node the algorithm has forgotten. Removing a
   * node also clears every pointer that still referenced it, so a model can never
   * hold a dangling `left`/`right` id after replay.
   */
  removed?: NodeId[]
  /**
   * ADDITIVE (v1.1) — an existing array-backed entry changes position.
   *
   * The heap has no pointers: `entries[i]` *is* the node at tree slot `i`, so a
   * sift swap is a positional move, not a link and not a value change. `to` is the
   * destination INDEX, and a swap is expressed as one entry per participating
   * node, e.g. `moved: [{ id: 'h4', to: 0 }, { id: 'h1', to: 3 }]`. A reducer
   * applies the moves in order by looking each id up in the current array.
   */
  moved?: { id: NodeId; to: number }[]
}

/**
 * The auxiliary panel variants. `aux.kind` selects which panel component renders
 * (FR10), so this list is the union's single source of truth.
 *
 * A const tuple with `as const` is used instead of a TS `enum` because
 * `erasableSyntaxOnly` is on and the value must stay JSON-serialisable.
 */
export const AUX_KINDS = [
  'array',
  'stack',
  'queue',
  'heap',
  'visited',
  'recursion',
] as const

export type AuxKind = (typeof AUX_KINDS)[number]

export type AuxState = {
  kind: AuxKind
  values?: (string | number)[] // structure values: stack/queue frontier, heap array
  visited?: NodeId[] // discovered/visited set, in discovery order
  frames?: number[] // recursion depth per frame
  comparisons?: number // running model charge
  /**
   * ADDITIVE (v1.1) — the array slots the algorithm is currently looking at.
   *
   * The heap's whole teaching point is that an array slot and a tree position are
   * the same index. The generator names the slots under consideration (the entry
   * being sifted and the parent/child it is compared with) so the auxiliary panel
   * can mark them instead of re-deriving the sift path from the model.
   */
  indices?: number[]
  /**
   * ADDITIVE (v1.1) — node ids of the live recursion frames, outermost first.
   *
   * `frames` gives the DEPTH of each frame (it stays `number[]` for the frozen
   * contract), but a depth alone cannot be drawn. `frameIds` gives the call PATH,
   * which is the state a recursion panel actually needs and the clearest form of
   * "the call stack is the route from the root to the current node".
   */
  frameIds?: NodeId[]
}

export type Step = {
  index: number // position in the trace, 0-based
  operation: string // matches OperationMeta.id: "insertAtHead" | "inorder" | ...
  codeLine: number // line of the operation's pseudocode executing
  narration: string // one plain-English sentence for this step
  highlight: { nodes: NodeId[]; active?: NodeId; edges: TraceEdge[] }
  delta: StructureDelta // created / linked / unlinked / updated
  /**
   * The accumulated auxiliary ledger, when the operation has one.
   *
   * OPTIONAL BY DESIGN: a linked-list insert has no auxiliary container — its
   * auxiliary space is O(1) and empty. Emitting a fake `array` of the list's own
   * values would double the structure view and, worse, claim the algorithm uses a
   * container it does not. Absence is the honest encoding, and the pane says so.
   */
  aux?: AuxState
}

/**
 * The second half of what a generator returns (A2 interfaces table): the step
 * count, the model charge observed, and a one-line conclusion.
 *
 * It lives here, with the rest of the contract, so the UI can display a summary
 * without importing the algorithm layer — the algorithm layer is free to be
 * replaced while the trace contract stays put (NFR-M2).
 */
export type GenerateSummary = {
  steps: number
  comparisons: number
  conclusion: string
}

/**
 * Narrows an untrusted value (e.g. a structured-clone message from the worker or
 * a loaded fixture) to an `AuxKind`.
 */
export function isAuxKind(value: unknown): value is AuxKind {
  return (
    typeof value === 'string' &&
    (AUX_KINDS as readonly string[]).includes(value)
  )
}

/** Narrows an untrusted value to a known `EdgeKind`. */
export function isEdgeKind(value: unknown): value is EdgeKind {
  return (
    typeof value === 'string' &&
    (EDGE_KINDS as readonly string[]).includes(value)
  )
}
