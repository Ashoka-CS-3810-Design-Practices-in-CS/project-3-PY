/**
 * Input validation — total, per-token, before construction (ADR-7).
 *
 * WHAT IT DOES
 *   Turns the raw input text into candidate tokens and classifies **every** one,
 *   returning a report: per-token accepted/rejected plus a reason. The accepted
 *   list is the only thing that ever reaches the algorithm.
 *
 * WHY THIS FILE EXISTS
 *   Separating validation from construction is what lets the engine assume
 *   well-typed input. It is also a UX decision: the report lists *all* malformed
 *   tokens, not just the first, so the learner fixes everything in one pass. It
 *   never silently repairs or drops input — a silent repair teaches the wrong
 *   thing.
 *
 * RULES
 *   No side effects, no React, D3 or DOM (ADR-2, NFR-M2). Deterministic: the same
 *   text always yields the same report (NFR-C2), so it is unit-testable in Node.
 */

export type TokenReport = {
  token: string
  status: 'accepted' | 'rejected'
  value?: string | number
  reason?: string
}

export type ValidationReport = {
  ok: boolean
  tokens: TokenReport[]
  accepted: (string | number)[]
}

const NUMBER = /^-?\d+(\.\d+)?$/
const WORD = /^[A-Za-z][A-Za-z0-9_]*$/

function tokenise(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

function classify(token: string): TokenReport {
  if (NUMBER.test(token))
    return { token, status: 'accepted', value: Number(token) }
  if (WORD.test(token)) return { token, status: 'accepted', value: token }
  return {
    token,
    status: 'rejected',
    reason: 'Not a number or a simple word (letters, digits and _ only).',
  }
}

function reportFrom(tokens: string[]): ValidationReport {
  const reports = tokens.map(classify)
  const accepted: (string | number)[] = []
  for (const report of reports) {
    if (report.status === 'accepted' && report.value !== undefined) {
      accepted.push(report.value)
    }
  }
  return {
    ok: reports.every((report) => report.status === 'accepted'),
    tokens: reports,
    accepted,
  }
}

/** A comma- or whitespace-separated list of values. An empty list is valid. */
export function validateValues(input: string): ValidationReport {
  return reportFrom(tokenise(input))
}

/** Exactly one value, and it is required. */
export function validateValue(input: string): ValidationReport {
  const tokens = tokenise(input)
  if (tokens.length === 0) {
    return {
      ok: false,
      tokens: [{ token: input, status: 'rejected', reason: 'Enter a value.' }],
      accepted: [],
    }
  }
  if (tokens.length > 1) {
    return {
      ok: false,
      tokens: tokens.map((token) => ({
        token,
        status: 'rejected' as const,
        reason: 'Enter a single value, not a list.',
      })),
      accepted: [],
    }
  }
  return reportFrom(tokens)
}
