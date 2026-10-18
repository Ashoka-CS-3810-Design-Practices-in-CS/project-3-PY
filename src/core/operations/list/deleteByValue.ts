/**
 * `deleteByValue` — linked-list operation generator.
 *
 * WHAT GOES HERE
 *   Delete the first node holding a value. The generator walks forward keeping the
 *   predecessor, emitting a `Step` per comparison, then unlinks the match and
 *   reports whether anything was deleted.
 *
 * WHY / REQUIREMENTS
 *   One file per operation (A2 Listing 18). Cost shown: O(n) unless the
 *   predecessor is already known (A1 §6.3). The interesting teaching moment is
 *   *why* the predecessor is needed — the unlink needs the previous node.
 *
 * CONTRACT
 *   Pure `(structure, request) -> { trace, summary }`. The `unlinked` delta records
 *   the edge removed, so the renderer never has to guess (A2 Listing 17).
 *
 * STATUS
 *   Not implemented. Added after the vertical slice freezes the Step contract.
 */


/**
 * deleteByValue — linked-list operation generator.
 *
 * Deletes the first node holding the requested value.
 * Emits a Step for each comparison and records the edge removed.
 *
 * Time complexity: O(n)
 */



import type { GenerateSummary, StructureDelta, Step } from '../../trace/step'
import {
  HEAD_POINTER,
  applyListDelta,
  nodeById,
  type LinkedListModel,
} from '../../model/linkedList'

export const OPERATION_ID = 'deleteByValue'

export type DeleteByValueRequest = { value: string | number }

export type GenerateResult = {
  trace: Step[]
  summary: GenerateSummary
  finalState: LinkedListModel
}

export function deleteByValue(
  initial: LinkedListModel,
  request: DeleteByValueRequest,
): GenerateResult {
  const trace: Step[] = []
  let state = initial
  let current = initial.head
  let predecessor: string | null = null
  let comparisons = 0

  const record = (
    codeLine: number,
    narration: string,
    delta: StructureDelta,
    highlight: Step['highlight'],
  ): void => {
    state = applyListDelta(state, delta)
    trace.push({
      index: trace.length,
      operation: OPERATION_ID,
      codeLine,
      narration,
      highlight,
      delta,
    })
  }

  // Walk the list, following links from one node to the next.
  while (current !== null) {
    const node = nodeById(state, current)

    if (node === undefined) {
      throw new Error(`Invalid linked-list reference: ${current}`)
    }

    comparisons += 1

    record(
      4,
      `Compare ${String(node.value)} with ${String(request.value)}.`,
      {},
      { nodes: [current], active: current, edges: [] }, 

      
    )

    if (node.value === request.value) {
     
     
      record(
  5,
  `Found ${String(node.value)}! Removing this node from the list.`,
  {},
  { nodes: [current], active: current, edges: [] },
   )
 
     const successor = nextNode(state, current)  


if (predecessor === null) {
  // The matching node is the head: move the head pointer and remove it.
  record(
    6,
    `Delete the head node holding ${String(node.value)}.`,
    {
      updated: [
        { id: HEAD_POINTER, from: current, to: successor },
      ],
      removed: [current],
    },
    { nodes: [current], active: current, edges: [] },
  )
} else {
  // Connect the predecessor to the successor and remove the matching node.
  record(
    8,
    `Unlink the node holding ${String(node.value)}.`,
    {
      unlinked: [
        { from: predecessor, to: current, kind: 'next' },
      ],
      ...(successor === null
        ? {}
        : {
            linked: [
              { from: predecessor, to: successor, kind: 'next' as const },
            ],
          }),
      removed: [current],
    },
    {
      nodes: successor === null
        ? [predecessor, current]
        : [predecessor, current, successor],
      active: current,
      edges: [],
    },
  )
}  
     




      record(
        8,
        `Deleted the first occurrence of ${String(request.value)}.`,
        {},
        { nodes: [current], active: current, edges: [] },
      )

      return {
        trace,
        summary: {
          steps: trace.length,
          comparisons,
          conclusion: `Deleted ${String(request.value)} from the linked list.`,
        },
        finalState: state,
      }
    }

    predecessor = current
    current = nextNode(state, current)
  }

  record(
    12,
    `Value ${String(request.value)} was not found. The list remains unchanged.`,
    {},
    {
      nodes: predecessor === null ? [] : [predecessor],
      active: predecessor ?? undefined,
      edges: [],
    },
  )

  return {
    trace,
    summary: {
      steps: trace.length,
      comparisons,
      conclusion: `Value ${String(request.value)} was not found; the list is unchanged.`,
    },
    finalState: state,
  }
}

/** Find the node reached by following the current node's next link. */
function nextNode(
  model: LinkedListModel,
  id: string,
): string | null {
  return model.links.find((link) => link.from === id && link.kind === 'next')?.to ?? null
}
