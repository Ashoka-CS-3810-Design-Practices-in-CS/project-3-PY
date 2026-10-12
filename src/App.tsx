import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  getOperationMeta,
  getPseudocode,
  getStructure,
  listStructures,
} from './app/catalogue'
import {
  createPlaybackController,
  type PlaybackController,
} from './app/controller'
import type { StructureId } from './app/reducers'
import { runOperation } from './app/runOperation'
import { PHASE_LABEL } from './app/stateMachine'
import type { ValidationReport } from './app/validate'
import {
  getPreset,
  presetEdgesToText,
  presetsForStructure,
  presetValuesToText,
  type PresetDataset,
} from './data/presets'
import { StepAnnouncer } from './ui/a11y/StepAnnouncer'
import { PlaybackControls } from './ui/controls/PlaybackControls'
import { useKeyboardShortcuts } from './ui/controls/useKeyboardShortcuts'
import { OperationGuide } from './ui/guide/OperationGuide'
import { AuxStatePane } from './ui/panes/AuxStatePane'
import { ComplexityPanel } from './ui/panes/ComplexityPanel'
import { PseudocodePane } from './ui/panes/PseudocodePane'
import { StructurePane } from './ui/panes/StructurePane'
import { CatalogueSidebar } from './ui/sidebar/CatalogueSidebar'
import { WorkspaceShell } from './ui/shell/WorkspaceShell'

/**
 * Composition root. It wires the pieces and nothing else:
 *
 *   text ─► app/runOperation (validate → build → execute) ─► controller.load
 *
 * From there every pane is a pure function of `(trace, index)`; nothing here holds
 * the index or a timer (`ADR-1`, `ADR-4`). The pipeline lives in `app/`, so this
 * file never imports the algorithm layer directly.
 *
 * The selection (structure, operation, text) is UI state. `controller.getState()`
 * is only used when the loaded operation matches the selection, so switching
 * structure never shows a stale picture under a new heading.
 */

const DEFAULT_STRUCTURE = 'list'
const DEFAULT_OPERATION = 'insertAtHead'
const DEFAULT_VALUES = '50, 30, 70'
const DEFAULT_VALUE = '45'

/** Which operation a preset is most interesting with, for one-click loading. */
const PRESET_OPERATION: Record<string, string> = {
  'list-basic': 'insertAtHead',
  'bst-balanced': 'bstInsertAll',
  'bst-degenerate': 'bstInsertAll',
  'heap-unsorted': 'heapInsertAll',
  'heap-valid': 'heapExtractMin',
  'graph-bfs-dfs': 'bfs',
}

function App() {
  // Created once, lazily: a stable value that is not a ref, so reading it during
  // render is fine. The controller owns the index and the timer (ADR-4).
  const [controller] = useState<PlaybackController>(() =>
    createPlaybackController(),
  )

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  )

  const [structureId, setStructureId] = useState(DEFAULT_STRUCTURE)
  const [operationId, setOperationId] = useState(DEFAULT_OPERATION)
  const [valuesText, setValuesText] = useState(DEFAULT_VALUES)
  const [valueText, setValueText] = useState(DEFAULT_VALUE)
  const [edgesText, setEdgesText] = useState('A-B\nB-C\nA-C')
  const [sourceText, setSourceText] = useState('A')
  const [directed, setDirected] = useState(false)
  const [report, setReport] = useState<ValidationReport | null>(null)

  /** Fills the text fields from a preset — the same fields a user would type in. */
  const applyPreset = useCallback((preset: PresetDataset): void => {
    if (preset.structureId === 'graph') {
      setEdgesText(presetEdgesToText(preset))
      setSourceText(preset.source)
      setDirected(preset.directed)
    } else {
      setValuesText(presetValuesToText(preset))
    }
  }, [])

  const selectStructure = useCallback(
    (id: string): void => {
      setStructureId(id)
      const entry = getStructure(id)
      const preset = presetsForStructure(id as StructureId)[0]
      if (preset !== undefined) {
        applyPreset(preset)
        setOperationId(
          PRESET_OPERATION[preset.id] ?? entry?.operations[0] ?? id,
        )
      } else {
        setOperationId(entry?.operations[0] ?? id)
      }
    },
    [applyPreset],
  )

  const selectPreset = useCallback(
    (presetId: string): void => {
      const preset = getPreset(presetId)
      if (preset === undefined) return
      setStructureId(preset.structureId)
      applyPreset(preset)
      const suggested = PRESET_OPERATION[preset.id]
      if (suggested !== undefined) setOperationId(suggested)
    },
    [applyPreset],
  )

  const visualise = useCallback((): void => {
    try {
      const outcome = runOperation({
        structureId,
        operationId,
        valuesText,
        valueText,
        edgesText,
        sourceText,
        directed,
      })
      setReport(outcome.report)
      if (outcome.ok) {
        controller.load(outcome.input)
      }
    } catch (error) {
      controller.fail(error instanceof Error ? error.message : String(error))
    }
  }, [
    controller,
    structureId,
    operationId,
    valuesText,
    valueText,
    edgesText,
    sourceText,
    directed,
  ])

  // Show something useful on first paint instead of an empty shell.
  const hasAutoRun = useRef(false)
  useEffect(() => {
    if (hasAutoRun.current) return
    hasAutoRun.current = true
    visualise()
  }, [visualise])

  useKeyboardShortcuts({
    onTogglePlay: () => {
      if (snapshot.phase === 'PLAYING') controller.pause()
      else controller.play()
    },
    onStepForward: () => controller.stepForward(),
    onStepBack: () => controller.stepBack(),
    onRestart: () => controller.restart(),
  })

  const meta = getOperationMeta(operationId)
  const listing = getPseudocode(meta?.pseudocodeId ?? operationId)

  // Only show the loaded trace when it belongs to the current selection.
  const loaded =
    snapshot.operationId === operationId && snapshot.structureId === structureId
  const state = loaded ? controller.getState() : null
  const currentStep = loaded ? snapshot.trace[snapshot.index] : undefined

  // The code and complexity panes follow the INSTRUCTION executing, not the
  // operation that was selected: a composed trace inserts the dataset first (the
  // insert listing) and runs the selected operation later (its own listing), so the
  // highlight switches phase as the trace advances.
  const activeOperationId = currentStep?.operation ?? operationId
  const activeMeta = getOperationMeta(activeOperationId) ?? meta
  const activeListing =
    getPseudocode(activeMeta?.pseudocodeId ?? activeOperationId) ?? listing

  return (
    <WorkspaceShell
      phaseLabel={PHASE_LABEL[snapshot.phase]}
      error={snapshot.error}
      sidebar={
        <CatalogueSidebar
          entries={listStructures()}
          selectedId={structureId}
          selectedOperationId={operationId}
          onSelect={selectStructure}
          onSelectOperation={setOperationId}
        />
      }
      guide={
        <OperationGuide
          structureId={structureId}
          operation={meta}
          valuesText={valuesText}
          valueText={valueText}
          edgesText={edgesText}
          sourceText={sourceText}
          directed={directed}
          presets={presetsForStructure(structureId as StructureId)}
          report={report}
          onValuesChange={setValuesText}
          onValueChange={setValueText}
          onEdgesChange={setEdgesText}
          onSourceChange={setSourceText}
          onDirectedChange={setDirected}
          onPresetSelect={selectPreset}
          onVisualise={visualise}
        />
      }
      structure={<StructurePane state={state} step={currentStep} />}
      pseudocode={
        <PseudocodePane
          lines={activeListing?.lines ?? []}
          activeLine={currentStep?.codeLine ?? 0}
          operationLabel={activeMeta?.label}
        />
      }
      aux={
        <AuxStatePane
          aux={currentStep?.aux}
          hasStep={currentStep !== undefined}
        />
      }
      complexity={
        <ComplexityPanel
          meta={activeMeta}
          summary={loaded ? snapshot.summary : null}
          index={loaded ? snapshot.index : 0}
          total={loaded ? snapshot.trace.length : 0}
        />
      }
      controls={
        <PlaybackControls
          snapshot={snapshot}
          onPlay={() => controller.play()}
          onPause={() => controller.pause()}
          onStepForward={() => controller.stepForward()}
          onStepBack={() => controller.stepBack()}
          onRestart={() => controller.restart()}
          onSeek={(index) => controller.seek(index)}
        />
      }
      announcer={
        <StepAnnouncer
          index={loaded ? snapshot.index : 0}
          total={loaded ? snapshot.trace.length : 0}
          narration={currentStep?.narration ?? ''}
        />
      }
    />
  )
}

export default App
