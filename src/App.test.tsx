import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

/**
 * Integration test for the visible slice: text in → trace → step through it.
 *
 * This runs in jsdom because it drives real React components. The algorithm core
 * is still tested with no DOM (`npm run test:core`); this test is about the wiring.
 */

describe('App — linked list · insert at head', () => {
  it('auto-loads a run and steps through it', async () => {
    const user = userEvent.setup()
    render(<App />)

    // The default run ([50, 30, 70] + 45) auto-loads as a 4-step trace.
    expect(await screen.findByText(/Step 1 of 4\./)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next step' }))
    expect(screen.getByText(/Step 2 of 4\./)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(screen.getByText(/Step 1 of 4\./)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Restart' }))
    expect(screen.getByText(/Step 1 of 4\./)).toBeInTheDocument()
  })

  it('highlights the pseudocode line for the current step', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/Step 1 of 4\./)

    const pane = screen.getByLabelText('Pseudocode')
    // Step 1 = "node ← new Node(value)".
    expect(pane.querySelector('[aria-current="step"]')?.textContent).toContain(
      'new Node(value)',
    )

    await user.click(screen.getByRole('button', { name: 'Next step' }))
    expect(pane.querySelector('[aria-current="step"]')?.textContent).toContain(
      'node.next ← head',
    )
  })

  it('reports a rejected token and does not run the operation', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/Step 1 of 4\./)

    const insert = screen.getByLabelText(/Value to insert at the head/)
    await user.clear(insert)
    await user.type(insert, '12a')
    await user.click(screen.getByRole('button', { name: 'Visualise' }))

    expect(
      await screen.findByText(/Not a number or a simple word/),
    ).toBeInTheDocument()
    // Still the old trace: validation happens before anything is built (ADR-7).
    expect(screen.getByText(/Step 1 of 4\./)).toBeInTheDocument()
  })
})
