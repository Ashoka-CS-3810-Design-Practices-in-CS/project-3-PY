import { describe, expect, it } from 'vitest'
import { heapValues } from '../core/model/binaryHeap'
import { getPreset, presetValuesToText } from '../data/presets'
import { createPlaybackController } from './controller'
import { isStructureId, reducerFor, STRUCTURE_IDS, wrapState } from './reducers'
import { runOperation } from './runOperation'

// DOM-free: the session layer is plain objects (ADR-4).

function heapPresetValues(): string {
  const preset = getPreset('heap-unsorted')
  if (preset === undefined || preset.structureId !== 'heap') {
    throw new Error('heap preset missing')
  }
  return presetValuesToText(preset)
}

describe('structure registry', () => {
  it('knows exactly the catalogue structures', () => {
    for (const id of STRUCTURE_IDS) {
      expect(isStructureId(id)).toBe(true)
      expect(typeof reducerFor(id)).toBe('function')
    }
    expect(isStructureId('queue')).toBe(false)
  })

  it('throws on an unknown structure id', () => {
    expect(() => reducerFor('nope')).toThrow(/Unknown structure/)
    expect(() => wrapState('nope', {})).toThrow(/Unknown structure/)
  })

  it('tags a reconstructed model with its structure id', () => {
    expect(wrapState('heap', { entries: [], kind: 'min' })).toEqual({
      structureId: 'heap',
      model: { entries: [], kind: 'min' },
    })
  })
})

describe('PlaybackController — structure-agnostic replay', () => {
  it('has no state before a trace is loaded', () => {
    const controller = createPlaybackController()
    expect(controller.getState()).toBeNull()
    expect(controller.getSnapshot().phase).toBe('IDLE')
  })

  it('replays a heap trace and tags the reconstructed state', () => {
    const outcome = runOperation({
      structureId: 'heap',
      operationId: 'heapBuildMin',
      valuesText: heapPresetValues(),
    })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const controller = createPlaybackController()
    controller.load(outcome.input)

    expect(controller.getSnapshot().structureId).toBe('heap')
    expect(controller.getSnapshot().operationId).toBe('heapBuildMin')

    // Walk to the end: the heap is now valid and the root is the minimum.
    controller.seek(outcome.input.steps.length - 1)
    const state = controller.getState()
    expect(state?.structureId).toBe('heap')
    if (state?.structureId !== 'heap') return
    expect(heapValues(state.model)[0]).toBe(1)

    // Scrub back to step 0: the raw array is restored, so seek is exact.
    controller.seek(0)
    const start = controller.getState()
    expect(start?.structureId).toBe('heap')
    if (start?.structureId !== 'heap') return
    expect(heapValues(start.model)[0]).toBe(42)
  })

  it('replays a graph trace through the graph reducer', () => {
    const outcome = runOperation({
      structureId: 'graph',
      operationId: 'bfs',
      edgesText: 'A-B\nB-C\nA-C',
      sourceText: 'A',
    })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const controller = createPlaybackController()
    controller.load(outcome.input)
    controller.seek(outcome.input.steps.length - 1)

    const state = controller.getState()
    expect(state?.structureId).toBe('graph')
    if (state?.structureId !== 'graph') return
    expect(state.model.vertices).toHaveLength(3)
  })

  it('reports an unknown structure through the error phase', () => {
    const controller = createPlaybackController()
    controller.load({
      initial: {},
      steps: [],
      summary: { steps: 0, comparisons: 0, conclusion: '' },
      structureId: 'queue',
      operationId: 'enqueue',
    })

    expect(controller.getSnapshot().phase).toBe('ERROR')
    expect(controller.getSnapshot().error).toMatch(/Unknown structure/)
    expect(controller.getState()).toBeNull()
  })
})
