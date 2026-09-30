/**
 * Scales — coordinate mapping with `d3-scale`.
 *
 * WHAT GOES HERE
 *   The geometry the renderers share. For this slice: mapping list indices onto
 *   evenly spaced x positions, plus the layout constants (radius, rows, margins).
 *
 * WHY THIS FILE EXISTS
 *   Centralising coordinate mapping keeps every renderer using the same
 *   convention, so the same index lands in the same place in the list, the stack,
 *   the heap's array view and the queue panel. Geometry lives in `render/` and
 *   never in `core/`, because positions are view state (A1 §6.3, NFR-C2).
 *
 * RULES
 *   Pure functions returning plain data; `d3-scale` only, never the DOM (ADR-2).
 *   No algorithm knowledge and no step index.
 */

import { scaleLinear } from 'd3-scale'
import type { NodeId } from '../../core/trace/step'

export type Point = { x: number; y: number }

export const LIST_LAYOUT = {
  width: 760,
  height: 220,
  rowY: 140,
  floatY: 46,
  margin: 64,
  nodeRadius: 26,
} as const

/** Evenly spaces `ids` across the drawing width at row `y`. */
export function layoutRow(
  ids: readonly NodeId[],
  y: number,
): Record<NodeId, Point> {
  const positions: Record<NodeId, Point> = {}
  if (ids.length === 0) return positions

  if (ids.length === 1) {
    positions[ids[0]] = { x: LIST_LAYOUT.width / 2, y }
    return positions
  }

  const x = scaleLinear()
    .domain([0, ids.length - 1])
    .range([LIST_LAYOUT.margin, LIST_LAYOUT.width - LIST_LAYOUT.margin])

  ids.forEach((id, index) => {
    positions[id] = { x: Math.round(x(index)), y }
  })
  return positions
}
