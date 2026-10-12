/**
 * `postorder` — tree traversal generator (left, right, visit).
 *
 * WHAT IT DOES
 *   A depth-first walk that visits a node *after* both of its subtrees. The last
 *   value in the output is therefore always the root, and a parent always appears
 *   after every node in its subtree. That is the order used to free or tear down a
 *   tree bottom-up (a parent can only be released once its children are), and to
 *   evaluate an expression tree (A2 §3.3). One `Step` per visit, with the live call
 *   stack in `aux`.
 *
 * PSEUDOCODE / codeLine MAP
 *   The authored listing lives in `data/catalogue.ts` under `postorder`:
 *
 *     4   `postorder(node.left, output)`
 *     5   `postorder(node.right, output)`
 *     6   `output.append(node.value)`   the visit, now LAST
 *
 *   Beside `preorder` (first) and `inorder` (middle), the three listings differ
 *   only in where this line sits — the deferred visit is the thing being taught
 *   (A2 §3.3).
 *
 * HOW IT IS SHARED
 *   Pure and read-only, so `finalState` is a fresh copy. The visit order is also
 *   returned as data and cross-checked against the model's `postorderNodeIds`.
 *
 * AUX SHAPE
 *   `kind: "recursion"`, `frameIds` = the call path, `frames` = the depth of each
 *   frame.
 *
 * RULES
 *   No React, D3, `render/`, `ui/`, timers or DOM; deterministic, left-before-right
 *   (ADR-2, NFR-C2, NFR-M2). Cost shown: Θ(n) time, O(h) auxiliary space.
 */

import { bstNodeById, type BinarySearchTree } from '../../model/bst'
import type { StructureValue } from '../../model/order'
import type { GenerateSummary, NodeId, Step, TraceEdge } from '../../trace/step'

export const OPERATION_ID = 'postorder'

export type PostorderResult = {
  trace: Step[]
  summary: GenerateSummary
  finalState: BinarySearchTree
  /** Node ids in visit order. */
  orderIds: NodeId[]
  /** Values in visit order; the root's value is last. */
  order: StructureValue[]
}

export function postorder(tree: BinarySearchTree): PostorderResult {
  const steps: Step[] = []
  const orderIds: NodeId[] = []
  const order: StructureValue[] = []

  /** The edges along a root-to-frame path, read from the model (see preorder.ts). */
  const edgesForPath = (nodePath: readonly NodeId[]): TraceEdge[] => {
    const edges: TraceEdge[] = []
    for (let i = 1; i < nodePath.length; i += 1) {
      const parentId = nodePath[i - 1]
      const childId = nodePath[i]
      const parent = bstNodeById(tree, parentId)
      edges.push({
        from: parentId,
        to: childId,
        kind: parent?.left === childId ? 'left' : 'right',
      })
    }
    return edges
  }

  const walk = (id: NodeId | null, path: readonly NodeId[]): void => {
    if (id === null) return
    const node = bstNodeById(tree, id)
    /* istanbul ignore if — the walk only ever follows ids that resolve. */
    if (node === undefined) return

    const framePath = [...path, id]

    // VISIT-LAST: both subtrees are finished before the node is emitted.
    walk(node.left, framePath)
    walk(node.right, framePath)

    orderIds.push(id)
    order.push(node.value)

    steps.push({
      index: steps.length,
      operation: OPERATION_ID,
      codeLine: 6,
      narration: `Visit ${String(node.value)} at ${id} — both children are done, so this node can now be released or evaluated. Call stack: ${framePath.join(' → ')}.`,
      highlight: {
        nodes: [...orderIds],
        active: id,
        edges: edgesForPath(framePath),
      },
      delta: {},
      aux: {
        kind: 'recursion',
        frames: framePath.map((_, depth) => depth),
        frameIds: framePath,
        // The visit order so far; postorder only adds a node after its subtrees,
        // so this grows bottom-up (FR10).
        visited: [...orderIds],
        comparisons: 0,
      },
    })
  }

  if (tree.root === null) {
    steps.push({
      index: 0,
      operation: OPERATION_ID,
      codeLine: 2,
      narration:
        'The tree is empty, so postorder visits nothing. This is the base case.',
      highlight: { nodes: [], edges: [] },
      delta: {},
      aux: { kind: 'recursion', frames: [], frameIds: [], comparisons: 0 },
    })
  } else {
    walk(tree.root, [])
  }

  const rootVisitedLast =
    orderIds.length > 0 && orderIds[orderIds.length - 1] === tree.root

  return {
    trace: steps,
    summary: {
      steps: steps.length,
      comparisons: 0,
      conclusion:
        order.length === 0
          ? 'Postorder over an empty tree: no nodes visited.'
          : `Postorder visited ${order.length} node(s) in Θ(n): ${order.map(String).join(', ')}${
              rootVisitedLast
                ? ' — the root is last, so the tree could now be freed bottom-up.'
                : '.'
            }`,
    },
    finalState: {
      nodes: tree.nodes.map((node) => ({ ...node })),
      root: tree.root,
    },
    orderIds,
    order,
  }
}
