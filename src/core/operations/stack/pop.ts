/**
 * `pop` — stack operation generator.
 *
 * WHAT GOES HERE
 *   Pop the top value: emit a step for reading it, a step for unlinking/decrementing
 *   `top`, and a clearly-visible *empty* step when the stack is empty (pop is
 *   total — it reports failure rather than throwing).
 *
 * WHY / REQUIREMENTS
 *   One file per operation (A2 Listing 18). Cost shown: O(1) (A2 §4.2). The empty
 *   case matters: validation and the guard are part of the teaching trace, not an
 *   error path that escapes the model (`ADR-7`).
 *
 * CONTRACT
 *   Pure `(structure, request) -> { trace, summary }`; deterministic and
 *   serialisable (NFR-C2). No React, D3, `render/`, `ui/`, timers or DOM.
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
