/**
 * Force layout — graph geometry from `d3-force`.
 *
 * WHAT GOES HERE
 *   Pure helpers that run a `d3-force` simulation over a **copy** of the graph's
 *   vertices/edges and return positions. A fixed seed / fixed initial placement is
 *   required so the same graph always lays out the same way.
 *
 * WHY THIS FILE EXISTS
 *   Graph layout is view state and explicitly **not** algorithm input (`A1 §6.3`,
 *   `FR12`). Keeping it here means a layout tweak can never alter a BFS/DFS result.
 *
 * RULES
 *   `d3-force` mutates its node objects by design, so it is run on a copy and the
 *   result is passed to React as values — never written back into the model and
 *   never applied to the DOM directly (`ADR-2`, A2 `Table 10`).
 *
 * STATUS
 *   Not implemented. Needed by the graph renderer, after the vertical slice.
 */

export {}
