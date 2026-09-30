/**
 * Tree renderer — SVG for the binary search tree.
 *
 * WHAT GOES HERE
 *   A pure `(stateAtI, step) -> JSX` component drawing nodes and parent/child
 *   edges, with the current path and visited nodes highlighted. Geometry comes
 *   from `render/layout/hierarchy.ts`.
 *
 * WHY THIS FILE EXISTS
 *   One renderer per structure (A2 Listing 18), and the shared surface for the BST
 *   operations and all four traversals. Because the same tree is traversed four
 *   ways, the renderer must make the *visit* distinguishable from the *walk* — a
 *   traversal is otherwise invisible (FR8, FR9).
 *
 * RULES
 *   React owns the SVG; positions are view state, computed by the layout module and
 *   never written back into the model (A1 §6.3, `ADR-2`). A node's `parent` pointer
 *   is not used for drawing. No step index, no timer; states carry labels/shapes.
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
