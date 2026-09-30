/**
 * `postorder` — tree traversal generator (left, right, visit).
 *
 * WHAT GOES HERE
 *   The depth-first traversal in which the node is visited *after* both children.
 *   Emit the descents, the frame push/pops, and the visits, so the deferred visit
 *   is visible rather than implied.
 *
 * WHY / REQUIREMENTS
 *   One file per operation (A2 Listing 18). Cost shown: O(n) time, O(h) recursion
 *   space (A1 §6.3). Postorder is the order used to free a tree bottom-up, so it
 *   also explains *why* the deferred visit exists (A2 §3.3).
 *
 * CONTRACT
 *   Pure `(structure, request) -> { trace, summary }`; `aux.kind = "recursion"`.
 *   Deterministic and serialisable (NFR-C2). No React, D3, `render/`, `ui/`,
 *   timers or DOM.
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
