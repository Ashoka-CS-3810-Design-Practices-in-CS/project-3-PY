/**
 * Stack renderer — SVG for the LIFO stack.
 *
 * WHAT GOES HERE
 *   A pure `(stateAtI, step) -> JSX` component drawing the stack as a vertical
 *   container with an explicit `top` marker, pushing/popping one cell at a time.
 *
 * WHY THIS FILE EXISTS
 *   One renderer per structure (A2 Listing 18). The `top` marker is the whole
 *   teaching point: push and pop are only O(1) because they touch that one end,
 *   and the drawing has to show that, not imply it (A2 §4.2).
 *
 * RULES
 *   React owns the SVG; no D3, no DOM writes outside React, no step index, no
 *   timer (`ADR-2`). State must also be labelled/shaped, not colour-only.
 *
 * STATUS
 *   Not implemented. Added after the Step contract is frozen.
 */

export {}
