/**
 * Heap renderer — the dual rendering of the priority queue.
 *
 * WHAT GOES HERE
 *   A pure `(stateAtI, step) -> JSX` component that draws the same array **twice**:
 *   as an indexed array, and as a complete binary tree, with the parent/child index
 *   arithmetic (`i → 2i+1, 2i+2`) marked on both. Sift-up/sift-down swaps are
 *   highlighted simultaneously in the two views.
 *
 * WHY THIS FILE EXISTS
 *   A2 §4.3 calls this the structure's teaching centrepiece: "one model, two honest
 *   renderings". Seeing the same swap in the array and in the tree is what makes
 *   the O(n) build-heap vs O(n log n) n-inserts comparison land.
 *
 * RULES
 *   React owns the SVG; the tree coordinates come from `render/layout/hierarchy`
 *   (D3 computes, React renders — `ADR-2`). No step index, no timer. The array
 *   view is the model; the tree view is a projection of it, never a second copy.
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
