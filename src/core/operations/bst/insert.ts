/**
 * `insert` — BST operation generator.
 *
 * WHAT GOES HERE
 *   Insert a value by walking from the root: emit a `Step` for every comparison
 *   (`<` go left, `>` go right), then a step for creating the leaf and linking it
 *   to its parent. Duplicate handling is explicit, not silent.
 *
 * WHY / REQUIREMENTS
 *   One file per operation (A2 Listing 18). Cost shown: O(h) — O(log n) balanced,
 *   O(n) worst case (A1 §6.3). The walk length *is* the height, so the degenerate
 *   preset makes the worst case visible next to the average.
 *
 * CONTRACT
 *   Pure `(structure, request) -> { trace, summary }`; new nodes appear as
 *   `created` and the parent link as `linked` (A2 Listing 17). No React, D3,
 *   `render/`, `ui/`, timers or DOM; deterministic (NFR-C2).
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
