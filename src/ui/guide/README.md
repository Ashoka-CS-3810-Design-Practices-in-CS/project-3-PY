# `src/ui/guide/`

Guided entry for the selected operation: preset datasets, a free-text field for custom values, and
the **validation report**. Validation is total and happens *before* anything is built or run — the
algorithm is only ever reachable through validated values (`ADR-7`, `FR6`).

Expected files:

- `OperationGuide.tsx` — operation picker + input form for the current structure.
- `ValidationReport.tsx` — lists **every** malformed token with a specific reason, not just the
  first one (`FR6`, `ER1`–`ER3`). It must never silently repair input.
- `PresetPicker.tsx` — loads a `data/presets/*.json` dataset into the field.
