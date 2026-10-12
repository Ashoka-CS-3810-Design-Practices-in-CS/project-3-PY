/**
 * `bstMinMax` — BST operation generator.
 *
 * WHAT IT DOES
 *   Walk to the leftmost node for the minimum and to the rightmost for the
 *   maximum, emitting both walks. The two walks are the *same* down-one-side
 *   pattern the two-children case of `delete` uses to find its in-order successor,
 *   so this operation also doubles as revision for that case.
 *
 *   It is also the deliberate contrast with the heap: both structures store a
 *   minimum, but the heap reads its root in O(1) while the BST pays O(h) to reach
 *   the leftmost leaf. Putting the two operations side by side is the point.
 *
 * PSEUDOCODE / codeLine MAP
 *   The authored listing lives in `data/catalogue.ts` under `bstMinMax`:
 *
 *     5      `minimum ← current`   a candidate for the minimum (left-walk)
 *     6      `current ← current.left`  step left
 *    10      `maximum ← current`   a candidate for the maximum (right-walk)
 *    11      `current ← current.right` step right
 *    12      `return minimum, maximum` the conclusion
 *
 * HOW IT IS SHARED
 *   Pure `(structure, request) -> { trace, summary, finalState }`, read-only like
 *   `search`: no delta ever changes the tree, so `finalState` is a fresh copy of
 *   the input. Compared against the model's untraced `minNodeId` / `maxNodeId`.
 *
 * RULES
 *   No React, D3, `render/`, `ui/`, timers or DOM; deterministic (NFR-C2). Cost
 *   shown: O(h) per walk, and O(1) auxiliary state — no `aux`.
 */

import {
  applyBstDelta,
  bstNodeById,
  type BinarySearchTree,
} from '../../model/bst'
import type { GenerateSummary, NodeId, Step, TraceEdge } from '../../trace/step'

export const OPERATION_ID = 'bstMinMax'

export type BstMinMaxResult = {
  trace: Step[]
  summary: GenerateSummary
  finalState: BinarySearchTree
  minId: NodeId | null
  maxId: NodeId | null
}

/**
 * The operation takes no request: it reads the whole tree and reports both ends.
 * The signature is therefore one argument, which keeps `noUnusedParameters` and
 * the lint rule honest instead of carrying an empty request object around.
 */
export function bstMinMax(initial: BinarySearchTree): BstMinMaxResult {
  const steps: Step[] = []
  let hops = 0

  // Read-only: `state` is the input for every step, and the terminal copy is the
  // returned `finalState`.
  const state = initial

  const record = (
    codeLine: number,
    narration: string,
    nodes: NodeId[],
    active: NodeId | null,
    edges: TraceEdge[],
  ): void => {
    steps.push({
      index: steps.length,
      operation: OPERATION_ID,
      codeLine,
      narration,
      highlight: {
        nodes,
        ...(active === null ? {} : { active }),
        edges,
      },
      delta: {},
    })
  }

  // ------------------------------------------------------- empty tree: one step
  if (state.root === null) {
    record(
      12,
      'The tree is empty, so it has neither a minimum nor a maximum.',
      [],
      null,
      [],
    )
    return {
      trace: steps,
      summary: {
        steps: steps.length,
        comparisons: 0,
        conclusion: 'Empty tree: no minimum and no maximum.',
      },
      finalState: applyBstDelta(state, {}),
      minId: null,
      maxId: null,
    }
  }

  // ------------------------------------------------------------------ minimum
  const minPath: NodeId[] = []
  const minEdges: TraceEdge[] = []
  let current: NodeId | null = state.root

  while (current !== null) {
    const node = bstNodeById(state, current)
    /* istanbul ignore if — the walk only ever follows ids that resolve. */
    if (node === undefined) break
    minPath.push(current)
    record(
      5,
      `Candidate minimum: ${String(node.value)} at ${current}. The smallest key can only be further left.`,
      [...minPath],
      current,
      [...minEdges],
    )
    if (node.left === null) break
    hops += 1
    minEdges.push({ from: current, to: node.left, kind: 'left' })
    current = node.left
  }
  const minId = minPath[minPath.length - 1] ?? null

  // ------------------------------------------------------------------ maximum
  const maxPath: NodeId[] = []
  const maxEdges: TraceEdge[] = []
  current = state.root

  while (current !== null) {
    const node = bstNodeById(state, current)
    /* istanbul ignore if — the walk only ever follows ids that resolve. */
    if (node === undefined) break
    maxPath.push(current)
    record(
      10,
      `Candidate maximum: ${String(node.value)} at ${current}. The largest key can only be further right.`,
      [...minPath, ...maxPath],
      current,
      [...minEdges, ...maxEdges],
    )
    if (node.right === null) break
    hops += 1
    maxEdges.push({ from: current, to: node.right, kind: 'right' })
    current = node.right
  }
  const maxId = maxPath[maxPath.length - 1] ?? null

  const minValue = minId === null ? undefined : bstNodeById(state, minId)?.value
  const maxValue = maxId === null ? undefined : bstNodeById(state, maxId)?.value

  record(
    12,
    `Minimum is ${String(minValue)} at ${minId}; maximum is ${String(maxValue)} at ${maxId}. Both walks cost O(h).`,
    [...minPath, ...maxPath],
    null,
    [...minEdges, ...maxEdges],
  )

  return {
    trace: steps,
    summary: {
      steps: steps.length,
      comparisons: hops,
      conclusion: `min = ${String(minValue)}, max = ${String(maxValue)}; the two down-one-side walks cost O(h) = ${hops} edge(s).`,
    },
    finalState: applyBstDelta(state, {}),
    minId,
    maxId,
  }
}
