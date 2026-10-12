import { describe, expect, it } from 'vitest'
import type { BinaryHeap } from '../core/model/binaryHeap'
import { heapIsValid, heapValues } from '../core/model/binaryHeap'
import type { BinarySearchTree } from '../core/model/bst'
import { valuesInOrder } from '../core/model/bst'
import { graphEdges, type GraphModel } from '../core/model/graph'
import { createTraceStore } from '../core/trace/store'
import {
  getPreset,
  presetEdgesToText,
  presetValuesToText,
} from '../data/presets'
import type { LoadInput } from './controller'
import { reducerFor } from './reducers'
import { runInsertAtHead, runOperation, type RunRequest } from './runOperation'

// DOM-free: the request pipeline is application logic (ADR-7).

/**
 * Replays a composed trace to its final state, exactly as the controller does.
 * This is what proves "insert one at a time, then run" reconstructs the same
 * structure a batch build would.
 */
function finalModel(input: LoadInput): unknown {
  const store = createTraceStore<unknown>(
    input.initial,
    input.steps,
    reducerFor(input.structureId),
  )
  return store.reconstruct(input.steps.length - 1)
}

function heapPreset(id: string): { valuesText: string } {
  const preset = getPreset(id)
  if (preset === undefined || preset.structureId !== 'heap') {
    throw new Error(`heap preset "${id}" missing`)
  }
  return { valuesText: presetValuesToText(preset) }
}

function graphPreset(): { edgesText: string; sourceText: string } {
  const preset = getPreset('graph-bfs-dfs')
  if (preset === undefined || preset.structureId !== 'graph') {
    throw new Error('graph preset missing')
  }
  return { edgesText: presetEdgesToText(preset), sourceText: preset.source }
}

describe('runOperation — the generic request pipeline', () => {
  it('still runs the original list slice through the wrapper', () => {
    const outcome = runInsertAtHead('50, 30, 70', '45')

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.input.structureId).toBe('list')
    expect(outcome.input.operationId).toBe('insertAtHead')
    expect(outcome.input.steps).toHaveLength(4)
  })

  it('builds the BST by inserting one value at a time, then searches', () => {
    const outcome = runOperation({
      structureId: 'bst',
      operationId: 'bstSearch',
      valuesText: '50, 30, 70, 45',
      valueText: '45',
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    // The trace starts from an empty tree and inserts each value in turn, so the
    // first step is an insert and its narration names the value and progress.
    expect((outcome.input.initial as BinarySearchTree).root).toBeNull()
    expect(outcome.input.steps[0].operation).toBe('bstInsert')
    expect(outcome.input.steps[0].narration).toContain('Inserting 50 (1 of 4)')
    expect(
      outcome.input.steps.some((step) => step.operation === 'bstSearch'),
    ).toBe(true)

    // Replaying the composed deltas lands on the full, sorted tree.
    expect(
      valuesInOrder(finalModel(outcome.input) as BinarySearchTree),
    ).toEqual([30, 45, 50, 70])
  })

  it('ignores a duplicate BST key instead of failing (ER4)', () => {
    const outcome = runOperation({
      structureId: 'bst',
      operationId: 'bstInsertAll',
      valuesText: '10, 5, 10',
    })

    expect(outcome.ok).toBe(true)
    expect(
      outcome.report.tokens.some((token) => token.status === 'ignored'),
    ).toBe(true)
    if (!outcome.ok) return
    // Only the two distinct keys exist after the build.
    expect(
      valuesInOrder(finalModel(outcome.input) as BinarySearchTree),
    ).toEqual([5, 10])
  })

  it('runs inorder after building the tree, switching operation mid-trace', () => {
    const outcome = runOperation({
      structureId: 'bst',
      operationId: 'inorder',
      valuesText: '50, 30, 70',
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    // Two phases: insert steps first, then exactly one visit step per node.
    expect(
      outcome.input.steps.some((step) => step.operation === 'bstInsert'),
    ).toBe(true)
    expect(
      outcome.input.steps.filter((step) => step.operation === 'inorder'),
    ).toHaveLength(3)
    expect(
      valuesInOrder(finalModel(outcome.input) as BinarySearchTree),
    ).toEqual([30, 50, 70])
  })

  it('build-heap heapifies the raw array in one phase (the O(n) contrast)', () => {
    const outcome = runOperation({
      structureId: 'heap',
      operationId: 'heapBuildMin',
      ...heapPreset('heap-unsorted'),
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(
      outcome.input.steps.every((step) => step.operation === 'heapBuildMin'),
    ).toBe(true)
    const final = finalModel(outcome.input) as BinaryHeap
    expect(heapIsValid(final)).toBe(true)
    expect(heapValues(final)[0]).toBe(1)
  })

  it('insert-values builds a valid heap one value at a time from any order', () => {
    const outcome = runOperation({
      structureId: 'heap',
      operationId: 'heapInsertAll',
      valuesText: '42, 7, 19, 3',
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(
      outcome.input.steps.every((step) => step.operation === 'heapInsert'),
    ).toBe(true)
    expect(outcome.input.steps[0].narration).toContain('Inserting 42 (1 of 4)')
    expect(heapIsValid(finalModel(outcome.input) as BinaryHeap)).toBe(true)
  })

  it('heapInsert appends the extra value after the build', () => {
    const outcome = runOperation({
      structureId: 'heap',
      operationId: 'heapInsert',
      valuesText: '5, 9, 12',
      valueText: '0',
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const final = finalModel(outcome.input) as BinaryHeap
    expect(heapIsValid(final)).toBe(true)
    expect(heapValues(final)[0]).toBe(0)
  })

  it('extract-min runs after the insert-by-insert build', () => {
    const outcome = runOperation({
      structureId: 'heap',
      operationId: 'heapExtractMin',
      valuesText: '42, 7, 19, 3',
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(
      outcome.input.steps.some((step) => step.operation === 'heapExtractMin'),
    ).toBe(true)
    const final = finalModel(outcome.input) as BinaryHeap
    expect(heapValues(final)).toHaveLength(3)
  })

  it('runs BFS and DFS after adding the edges one at a time', () => {
    const { edgesText, sourceText } = graphPreset()
    const breadth = runOperation({
      structureId: 'graph',
      operationId: 'bfs',
      edgesText,
      sourceText,
    })
    const depth = runOperation({
      structureId: 'graph',
      operationId: 'dfs',
      edgesText,
      sourceText,
    })

    expect(breadth.ok).toBe(true)
    expect(depth.ok).toBe(true)
    if (!breadth.ok || !depth.ok) return

    // Phase 1: vertices exist but no edge does yet; phase 2 traverses.
    expect((breadth.input.initial as GraphModel).vertices).toHaveLength(16)
    expect(graphEdges(breadth.input.initial as GraphModel)).toHaveLength(0)
    expect(
      breadth.input.steps.some((step) => step.operation === 'graphBuild'),
    ).toBe(true)
    expect(breadth.input.steps.some((step) => step.operation === 'bfs')).toBe(
      true,
    )
    expect(graphEdges(finalModel(breadth.input) as GraphModel)).toHaveLength(20)

    // The same source, two different orders — the whole point of the lesson.
    expect(breadth.input.steps).not.toEqual(depth.input.steps)
  })

  it('graphBuild adds each edge in order and stops there', () => {
    const { edgesText } = graphPreset()
    const outcome = runOperation({
      structureId: 'graph',
      operationId: 'graphBuild',
      edgesText,
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(
      outcome.input.steps.every((step) => step.operation === 'graphBuild'),
    ).toBe(true)
    expect(graphEdges(finalModel(outcome.input) as GraphModel)).toHaveLength(20)
  })

  it('reports an unknown source vertex as a validation failure (ER9)', () => {
    const outcome = runOperation({
      structureId: 'graph',
      operationId: 'bfs',
      edgesText: 'A-B\nB-C',
      sourceText: 'Z',
    })

    expect(outcome.ok).toBe(false)
    expect(
      outcome.report.tokens.some((token) =>
        /unknown vertex/.test(token.reason ?? ''),
      ),
    ).toBe(true)
  })

  it('reports an unknown operation instead of throwing', () => {
    const outcome = runOperation({
      structureId: 'bst',
      operationId: 'doesNotExist',
    })

    expect(outcome.ok).toBe(false)
    expect(outcome.report.error).toMatch(/Unknown operation/)
  })

  it('is deterministic for the same request (NFR-C2)', () => {
    const request: RunRequest = {
      structureId: 'heap',
      operationId: 'heapInsertAll',
      valuesText: '42, 7, 19, 3, 88, 1',
    }
    expect(JSON.stringify(runOperation(request))).toBe(
      JSON.stringify(runOperation(request)),
    )
  })
})
