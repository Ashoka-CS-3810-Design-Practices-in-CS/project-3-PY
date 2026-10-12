/**
 * Force layout — graph geometry from `d3-force`.
 *
 * WHAT GOES HERE
 *   `layoutGraph(model)` runs a `d3-force` simulation over a **copy** of the
 *   graph's vertices and edges and returns positions keyed by vertex id.
 *
 * WHY THIS FILE EXISTS
 *   Graph layout is view state and explicitly **not** algorithm input (`A1 §6.3`,
 *   `FR12`). Keeping it here means a layout tweak can never alter a BFS/DFS result,
 *   and the graph renderer never reads a coordinate from the model.
 *
 * DETERMINISM
 *   The simulation is seeded with a fixed circular placement and run a fixed number
 *   of ticks with no random force, and it is never stepped on a timer, so the same
 *   graph always lays out identically. That is what lets the graph renderer be a
 *   pure function of `(model, step)` and keeps the golden-trace guarantee intact
 *   (`A2 §3.7`, `NFR-C2`). We also stop the internal timer immediately: all ticks
 *   happen synchronously here, not on the DOM clock.
 *
 * RULES
 *   `d3-force` mutates its node objects by design, so it runs on a copy and the
 *   result is passed to React as values — never written back into the model and
 *   never applied to the DOM directly (`ADR-2`, A2 `Table 10`).
 */

import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from 'd3-force'
import { graphEdges, type GraphModel } from '../../core/model/graph'
import type { NodeId } from '../../core/trace/step'
import { GRAPH_LAYOUT, type Point } from './scales'

type SimNode = SimulationNodeDatum & { id: NodeId }

/** How many ticks the layout runs. Fixed, so the output cannot drift. */
const TICKS = 300

/**
 * Deterministic positions for every vertex, keyed by id. An empty graph returns
 * `{}`; a single vertex lands in the centre.
 */
export function layoutGraph(model: GraphModel): Record<NodeId, Point> {
  const count = model.vertices.length
  if (count === 0) return {}

  const centreX = GRAPH_LAYOUT.width / 2
  const centreY = GRAPH_LAYOUT.height / 2
  const radius =
    Math.min(GRAPH_LAYOUT.width, GRAPH_LAYOUT.height) / 2 - GRAPH_LAYOUT.padding

  // Seed every vertex on a circle, in model order. This is the "fixed seed": with
  // no random force, the only thing that decides the final picture is the graph.
  const nodes: SimNode[] = model.vertices.map((vertex, index) => {
    const angle = (2 * Math.PI * index) / count
    return {
      id: vertex.id,
      x: centreX + radius * Math.cos(angle),
      y: centreY + radius * Math.sin(angle),
    }
  })
  const byId = new Map<NodeId, SimNode>(nodes.map((node) => [node.id, node]))

  const links = graphEdges(model).map((edge) => ({
    source: byId.get(edge.from) as SimNode,
    target: byId.get(edge.to) as SimNode,
  }))

  const simulation = forceSimulation(nodes)
    .force(
      'link',
      forceLink(links)
        .id((node) => (node as SimNode).id)
        .distance(72)
        .strength(0.7),
    )
    .force('charge', forceManyBody().strength(-240))
    .force('center', forceCenter(centreX, centreY))
    .force('x', forceX(centreX).strength(0.05))
    .force('y', forceY(centreY).strength(0.05))
    .stop()

  for (let tick = 0; tick < TICKS; tick += 1) {
    simulation.tick()
  }

  const positions: Record<NodeId, Point> = {}
  for (const node of nodes) {
    positions[node.id] = {
      x: Math.round(node.x ?? centreX),
      y: Math.round(node.y ?? centreY),
    }
  }
  return positions
}
