# Project 3 — Interactive Data Structure and Algorithms Visualizer

An interactive, browser-based visualiser for the five core data structures — linked lists,
stacks, queues, trees, and graphs — with step-by-step algorithm execution, synchronised
pseudocode, live auxiliary state, and complexity information.

Built for **CS-3810: Design Practices in Computer Science**, Assignment 1 / Project 3,
Department of Computer Science, Ashoka University.

> **Status:** implementation not yet started. The repository currently contains the project
> scaffolding documents only. The design and analysis are complete and are recorded in the
> separately submitted Assignment 1 design document.

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
queue, and how the structure changes after each step.

This tool makes those intermediate states observable. A learner picks a structure and an
operation, supplies values, and then scrubs through the operation one step at a time with
the structure view, the pseudocode panel, and the auxiliary-state panel kept in sync —
exactly the state a textbook figure cannot show.

It is intended for undergraduate students encountering these structures for the first time,
and for instructors demonstrating them on a projector during a lecture.

## Features

| Area | What it does |
| --- | --- |
| Structure catalogue | Persistent sidebar covering linked lists, stacks, queues, trees, and graphs, with a description, supported operations, and a complexity summary for each |
| Operation workspace | Guided entry for each operation, with preset datasets and custom value entry |
| Total validation | Every malformed token is reported with a specific reason, not just the first one; the engine is only reachable by validated values |
| Trace generation | Every operation emits an immutable, replayable `Step[]` before playback begins |
| Three synchronised panes | Structure view, pseudocode view with line highlighting, and auxiliary-state view, all pure functions of the same step index |
| Auxiliary state panel | Shows the array, stack, queue, frontier, visited set, or call stack appropriate to the current step |
| Complexity panel | Theoretical bound shown next to the observed step count, so a degenerate-BST preset actually teaches something |
| Playback control | Play, pause, step forward, step back, scrub, restart, and exact replay of any step |
| Graph traversal | BFS and DFS visualised step by step with frontier and visited colouring |
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
Layer 3 — Rendering           Structure-specific SVG renderers (list, stack, queue,
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
happening now?"* emits one step. A step is an immutable, fully serialisable record:

```ts
type Step = {
  index: number;                 // position in the trace, 0-based
  operation: "insert" | "delete" | "search" | "inorder" | "bfs" | ...;
  codeLine: number;              // line of the operation's pseudocode being executed
  narration: string;             // one plain-English sentence for this step
  highlight: {                   // what the viewer should emphasise
    nodes: string[];             // node ids: being compared
    active?: string;             // node id: currently visiting
    edges: string[];             // edge ids: being traversed
  };
  delta: StructureDelta;         // what changed in the structure at this step
  aux: AuxState;                 // array/stack/queue/frontier/visited/recursion
};
```

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
as a test fixture, and be rendered by React.

## Data structures and operations

Each structure uses the internal representation a textbook would use, so that the animation
reflects the real cost model rather than convenient bookkeeping.

| Structure | Representation | Cost shown to the learner |
| --- | --- | --- |
| Linked list | Node objects `{ id, value, next }` with a `head` reference; pointer ids are stable across steps so nodes animate rather than being recreated | Search `O(n)`; insert at head `O(1)`; insert at tail `O(1)` with a tail pointer; insert at position `k`, `O(k)`; delete `O(n)` unless the predecessor is known |
| Stack | Abstract LIFO with `push`/`pop`/`peek`; array-backed instance with an explicit `top` index, plus an optional linked-list-backed variant | `push`/`pop`/`peek` amortised `O(1)` array-backed (occasional `O(n)` resize, which is mentioned rather than hidden); worst-case `O(1)` linked-list-backed |
| Queue | Circular buffer: fixed array plus `head`, `tail`, and `count` with wraparound indices | Enqueue `O(1)`; dequeue `O(1)`; `front` `O(1)`; the shift-based variant is included as a comparison preset and shown as `O(n)` per dequeue |
| Tree (BST) | Recursive nodes `{ id, value, left, right }`; an optional parent reference is used only by algorithms that need it, never by the renderer | Search, insert, delete `O(h)` where `h` is the height — `O(log n)` balanced, `O(n)` worst case; traversals `O(n)`; delete decomposed into its three standard cases, each shown separately |
| Graph | Adjacency list `Map<vertexId, Array<{ to, weight? }>>`, with vertex objects carrying a value and a layout position that is view state and never read by an algorithm | Space `O(V+E)`; BFS and DFS `O(V+E)`; edge existence check is `O(deg v)` rather than `O(1)`, stated explicitly as the trade-off against a matrix |
| Trace | Immutable `Step[]` produced by every operation, held by the session layer and never by a structure model | Rendering is `O(1)` per step, because no algorithm runs during playback |

Complexity is **data, not prose scattered through the interface**. Every catalogue entry
carries a record per operation, so the same object supplies the menu label, the explanation
panel, and the complexity card — a bound cannot attach itself to the wrong operation, and a
missing bound is a visible content gap rather than a silent omission.

```ts
type OperationMeta = {
  id: "insert" | "delete" | "search" | "traversal" | ...;
  label: string;                   // shown in the operation menu
  best: string; average: string; worst: string;   // e.g. "O(log n)", "O(n)"
  space: string;                   // auxiliary space, not total
  assumptions: string[];           // e.g. "h = height; O(log n) requires balance"
  notes?: string;                  // e.g. "amortised", "only for unweighted graphs"
};
```

## Tech stack

| Concern | Choice |
| --- | --- |
| Language | TypeScript (strict mode) |
| UI | React |
| Visualisation | D3 submodules — `d3-hierarchy`, `d3-force`, `d3-scale`, `d3-shape`, `d3-interpolate` |
| Styling | Tailwind CSS, with one design-token palette for node states |
| Build | Vite |
| State | A reducer or Zustand, holding **only** the step index — the algorithm core stays out of the store |
| Offloading | Web Worker for trace generation above ~200 elements |
| Testing | Vitest, running the algorithm core in Node with no DOM |
| Quality | ESLint + Prettier, with an import-boundary rule enforcing the layering |

TypeScript is not cargo-culted here: the `Step` record is the interface between two people
working in parallel against a schema that will change weekly. Types catch the breakage at
compile time instead of as a silently missing panel mid-demo.

## Getting started

### Prerequisites

- Node.js 20 or later
- npm, pnpm, or yarn

### Setup

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
| `npm run test` | Run the Vitest suite |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run lint` | Run ESLint, including the import-boundary rule |
| `npm run format` | Format sources with Prettier |

*(Script names follow Vite conventions; adjust to match `package.json` once the build is
scaffolded.)*

## Testing

- The algorithm core is tested in Node with **no DOM**, because Layer 1 is pure.
- Every operation is checked against an **independent reference implementation**: the
  structure reconstructed from a trace must equal the reference result for all generated
  cases, including randomised property-based tests.
- **Golden-trace snapshot tests** enforce determinism: the same `(structure, operation,
  dataset)` triple must always produce a byte-identical trace. Determinism is what makes
  exact replay of any step possible.
- Structural invariants — BST ordering, LIFO for stacks, FIFO for queues, acyclic parent
  links in trees, no self-loops in graphs — are asserted at **every step** of **every**
  trace.
- Target: at least 90% line coverage on the algorithm core. Presentational components are
  excluded from that target.

## Accessibility

Targeting **WCAG 2.1 AA**:

- Text contrast of at least 4.5:1.
- Every control reachable and operable by keyboard.
- Step changes announced through an ARIA live region.
- **Colour is never the sole carrier of meaning** — each node state also carries a label or
  a shape. This is both an accessibility requirement and a practical one: it survives a
  washed-out projector.
- `prefers-reduced-motion` replaces interpolated motion with instantaneous steps.

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

## Planned project layout

The repository is currently empty; the structure below follows the four layers described in
the design document and will be populated as the implementation proceeds.

```
project-3-PY/
├── src/
│   ├── core/           # Layer 1 — structures and instrumented operation generators (pure)
│   ├── session/        # Layer 2 — validation, catalogue, playback state machine, worker client
│   ├── render/         # Layer 3 — SVG renderers and layout mathematics
│   ├── components/     # Layer 4 — React components, three-pane workspace, controls
│   └── types/          # Shared trace contract types
├── tests/              # Vitest suites; golden traces as fixtures
├── public/
└── index.html
```

## Team

| Name | Roll number |
| --- | --- |
| Papaa Dennis Morindat | 1020241748 |
| Yididiya Megenta | 1020241852 |

**Team name:** PY
