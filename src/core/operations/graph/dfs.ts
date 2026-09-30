/**
 * `dfs` — graph depth-first search generator.
 *
 * WHAT GOES HERE
 *   Depth-first search from a start vertex using an explicit stack (or recursion
 *   frames) plus a visited set. Emit a step per push/pop, per edge examination and
 *   per visit, so the frontier is visible at every moment.
 *
 * WHY / REQUIREMENTS
 *   One file per operation (A2 Listing 18). Cost shown: O(V+E) (A2 §3.6). Explicit
 *   frames rather than native recursion keep the state in the trace, so step-back
 *   shows the exact frontier instead of replaying history (`ADR-1`). Neighbour order
 *   is fixed for reproducibility (A2 §3.8).
 *
 * CONTRACT
 *   Pure `(structure, request) -> { trace, summary }`; `aux.kind` is `"stack"` (or
 *   `"recursion"` when the recursive form is used). Deterministic, serialisable
 *   (NFR-C2). No React, D3, `render/`, `ui/`, timers or DOM.
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
