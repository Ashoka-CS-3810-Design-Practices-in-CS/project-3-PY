/**
 * Hierarchy layout — tree geometry from `d3-hierarchy`.
 *
 * WHAT GOES HERE
 *   Pure functions that take a tree (nodes + `left`/`right`) and return vertex
 *   positions: `d3.tree()` / `d3.hierarchy()` output mapped into the SVG viewport,
 *   with sensible spacing for the height and width of the tree.
 *
 * WHY THIS FILE EXISTS
 *   Geometry belongs in `render/layout/`, never in `core/model/` — vertex positions
 *   are **view state**, and an algorithm that read them would change behaviour when
 *   the picture changed, breaking determinism (`A1 §6.3`, `NFR-C2`). This is also
 *   the heap's tree projection.
 *
 * RULES
 *   D3 as a **computation** library only: import `d3-hierarchy`, return plain data,
 *   never touch the DOM (`ADR-2`). Deterministic output for a given tree.
 *
 * STATUS
 *   Not implemented. Needed by the heap/tree renderers, after the vertical slice.
 */

export {}
