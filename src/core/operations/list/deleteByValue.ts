/**
 * `deleteByValue` — linked-list operation generator.
 *
 * WHAT GOES HERE
 *   Delete the first node holding a value. The generator walks forward keeping the
 *   predecessor, emitting a `Step` per comparison, then unlinks the match and
 *   reports whether anything was deleted.
 *
 * WHY / REQUIREMENTS
 *   One file per operation (A2 Listing 18). Cost shown: O(n) unless the
 *   predecessor is already known (A1 §6.3). The interesting teaching moment is
 *   *why* the predecessor is needed — the unlink needs the previous node.
 *
 * CONTRACT
 *   Pure `(structure, request) -> { trace, summary }`. The `unlinked` delta records
 *   the edge removed, so the renderer never has to guess (A2 Listing 17).
 *
 * STATUS
 *   Not implemented. Added after the vertical slice freezes the Step contract.
 */

export {}
