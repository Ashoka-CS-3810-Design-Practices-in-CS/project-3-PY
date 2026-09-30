/**
 * Graph renderer — SVG for the graph.
 *
 * WHAT GOES HERE
 *   A pure `(stateAtI, step) -> JSX` component drawing vertices and edges, with
 *   the four traversal states (undiscovered / frontier / current / visited)
 *   distinguished by colour **and** label/shape. Coordinates come from
 *   `render/layout/force.ts`.
 *
 * WHY THIS FILE EXISTS
 *   One renderer per structure (A2 Listing 18); the surface for BFS and DFS. The
 *   frontier is the thing a textbook figure cannot show, so the renderer must
 *   expose it directly (FR10, FR12).
 *
 * RULES
 *   Layout coordinates are view state, never algorithm input (A1 §6.3). `d3-force`
 *   mutates its input, so it runs on a **copy** and the result is handed to React
 *   as values (`ADR-2`). No step index, no timer.
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
