/**
 * Priority queue (binary min-heap) — structure model.
 *
 * WHAT GOES HERE
 *   A binary min-heap stored in a single array with implicit parent/child indices
 *   — there are no node objects and no pointers, so *the array is the tree*.
 *   Operations: `peekMin`, `insert` (sift-up), `extractMin` (sift-down) and
 *   `buildHeap`.
 *
 * WHY THIS FILE EXISTS
 *   The priority queue is a first-class graded structure (ADR-5), and it is the
 *   one model with "one model, two honest renderings": the same array is drawn
 *   both as an indexed array and as a complete binary tree, so the O(n)
 *   build-heap and the O(n log n) of n successive inserts can be compared on one
 *   input (A2 §4.3).
 *
 * RULES
 *   Pure data + invariants (the min-heap property at every parent/child index is
 *   asserted at every step). No React, D3, `render/`, `ui/` or DOM (ADR-2).
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen (A2 §5.7).
 */

export {}
