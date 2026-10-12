/**
 * Hierarchy layout — tree geometry from `d3-hierarchy`.
 *
 * WHAT GOES HERE
 *   Pure functions that turn a tree into node positions: `d3.hierarchy` + `d3.tree`
 *   output mapped into the SVG viewport. Two entry points share the machinery:
 *
 *   - `layoutTree(model)`  — the BST, built from its `left`/`right` pointers;
 *   - `layoutHeapTree(n)`  — the heap's tree projection, built from array indices
 *                            (`i → 2i+1, 2i+2`), which is the same tree the array
 *                            view shows.
 *
 * WHY THIS FILE EXISTS
 *   Geometry belongs in `render/layout/`, never in `core/model/` — vertex positions
 *   are **view state**, and an algorithm that read them would change behaviour when
 *   the picture changed, breaking determinism (`A1 §6.3`, `NFR-C2`). Both renderers
 *   that draw a tree import this module, so the BST and the heap's tree view use
 *   one spacing convention rather than two.
 *
 * RULES
 *   D3 as a **computation** library only: import `d3-hierarchy`, return plain data,
 *   never touch the DOM (`ADR-2`). Deterministic output for a given tree, and a
 *   cycle guard so a corrupted model terminates rather than recursing forever.
 */

import { hierarchy, tree } from 'd3-hierarchy'
import { bstNodeById, type BinarySearchTree } from '../../core/model/bst'
import type { NodeId } from '../../core/trace/step'
import { HEAP_LAYOUT, TREE_LAYOUT, type Point } from './scales'

/** A plain tree datum: d3 only needs `children`, and ids keep the output keyed. */
type TreeDatum = { id: NodeId; children: TreeDatum[] }
type HeapDatum = { index: number; children: HeapDatum[] }

/**
 * Positions for the BST's nodes, keyed by node id.
 *
 * `d3.tree()` lays the tree out horizontally across `width - 2·margin` and
 * vertically down `height - 2·margin`, so the result is already bounded by the
 * viewport; the margin only insets it. An empty tree returns `{}`.
 */
export function layoutTree(model: BinarySearchTree): Record<NodeId, Point> {
  if (model.root === null) return {}

  const seen = new Set<NodeId>()
  const build = (id: NodeId | null): TreeDatum | null => {
    if (id === null || seen.has(id)) return null
    const node = bstNodeById(model, id)
    if (node === undefined) return null
    seen.add(id)
    const children = [build(node.left), build(node.right)].filter(
      (child): child is TreeDatum => child !== null,
    )
    return { id, children }
  }

  const root = build(model.root)
  if (root === null) return {}

  const rootNode = hierarchy(root, (datum) => datum.children)
  const layout = tree<TreeDatum>().size([
    TREE_LAYOUT.width - 2 * TREE_LAYOUT.margin,
    TREE_LAYOUT.height - 2 * TREE_LAYOUT.margin,
  ])
  layout(rootNode)

  const positions: Record<NodeId, Point> = {}
  rootNode.each((node) => {
    positions[node.data.id] = {
      x: Math.round(TREE_LAYOUT.margin + (node.x ?? 0)),
      y: Math.round(TREE_LAYOUT.margin + (node.y ?? 0)),
    }
  })
  return positions
}

/**
 * Positions for the heap's tree projection, keyed by ARRAY INDEX. Slot `i` has
 * children `2i+1` and `2i+2`, exactly the index arithmetic the array view shows,
 * so a cell and its circle are always the same entry at the same depth.
 */
export function layoutHeapTree(size: number): Record<number, Point> {
  if (size <= 0) return {}

  const build = (index: number): HeapDatum | null => {
    if (index >= size) return null
    const children = [build(2 * index + 1), build(2 * index + 2)].filter(
      (child): child is HeapDatum => child !== null,
    )
    return { index, children }
  }

  const root = build(0)
  if (root === null) return {}

  const rootNode = hierarchy(root, (datum) => datum.children)
  const layout = tree<HeapDatum>().size([
    HEAP_LAYOUT.width - 2 * HEAP_LAYOUT.margin,
    HEAP_LAYOUT.height - HEAP_LAYOUT.arrayY - HEAP_LAYOUT.cellHeight,
  ])
  layout(rootNode)

  const positions: Record<number, Point> = {}
  rootNode.each((node) => {
    positions[node.data.index] = {
      x: Math.round(HEAP_LAYOUT.margin + (node.x ?? 0)),
      y: Math.round(HEAP_LAYOUT.margin + (node.y ?? 0)),
    }
  })
  return positions
}
