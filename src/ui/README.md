# `src/ui/` — presentation layer

React components only. The UI **renders from `(trace, index)`** and never runs an algorithm: by the
time a trace is loaded, every control is index arithmetic, which is what makes step-back, scrubbing
and exact replay nearly free (`ADR-1`, `ADR-4`).

```
ui/
├── shell/          the fixed three-pane workspace frame
├── sidebar/        structure catalogue navigation
├── guide/          guided operation entry + validation feedback
├── panes/          structure view, pseudocode view, auxiliary-state view, complexity card
├── controls/       play / pause / step / scrub / restart
├── a11y/           ARIA live region that announces each step
└── ErrorBoundary.tsx   per-panel failure containment (ER13)
```

## Rules

- **One mutable value.** The step index lives in `app/controller.ts`; components receive it as a
  prop and call controller commands. No component keeps its own index or timer (`ADR-4`).
- **Same code path for mouse and keyboard.** Buttons and keyboard shortcuts must dispatch the same
  controller command, so the accessible path is the real path (`NFR-U2`).
- **Colour is never the only signal.** Every node state (undiscovered / frontier / current /
  visited) also carries a label or a shape, using the four Tailwind tokens in `src/index.css`
  (`NFR-U2`).
- **Panel failures stay local.** Each pane/panel sits behind `ErrorBoundary.tsx` so one bad render
  cannot take down the session (`ER13`).
