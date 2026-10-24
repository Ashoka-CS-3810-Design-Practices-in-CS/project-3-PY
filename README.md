# Project 3 — Interactive Data Structure and Algorithms Visualizer

An interactive, browser-based visualiser for the five graded data structures — linked lists,
stacks, priority queues, trees, and graphs — with step-by-step algorithm execution,
synchronised pseudocode, live auxiliary state, and complexity information.

Built for **CS-3810: Design Practices in Computer Science**, Assignments 1 and 2 / Project 3,
Department of Computer Science, Ashoka University.

> **Status:** scaffold in place, feature implementation not yet started. The repository holds this
> README, the assignment resources, the engineering setup guide, and the Vite + React + TypeScript
> scaffold it describes — Tailwind v4, the D3 submodules, TypeScript strict mode, the Vitest
> suites, the import-boundary lint rule and CI. The setup guide, including the rationale for each
> choice, is [`ProjectResources/SETUP.md`](ProjectResources/SETUP.md).

> **Design authority.** The design and analysis live in the Assignment 1 and Assignment 2
> documents under [`ProjectResources/`](ProjectResources). Where this README and those
> documents disagree, **Assignment 2 wins**: it is the graded technical design and this README
> is a summary of it. Assignment 2 also supersedes Assignment 1 on two points that changed —
> the graded structure set, and the module layout. Both are reflected below.

---

## Table of contents

- [The problem](#the-problem)
- [Features](#features)
- [Architecture](#architecture)
- [The trace contract](#the-trace-contract)
- [Data structures and operations](#data-structures-and-operations)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Testing](#testing)
- [Accessibility](#accessibility)
- [Performance budgets](#performance-budgets)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Planned project layout](#planned-project-layout)
- [Team](#team)

---

## The problem

Data structure courses teach algorithms as static pseudocode, so learners must mentally
simulate the state transitions. That mental simulation is where most misunderstandings
originate: *which* pointer is being followed, what is currently on the stack or in the
priority queue, and how the structure changes after each step.

This tool makes those intermediate states observable. A learner picks a structure and an
operation, supplies values, and then scrubs through the operation one step at a time with
the structure view, the pseudocode panel, and the auxiliary-state panel kept in sync —
exactly the state a textbook figure cannot show.

It is intended for undergraduate students encountering these structures for the first time,
and for instructors demonstrating them on a projector during a lecture.

## Features

| Area | What it does |
| --- | --- |
| Structure catalogue | Persistent sidebar covering linked lists, stacks, priority queues, trees, and graphs, with a description, supported operations, and a complexity summary for each |
| Operation workspace | Guided entry for each operation, with preset datasets and custom value entry |
| Total validation | Every malformed token is reported with a specific reason, not just the first one; the engine is only reachable by validated values |
| Trace generation | Every operation emits an immutable, replayable `Step[]` before playback begins |
| Three synchronised panes | Structure view, pseudocode view with line highlighting, and auxiliary-state view, all pure functions of the same step index |
| Auxiliary state panel | Shows the array, stack, queue, heap, visited set, or call-stack frames appropriate to the current step, one panel component per `aux.kind` |
| Complexity panel | Theoretical bound shown next to the observed step count, so a degenerate-BST preset actually teaches something |
| Playback control | Play, pause, step forward, step back, scrub, restart, and exact replay of any step |
| Graph traversal | BFS and DFS visualised step by step with frontier and visited colouring |
| Traversals | Preorder, inorder, postorder and level-order over the same tree, so the three depth-first orders differ only in where the visit line sits |
| Priority queue | Binary min-heap rendered simultaneously as an indexed array and as a complete binary tree, so the `O(n)` build-heap and the `O(n log n)` of n successive inserts can be compared on one input |
| Accessibility | WCAG 2.1 AA, full keyboard operation, ARIA live-region step announcements, and `prefers-reduced-motion` support |

## Architecture

The brief requires the algorithm logic to be separable from the animation and the UI. This
is achieved by making an operation produce a data structure — a **trace** — which the
interface merely replays. Dependencies point one way only, and the rule is enforced
mechanically by an import-boundary lint rule rather than by convention.

```
Layer 4 — Presentation        React components, sidebar and catalogue, operation
                              workspace, three-pane layout, playback controls.
                              Renders only from (trace, index).
            ↑ depends on
Layer 3 — Rendering           Structure-specific SVG renderers (list, stack, heap,
                              tree, graph) plus layout mathematics (hierarchy
                              layout, force layout, scales). Geometry only.
            ↑ depends on
Layer 2 — Session/playback    Input validation, structure catalogue and complexity
                              metadata, trace storage, playback state machine,
                              checkpointing, Web Worker client.
            ↑ depends on
Layer 1 — Domain core         Structure models and instrumented operation
                              generators that emit steps. Pure functions; no imports
                              from React, D3, or the DOM.
```

> Assignment 2 §5.1 realises these four layers as **six module groups**, splitting rendering
> geometry out of the presentation layer — because it is the one place where a visualisation
> library could otherwise leak a second source of truth. The layer-to-directory mapping is
> fixed by A2 `Table 5` / `Listing 18` and is reproduced under
> [Planned project layout](#planned-project-layout).

Two consequences of this direction of dependency:

- **Layer 1 runs and is tested with no browser present.** The algorithm core imports
  nothing from React or D3, so its tests are plain Node tests with no DOM.
- **Layer 2 is the only layer that knows about time**, and Layer 4 is the only layer that
  knows about the DOM. Animation cannot leak into the algorithm because the animation is
  not expressed there.

**The rule for D3: D3 computes, React renders.** D3 owns layout mathematics and scales, not
the DOM. `d3-hierarchy`, `d3-force`, `d3-scale`, `d3-shape`, and `d3-interpolate` are used;
`d3-selection` is not used for the main visualisation, and D3 owns the DOM only inside
isolated leaves such as an axis. Letting D3 own the SVG while React owns the step index
would create two sources of truth and stale elements when stepping backwards — and the
animation is the graded output here.

## The trace contract

The central design decision is that an operation is a **generator of states**, not a
mutation of a live object graph. Every point at which a learner could ask *"what is
happening now?"* emits one step. A step is an immutable, fully serialisable record
(A2 `Listing 17`):

```ts
type Step = {
  index:     number;                 // position in the trace, 0-based
  operation: string;                 // matches OperationMeta.id
  codeLine: number;                  // line of the operation's pseudocode executing
  narration: string;                 // one plain-English sentence for this step
  highlight: { nodes: NodeId[]; active?: NodeId; edges: TraceEdge[] };
  delta:     StructureDelta;         // created / linked / unlinked / updated
  aux?:      AuxState;               // absent when there is no auxiliary container
};

type StructureDelta = {
  created?:  TraceNode[];            // ids and values of new nodes
  linked?:   TraceEdge[];            // parent/child, next, or heap index edits
  unlinked?: TraceEdge[];
  updated?:  { id: NodeId; from: unknown; to: unknown }[];   // node values and @fields
};

type AuxState = {
  kind: "array" | "stack" | "queue" | "heap" | "visited" | "recursion";
  values?: (string | number)[];
  visited?: NodeId[];
  frames?: number[];                 // recursion depth per frame
  comparisons?: number;              // running model charge
};
```

> **Frozen (v1).** Two rules settled at freeze time: a structure *pointer* is a reserved
> field id beginning with `@` (`@head` today), so it can never be confused with a node id;
> and `aux` is optional, because a linked-list insert has no auxiliary container at all.
> Changing this shape is now a deliberate, visible event — see
> [`ProjectResources/ADR-8-step-contract-freeze.md`](ProjectResources/ADR-8-step-contract-freeze.md).

Because a step is immutable and self-describing, the three synchronised views are all pure
functions of the same value:

```
structureView = f(structure at index)
codeView      = g(step[index].codeLine)
auxView       = h(step[index].aux)
```

There is no second source of truth, and no animation state lives inside the algorithm. The
session layer owns a single integer — the current step index — and that one decision is
what makes play, pause, step, scrub, and exact replay nearly free. Re-running the algorithm
to reach step 7 would work for forward stepping and break the moment a user scrubs or steps
backwards.

Serialisability is deliberate: the same trace can travel through a Web Worker, be stored
as a test fixture, and be rendered by React. Two consequences are worth noting. The stored
trace is a **delta log with periodic checkpoints**, not a snapshot per step, so displaying
any index costs `O(k)` for a checkpoint interval `k` rather than `O(index)`. And `aux` is
stored as a change per step rather than a full copy, because a BFS frontier can hold `O(V)`
entries.

## Data structures and operations

Each structure uses the internal representation a textbook would use, so that the animation
reflects the real cost model rather than convenient bookkeeping.

| Structure | Representation | Cost shown to the learner |
| --- | --- | --- |
| Linked list | Node objects `{ id, value, next }` with a `head` reference; pointer ids are stable across steps so nodes animate rather than being recreated | Search `O(n)`; insert at head `O(1)`; insert at tail `O(1)` with a tail pointer; insert at position `k`, `O(k)`; delete `O(n)` unless the predecessor is known |
| Stack | Abstract LIFO with `push`/`pop`/`peek`; array-backed instance with an explicit `top` index, plus an optional linked-list-backed variant | `push`/`pop`/`peek` amortised `O(1)` array-backed (occasional `O(n)` resize, which is mentioned rather than hidden); worst-case `O(1)` linked-list-backed |
| Priority queue | Binary min-heap in a single array with implicit parent/child indices — no node objects and no pointers, so the array *is* the tree | `peek-min` `O(1)`; `insert` (sift-up) `O(log n)`; `extract-min` (sift-down) `O(log n)`; `build-heap` `O(n)`; space `O(n)` |
| Tree (BST) | Recursive nodes `{ id, value, left, right }`; an optional parent reference is used only by algorithms that need it, never by the renderer | Search, insert, delete `O(h)` where `h` is the height — `O(log n)` balanced, `O(n)` worst case; traversals `O(n)`; delete decomposed into its three standard cases, each shown separately |
| Graph | Adjacency list `Map<vertexId, Array<{ to, weight? }>>`, with vertex objects carrying a value and a layout position that is view state and never read by an algorithm | Space `O(V+E)`; BFS and DFS `O(V+E)`; edge existence check is `O(deg v)` rather than `O(1)`, stated explicitly as the trade-off against a matrix |
| Trace | Immutable `Step[]` produced by every operation, held by the session layer and never by a structure model | Rendering is `O(1)` per step, because no algorithm runs during playback |

> **The FIFO queue is a supporting structure, not a catalogue entry** (A2 `ADR-5`, §4.6). It
> has not disappeared: it is still the frontier of BFS and of level-order traversal, and its
> live contents are rendered by the same auxiliary panel under `aux.kind = "queue"`. It is
> implemented as a circular buffer — array plus `head`, `tail` and `count` with wraparound
> indices — giving `O(1)` worst-case enqueue and dequeue. The `Array.shift()` variant is kept
> only as a comparison preset and shown as `O(n)` per dequeue, because that mistake is common
> enough to be worth teaching.

Complexity is **data, not prose scattered through the interface**. Every catalogue entry
carries a record per operation, so the same object supplies the menu label, the guide text,
the pseudocode identifier, and the complexity card — a bound cannot attach itself to the
wrong operation, and a missing bound is a visible content gap rather than a silent omission
(A2 `Listing 16`):

```ts
type OperationMeta = {
  id: string;                      // "insert" | "extract-min" | "inorder" | "bfs" | ...
  label: string;                   // shown in the operation menu and the guide
  pseudocodeId: string;            // key of the authored listing and its line map
  best: string;                    // e.g. "O(log n)"
  average: string;
  worst: string;
  space: string;                   // auxiliary space, not total
  assumptions: string[];           // e.g. "h = height; O(log n) only if balanced"
  notes?: string;                  // e.g. "amortised", "only for unweighted graphs"
};
```

`pseudocodeId` is what ties the catalogue to the single authored pseudocode listing, so the
highlighted line and the displayed bound cannot drift apart.

## Tech stack

| Concern | Choice |
| --- | --- |
| Language | TypeScript (strict mode) |
| UI | React |
| Visualisation | D3 submodules — `d3-hierarchy`, `d3-force`, `d3-scale`, `d3-shape`, `d3-interpolate` |
| Styling | Tailwind CSS, with one design-token palette for node states |
| Build | Vite |
| State | One reducer or a small store, holding **only** the step index and the loaded trace — the algorithm core stays out of the store. Redux and other large stores are rejected: there is exactly one mutable value, and a heavy store risks putting algorithm state in the UI |
| Offloading | Web Worker for trace generation above ~200 elements |
| Testing | Vitest, running the algorithm core in Node with no DOM; `fast-check` for property tests; one Playwright walkthrough |
| Quality | ESLint + Prettier, with an import-boundary rule enforcing the layering |

TypeScript is not cargo-culted here: the `Step` record is the interface between two people
working in parallel against a schema that will change weekly. Types catch the breakage at
compile time instead of as a silently missing panel mid-demo.

## Getting started

### Prerequisites

- Node.js 20 or later
- npm, pnpm, or yarn

### Setup

The full setup — scaffolding the Vite project into this repository, Tailwind v4, the D3
submodules, TypeScript strict mode, the import-boundary lint rule, and CI — is documented
with its rationale in [`ProjectResources/SETUP.md`](ProjectResources/SETUP.md). That guide
also records the traps worth knowing about, in particular that scaffolding with `create-vite`
directly in this directory will overwrite this README and `.gitignore`.

Once the scaffold is in place:

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open the printed local URL (http://localhost:5173 by default)
```

### Production build

```bash
npm run build     # type-check and build to dist/
npm run preview   # serve dist/ locally to verify the production build
```

There is no backend and no installation step for the end user: the app is deployed as
static files.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot module replacement |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc -b --noEmit` — types only, no output |
| `npm run test` | Run the Vitest suite |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:core` | Run only the DOM-free algorithm-core suite — the check that the layering still holds |
| `npm run test:coverage` | Run tests with a coverage report; `src/core/**` is held to 90% lines |
| `npm run lint` | Run ESLint, including the import-boundary rule |
| `npm run format` | Format sources with Prettier |

## Testing

- The algorithm core is tested in Node with **no DOM**, because Layer 1 is pure. If a core
  test ever needs a DOM to pass, the layering has already been broken.
- Every operation is checked against an **independent reference implementation**: the
  structure reconstructed from a trace must equal the reference result for all generated
  cases, including randomised property-based tests.
- **Golden-trace snapshot tests** enforce determinism: the same `(structure, operation,
  dataset)` triple must always produce a byte-identical trace. Determinism is what makes
  exact replay of any step possible.
- Structural invariants — BST ordering, LIFO for stacks, FIFO for queues, the min-heap
  property at every parent/child index pair, acyclic parent links in trees, no self-loops in
  graphs — are asserted at **every step** of **every** trace.
- Target: at least 90% line coverage on the algorithm core. Presentational components are
  excluded from that target.

Screenshot testing is deliberately avoided: the visual output is expected to change often,
whereas a golden trace is a readable diff. The trace is the stable regression artefact.

## Accessibility

Targeting **WCAG 2.1 AA**:

- Text contrast of at least 4.5:1.
- Every control reachable and operable by keyboard.
- Step changes announced through an ARIA live region.
- **Colour is never the sole carrier of meaning** — each node state also carries a label or
  a shape. This is both an accessibility requirement and a practical one: it survives a
  washed-out projector.
- `prefers-reduced-motion` replaces interpolated motion with instantaneous steps.
- Node states are derived from the algorithm's own variables — undiscovered, frontier,
  current, visited — so a colouring bug is a correctness bug rather than a cosmetic one.

## Performance budgets

| Target | Budget |
| --- | --- |
| First contentful paint | < 2.0 s |
| Time to interactive | < 3.0 s |
| Initial JS payload | < 500 KB gzipped (requires importing D3 submodules, not the whole bundle) |
| Control feedback (play, pause, step, restart) | < 100 ms |
| Animation | ≥ 50 fps (target 60 fps) at n ≤ 100 |
| Trace generation | < 200 ms for n ≤ 200; above that, off the main thread with no task > 50 ms |
| Peak trace memory | < 64 MB at n = 200 |

Documented input caps keep those numbers meaningful: **100 elements** for linear
structures and **200 nodes** for trees and graphs. Beyond a cap the view switches to a
scrollable or pan-and-zoom mode and states the cap explicitly rather than degrading
silently. Token count, step count, and trace size are hard-capped so no input can exhaust
memory or CPU, and the worker is terminated on reset so no background computation outlives
a session.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `←` / `→` | Step backward / forward |
| `R` | Restart |

Keyboard handlers map onto exactly the same controller commands as the buttons, so the
accessible path is the same code path rather than a parallel one.

## Planned project layout

The layout is fixed by Assignment 2 `Table 5` and `Listing 18`. Each directory *is* a layer,
and the import-boundary lint rule is written against exactly these paths — so adding a new
top-level directory under `src/` is an architectural change that needs a matching entry in
the lint configuration, not just a new folder.

```
project-3-PY/
├── ProjectResources/       # Assignment 1 and 2 documents, and the setup guide
├── src/
│   ├── core/               # Layers 1-2: no UI imports, no DOM, no timers
│   │   ├── model/          #   linkedList.ts  stack.ts  binaryHeap.ts  bst.ts  graph.ts
│   │   ├── trace/          #   step.ts (the contract)  store.ts (delta log + checkpoints)
│   │   └── operations/     #   one generator per operation, each emitting Step[]
│   │       ├── list/       #     insertAtHead.ts insertAt.ts deleteByValue.ts reverse.ts
│   │       ├── stack/      #     push.ts pop.ts
│   │       ├── heap/       #     insert.ts extractMin.ts buildHeap.ts
│   │       ├── bst/        #     insert.ts delete.ts search.ts
│   │       ├── traverse/   #     preorder.ts inorder.ts postorder.ts levelOrder.ts
│   │       └── graph/      #     bfs.ts dfs.ts
│   ├── app/                # Layer 3: session controller, state machine, validation,
│   │                       #   catalogue, trace store, Web Worker client, routing
│   ├── render/             # Layer 4: geometry only
│   │   ├── renderers/      #   list.tsx stack.tsx heap.tsx tree.tsx graph.tsx
│   │   └── layout/         #   hierarchy.ts force.ts scales.ts
│   ├── ui/                 # Layer 5: presentation
│   │   └── shell/ sidebar/ guide/ panes/ controls/ a11y/ ErrorBoundary.tsx
│   └── data/               # Static, versioned
│       └── catalogue.ts presets/*.json golden/*.json
├── tests/
│   ├── core/               # Pure unit + property tests, no DOM
│   ├── golden/             # Trace snapshot tests
│   └── e2e/                # One Playwright walkthrough
├── public/
└── index.html
```

Two placements are easy to get wrong and both are deliberate:

- **Layout data belongs in `render/`, never in `core/model/`.** Vertex positions and node
  coordinates are view state; an algorithm must never read them, or a layout change could
  alter a traversal result and break determinism.
- **`Step`, `StructureDelta` and `AuxState` live in one module**, `core/trace/step.ts`,
  imported by everyone. A duplicated trace type is how the generator and the renderer drift
  apart silently — which is exactly the failure the types exist to prevent.

## Team

| Name | Roll number |
| --- | --- |
| Papaa Dennis Morindat | 1020241748 |
| Yididiya Megenta | 1020241852 |

**Team name:** PY
