/**
 * `levelOrder` — breadth-first traversal generator.
 *
 * WHAT GOES HERE
 *   Visit the tree level by level using a **FIFO queue** as the frontier: enqueue
 *   the root, then repeatedly dequeue a node, visit it, and enqueue its children.
 *   Emit a step per enqueue, dequeue and visit.
 *
 * WHY / REQUIREMENTS
 *   One file per operation (A2 Listing 18). Cost shown: O(n) time, O(w) space where
 *   w is the widest level (A1 §6.3). This is where the FIFO queue earns its keep as
 *   a *supporting* structure (ADR-5): `aux.kind = "queue"` renders the live
 *   frontier, and the same queue is the frontier of graph BFS (A2 §3.4).
 *
 * CONTRACT
 *   Pure `(structure, request) -> { trace, summary }`; deterministic neighbour /
 *   child order is fixed left-then-right (NFR-C2). No React, D3, `render/`, `ui/`,
 *   timers or DOM.
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
