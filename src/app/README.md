# `src/app/` — core application logic (layer 3)

The layer that knows about **time and workflow**: the session controller, the
playback state machine, validation, the catalogue accessor, the request pipeline,
and (later) the Web Worker client and router. It holds the app's single mutable
value — the step index — and its single timer (`ADR-4`).

```
app/
├── controller.ts     the PlaybackController: one index, one timer, subscribe/getSnapshot
├── stateMachine.ts   the phases IDLE → READY → PLAYING ⇄ PAUSED → FINISHED (ERROR)
├── validate.ts       total, per-token validation before construction (ADR-7)
├── runOperation.ts   the pipeline: validate → build → execute → LoadInput
├── catalogue.ts      typed lookups over data/catalogue.ts
├── workerClient.ts   main-thread side of the worker boundary (not in this slice)
├── worker.ts         worker entry point (not in this slice)
└── routes.ts         tiny catalogue router (not in this slice)
```

## Rules

- **One mutable value, one timer.** They live here and nowhere else; the UI reads
  a snapshot and calls commands. This is what makes every pane a pure function of
  `(trace, index)`.
- **No React, no D3, no DOM.** This layer must be unit-testable in Node. The
  controller is framework-agnostic on purpose: React only subscribes to it.
- **No algorithms.** Generation is *requested* here and executed in
  `core/operations/`; validation and construction are orchestrated here but
  implemented below.

## Why `runOperation.ts` exists

The pipeline (parse → validate → build → execute) is application workflow, not
presentation. Putting it here keeps the entry file a composition root, and keeps
the rule that `ui/` and the entry must not import the algorithm layer directly
(A2 Table 5).
