/**
 * `extractMin` — binary min-heap operation generator (sift-down).
 *
 * WHAT GOES HERE
 *   Read the root, move the last array element to the root, then sift down: at each
 *   index compare with both children (`2i+1`, `2i+2`) and swap with the smaller
 *   while the heap property is violated. Emit a step per comparison and swap.
 *
 * WHY / REQUIREMENTS
 *   One file per operation (A2 Listing 18). Cost shown: O(log n) (A2 §4.3). The
 *   *both children* comparison is where learners usually make a mistake, so the
 *   trace highlights the sibling that is **not** chosen too.
 *
 * CONTRACT
 *   Pure `(structure, request) -> { trace, summary }`; deterministic and
 *   JSON-serialisable (NFR-C2). No React, D3, `render/`, `ui/`, timers or DOM.
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
