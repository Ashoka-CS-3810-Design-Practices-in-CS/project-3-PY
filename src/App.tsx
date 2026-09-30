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
  listStructures,
} from './app/catalogue'
import {
  createPlaybackController,
  type PlaybackController,
} from './app/controller'
import {
  INSERT_AT_HEAD_OPERATION_ID,
  LIST_STRUCTURE_ID,
  runInsertAtHead,
} from './app/runOperation'
import { PHASE_LABEL } from './app/stateMachine'
import type { ValidationReport } from './app/validate'
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
 */

const DEFAULT_VALUES = '50, 30, 70'
const DEFAULT_INSERT = '45'

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
  const [valuesText, setValuesText] = useState(DEFAULT_VALUES)
  const [insertText, setInsertText] = useState(DEFAULT_INSERT)
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [selectedStructure, setSelectedStructure] = useState(LIST_STRUCTURE_ID)

  const visualise = useCallback(
    (values: string, insert: string) => {
      try {
        const outcome = runInsertAtHead(values, insert)
        setReport(outcome.report)
        if (outcome.ok) {
          controller.load(outcome.input)
        }
      } catch (error) {
        controller.fail(error instanceof Error ? error.message : String(error))
      }
    },
    [controller],
  )

  // Show something useful on first paint instead of an empty shell.
  const hasAutoRun = useRef(false)
  useEffect(() => {
    if (hasAutoRun.current) return
    hasAutoRun.current = true
    visualise(DEFAULT_VALUES, DEFAULT_INSERT)
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

  const meta = getOperationMeta(INSERT_AT_HEAD_OPERATION_ID)
  const listing = getPseudocode(
    meta?.pseudocodeId ?? INSERT_AT_HEAD_OPERATION_ID,
  )
  const currentStep = snapshot.trace[snapshot.index]
  const state = controller.getState()

  return (
    <WorkspaceShell
      phaseLabel={PHASE_LABEL[snapshot.phase]}
      error={snapshot.error}
      sidebar={
        <CatalogueSidebar
          entries={listStructures()}
          selectedId={selectedStructure}
          onSelect={setSelectedStructure}
        />
      }
      guide={
        <OperationGuide
          valuesText={valuesText}
          insertText={insertText}
          report={report}
          onValuesChange={setValuesText}
          onInsertChange={setInsertText}
          onVisualise={() => visualise(valuesText, insertText)}
        />
      }
      structure={<StructurePane state={state} step={currentStep} />}
      pseudocode={
        <PseudocodePane
          lines={listing?.lines ?? []}
          activeLine={currentStep?.codeLine ?? 0}
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
          meta={meta}
          summary={snapshot.summary}
          index={snapshot.index}
          total={snapshot.trace.length}
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
          index={snapshot.index}
          total={snapshot.trace.length}
          narration={currentStep?.narration ?? ''}
        />
      }
    />
  )
}

export default App
