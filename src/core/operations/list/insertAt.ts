/**
 * `insertAt` — linked-list operation generator.
 *
 * WHAT GOES HERE
 *   Insert a value at position k. The generator walks the list one node at a time,
 *   emitting a `Step` for each hop, then performs the splice. This is the
 *   operation that makes the *cost* visible: the trace is O(k) long because the
 *   walk really is O(k).
 *
 * WHY / REQUIREMENTS
 *   One file per operation (A2 Listing 18). Cost shown: O(k) for position k
 *   (`FR4`), which is the contrast against `insertAtHead`'s O(1).
 *
 * CONTRACT
 *   Pure `(structure, request) -> { trace, summary }`. Deterministic, serialisable
 *   steps only (NFR-C2). No React, D3, `render/`, `ui/`, timers or DOM.
 *
 * STATUS
 *   Not implemented. Added after the vertical slice freezes the Step contract.
 */

export {}
