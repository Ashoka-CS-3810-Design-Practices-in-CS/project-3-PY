/**
 * Graph layout — stationary geometry for the graph view.
 *
 * WHAT GOES HERE
 *   `layoutGraph(model)` returns a position for every vertex on a deterministic
 *   ellipse that fits inside the drawing viewport.
 *
 * WHY THIS FILE EXISTS
 *   Graph layout is view state and explicitly **not** algorithm input (`A1 §6.3`,
 *   `FR12`). Keeping it here means a layout tweak can never alter a BFS/DFS result,
 *   and the graph renderer never reads a coordinate from the model.
 *
 * WHY STATIONARY
 *   A force simulation recomputes every vertex whenever an edge is added, so the
 *   picture drifts and — because a simulation has no hard boundary — can push nodes
 *   and edges outside the viewport. The graph is about the traversal, not about the
 *   layout: vertices keep their position for the whole run, and adding an edge only
 *   draws that one edge. Positions depend on the vertex list alone, in model order,
 *   so they are identical before, during and after the edge-by-edge build.
 *
 * DETERMINISM
 *   A fixed ellipse seeded from the vertex order, with no randomness and no clock.
 *   The renderer therefore remains a pure function of `(model, step)` and the
 *   golden-trace guarantee is untouched (`A2 §3.7`, `NFR-C2`).
 *
 * RULES
 *   Return plain coordinates, never mutate the model, never touch the DOM
 *   (`ADR-2`). The padding and ellipse radii guarantee every circle is fully
 *   inside `GRAPH_LAYOUT.width × GRAPH_LAYOUT.height`.
 */

import type { GraphModel } from '../../core/model/graph'
import type { NodeId } from '../../core/trace/step'
import { GRAPH_LAYOUT, type Point } from './scales'

/**
 * Deterministic positions for every vertex, keyed by id. An empty graph returns
 * `{}`; a single vertex lands in the centre.
 */
export function layoutGraph(model: GraphModel): Record<NodeId, Point> {
  const count = model.vertices.length
  if (count === 0) return {}

  const centreX = GRAPH_LAYOUT.width / 2
  const centreY = GRAPH_LAYOUT.height / 2

  if (count === 1) {
    return { [model.vertices[0].id]: { x: centreX, y: centreY } }
  }

  // The padding is measured from the circle edge, so a node's full radius stays
  // inside the viewport even on the extreme top/bottom/left/right points.
  const radiusX =
    GRAPH_LAYOUT.width / 2 - GRAPH_LAYOUT.padding - GRAPH_LAYOUT.nodeRadius
  const radiusY =
    GRAPH_LAYOUT.height / 2 - GRAPH_LAYOUT.padding - GRAPH_LAYOUT.nodeRadius

  const positions: Record<NodeId, Point> = {}
  model.vertices.forEach((vertex, index) => {
    // Start at the top and go clockwise; the order is the model order, so it is
    // stable across every step of the trace.
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / count
    positions[vertex.id] = {
      x: Math.round(centreX + radiusX * Math.cos(angle)),
      y: Math.round(centreY + radiusY * Math.sin(angle)),
    }
  })
  return positions
}
