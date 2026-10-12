/**
 * Tree renderer — SVG for the binary search tree.
 *
 * WHAT IT DOES
 *   A pure `(stateAtI, step) -> JSX` component drawing every node and its
 *   `left`/`right` edges, with the current step's highlight set emphasised. It is
 *   the shared surface for the BST operations and all four traversals, so a node
 *   carries both a fill and a text state label: a traversal's *visited* set and a
 *   search's *examined path* are different ideas and must be distinguishable
 *   (`NFR-U2`, `FR8`).
 *
 * WHY THIS FILE EXISTS
 *   One renderer per structure (A2 Listing 18). Because node ids are stable across
 *   steps, a node moves within the layout instead of being recreated, so the
 *   animation reads as the tree changing rather than a redraw (`A1 §6.3`, `FR8`).
 *
 * RULES
 *   React owns the SVG; geometry comes from `render/layout/hierarchy` (D3 computes,
 *   React renders — `ADR-2`). Positions are view state and are never written back
 *   into the model. A node's `parent` is not used for drawing — the picture is
 *   derived from `left`/`right` only, so a stale pointer cannot affect it. No step
 *   index, no timer. Colours are the `src/index.css` tokens, never literal hex.
 */

import type { BinarySearchTree } from '../../core/model/bst'
import type { Step } from '../../core/trace/step'
import { layoutTree } from '../layout/hierarchy'
import { TREE_LAYOUT, type Point } from '../layout/scales'

export type TreeRendererProps = {
  state: BinarySearchTree
  step: Step | undefined
}

const NODE_FILL = {
  undiscovered: 'var(--color-node-undiscovered)',
  frontier: 'var(--color-node-frontier)',
  current: 'var(--color-node-current)',
  visited: 'var(--color-node-visited)',
} as const

const NODE_INK = {
  undiscovered: 'var(--color-ink)',
  frontier: 'var(--color-base)',
  current: 'var(--color-base)',
  visited: 'var(--color-base)',
} as const

const EDGE = 'var(--color-subtle)'
const EDGE_ACTIVE = 'var(--color-accent)'

/** Trims a line to a circle's edge so arrow-less edges don't run under a node. */
function segment(from: Point, to: Point, radius: number) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy) || 1
  return {
    x1: from.x + (dx / distance) * radius,
    y1: from.y + (dy / distance) * radius,
    x2: to.x - (dx / distance) * radius,
    y2: to.y - (dy / distance) * radius,
  }
}

export function TreeRenderer({ state, step }: TreeRendererProps) {
  const radius = TREE_LAYOUT.nodeRadius
  const positions = layoutTree(state)
  const activeId = step?.highlight.active
  const touched = step?.highlight.nodes ?? []
  const visited = step?.aux?.visited ?? []
  const activeEdges = step?.highlight.edges ?? []

  const kindFor = (id: string): keyof typeof NODE_FILL => {
    if (id === activeId) return 'current'
    if (visited.includes(id)) return 'visited'
    if (touched.includes(id)) return 'frontier'
    return 'undiscovered'
  }

  return (
    <svg
      viewBox={`0 0 ${TREE_LAYOUT.width} ${TREE_LAYOUT.height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Binary search tree with ${state.nodes.length} node(s)`}
    >
      {state.nodes.map((node) => {
        const parent = positions[node.id]
        if (parent === undefined) return null
        return [node.left, node.right].map((childId) => {
          if (childId === null) return null
          const child = positions[childId]
          if (child === undefined) return null
          const isActive = activeEdges.some(
            (edge) => edge.from === node.id && edge.to === childId,
          )
          return (
            <line
              key={`${node.id}->${childId}`}
              {...segment(parent, child, radius)}
              stroke={isActive ? EDGE_ACTIVE : EDGE}
              strokeWidth={isActive ? 3 : 1.6}
            />
          )
        })
      })}

      {state.nodes.map((node) => {
        const point = positions[node.id]
        if (point === undefined) return null
        const kind = kindFor(node.id)
        return (
          <g key={node.id} transform={`translate(${point.x} ${point.y})`}>
            <title>{`${node.id} — value ${String(node.value)}, ${kind}`}</title>
            {node.id === activeId && (
              <circle
                r={radius + 5}
                fill="none"
                stroke="var(--color-node-current)"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            )}
            <circle
              r={radius}
              fill={NODE_FILL[kind]}
              stroke="var(--color-base)"
              strokeWidth={1.5}
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="14"
              fontWeight="600"
              fill={NODE_INK[kind]}
            >
              {String(node.value)}
            </text>
            <text
              y={radius + 13}
              textAnchor="middle"
              fontSize="9"
              fill="var(--color-muted)"
            >
              {node.id} · {kind}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
