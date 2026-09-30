/**
 * Binary search tree — structure model.
 *
 * WHAT GOES HERE
 *   Recursive node records `{ id, value, left, right }`. An optional `parent`
 *   reference is used only by algorithms that need it (e.g. `minMax` walks, node
 *   deletion) and never by the renderer.
 *
 * WHY THIS FILE EXISTS
 *   The BST is a graded structure and the base for all four traversals. Keeping
 *   `parent` out of the renderer is deliberate: the visual tree is derived from
 *   `left`/`right` only, so a stale parent pointer can never affect the picture.
 *   Search / insert / delete are O(h) — O(log n) balanced, O(n) worst case — and
 *   delete decomposes into its three standard cases, each shown separately.
 *
 * RULES
 *   Pure data + invariants (BST ordering and acyclic parent links are asserted at
 *   every step). No React, D3, `render/`, `ui/` or DOM (ADR-2, NFR-M2).
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen (A2 §5.7).
 */

export {}
