/**
 * `delete` — BST operation generator.
 *
 * WHAT GOES HERE
 *   Find the node, then apply one of the three standard cases, each shown
 *   separately: (1) leaf — unlink; (2) one child — splice the child in; (3) two
 *   children — replace the value with the in-order successor (or predecessor) and
 *   delete that node from the subtree.
 *
 * WHY / REQUIREMENTS
 *   One file per operation (A2 Listing 18). Cost shown: O(h) (A1 §6.3). Decomposing
 *   the three cases into distinct steps is the whole point: the two-children case
 *   is the one learners get wrong, so the successor search is its own sub-trace.
 *
 * CONTRACT
 *   Pure `(structure, request) -> { trace, summary }`; edits arrive as
 *   `unlinked`/`linked`/`updated` deltas (A2 Listing 17). No React, D3, `render/`,
 *   `ui/`, timers or DOM.
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
