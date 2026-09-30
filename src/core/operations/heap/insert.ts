/**
 * `insert` — binary min-heap operation generator (sift-up).
 *
 * WHAT GOES HERE
 *   Append the new value at the next free array slot, then sift up: compare with
 *   the parent at `floor((i-1)/2)` and swap while the heap property is violated.
 *   Each comparison and each swap is its own `Step`.
 *
 * WHY / REQUIREMENTS
 *   One file per operation (A2 Listing 18). Cost shown: O(log n) (A2 §4.3). The
 *   array slot and the tree position are the *same* index, which is the teaching
 *   point of the dual rendering.
 *
 * CONTRACT
 *   Pure `(structure, request) -> { trace, summary }`; the swaps arrive as
 *   `updated`/`linked` deltas (A2 Listing 17). No React, D3, `render/`, `ui/`,
 *   timers or DOM; deterministic (NFR-C2).
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
