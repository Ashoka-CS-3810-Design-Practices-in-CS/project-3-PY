/**
 * Graph — structure model.
 *
 * WHAT GOES HERE
 *   An adjacency list `Map<vertexId, Array<{ to, weight? }>>`, plus vertex
 *   records carrying a value. Layout coordinates are *not* stored here.
 *
 * WHY THIS FILE EXISTS
 *   The graph is a graded structure and the base for BFS and DFS. The adjacency
 *   list gives space O(V+E) and traversal O(V+E); an edge-existence check is
 *   O(deg v) rather than O(1), which is stated explicitly as the trade-off
 *   against an adjacency matrix (A1 §6.3, A2 §4.5).
 *
 *   Neighbour order is **fixed** (e.g. by insertion order) and part of the model,
 *   because BFS/DFS output must be reproducible for golden traces (A2 §3.8).
 *
 * RULES
 *   Pure data + invariants (no self-loops). Vertex positions are view state and
 *   live in `render/layout/` — an algorithm must never read them, or a layout
 *   change could alter a traversal result and break determinism (A1 §6.3,
 *   NFR-C2). No React, D3, `render/`, `ui/` or DOM (ADR-2).
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen (A2 §5.7).
 */

export {}
