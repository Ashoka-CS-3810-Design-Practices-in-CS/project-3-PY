import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

/**
 * Integration tests for the structures wired after the list slice: select a
 * structure, press Visualise, and watch the dataset get inserted one value at a
 * time before the selected operation runs. The list slice has its own test; this
 * file proves the pipeline, controller, renderers and phase-switching code panel
 * are reachable from the UI.
 */

/** Jump the scrubber to the last step; the controller clamps the value. */
function seekToEnd(): void {
  fireEvent.change(screen.getByLabelText('Scrub to a step'), {
    target: { value: '100000' },
  })
}

describe('App — non-list structures', () => {
  it('inserts a heap dataset one value at a time, then shows the dual view', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/Step 1 of 4\./)

    await user.click(
      screen.getByRole('button', { name: 'Priority queue (binary heap)' }),
    )
    await user.click(screen.getByRole('button', { name: 'Visualise' }))

    expect(await screen.findByText(/Step 1 of \d+\./)).toBeInTheDocument()
    // Step 1 is the build phase: the insert listing is the one highlighted (the
    // executing instruction), and the heap holds exactly the first value inserted.
    expect(
      screen.getByText(/Pseudocode · Insert \(sift-up\)/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /heap with 1 entr/ }),
    ).toBeInTheDocument()

    // By the end of the build the same heap holds all 16 values, in both views.
    seekToEnd()
    expect(
      screen.getByRole('img', { name: /heap with 16 entr/ }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/heap array \(index = tree slot\)/).length,
    ).toBeGreaterThan(0)
  })

  it('loads the pre-built BST, then runs inorder over it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/Step 1 of 4\./)

    await user.click(screen.getByRole('button', { name: 'Binary search tree' }))
    await user.click(screen.getByRole('button', { name: 'Inorder traversal' }))
    await user.click(screen.getByRole('button', { name: 'Visualise' }))

    expect(await screen.findByText(/Step 1 of \d+\./)).toBeInTheDocument()
    // Visualise loads the finished tree and the traversal listing; there is no
    // insert-by-insert build phase to step through first.
    expect(
      screen.getByText(/Pseudocode · Inorder traversal/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /Binary search tree with 17 node/ }),
    ).toBeInTheDocument()
    // The auxiliary pane exposes the growing traversal output.
    expect(screen.getByText('output')).toBeInTheDocument()

    seekToEnd()
    expect(
      screen.getByText(/Pseudocode · Inorder traversal/),
    ).toBeInTheDocument()
    const pane = screen.getByLabelText('Pseudocode')
    expect(pane.textContent).toContain('function inorder')
  })

  it('loads the pre-built BST before searching', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/Step 1 of 4\./)

    await user.click(screen.getByRole('button', { name: 'Binary search tree' }))
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await user.click(screen.getByRole('button', { name: 'Visualise' }))

    expect(await screen.findByText(/Step 1 of \d+\./)).toBeInTheDocument()
    // Search starts against the already-built tree, so its own listing is shown
    // from the first step — no insert-by-insert phase first.
    expect(screen.getByText(/Pseudocode · Search/)).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /Binary search tree with 17 node/ }),
    ).toBeInTheDocument()
  })

  it('loads the pre-drawn graph, then shows the BFS frontier', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/Step 1 of 4\./)

    await user.click(screen.getByRole('button', { name: 'Graph' }))
    await user.click(screen.getByRole('button', { name: 'Visualise' }))

    expect(await screen.findByText(/Step 1 of \d+\./)).toBeInTheDocument()
    // The complete graph is already drawn when the traversal starts.
    expect(
      screen.getByText(/Pseudocode · Breadth-first search/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /Graph with 16 vertices/ }),
    ).toBeInTheDocument()

    seekToEnd()
    expect(
      screen.getByText(/Pseudocode · Breadth-first search/),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/queue \(front first\)/).length).toBeGreaterThan(
      0,
    )
  })

  it('reports a duplicate BST key as skipped, not as a failure', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/Step 1 of 4\./)

    await user.click(screen.getByRole('button', { name: 'Binary search tree' }))
    const keys = screen.getByLabelText(/Initial keys/)
    await user.clear(keys)
    await user.type(keys, '10, 5, 10')
    await user.click(screen.getByRole('button', { name: 'Visualise' }))

    // ER4: the duplicate is advisory, so the run still happens…
    expect(await screen.findByText('skipped')).toBeInTheDocument()
    expect(
      screen.getByText(/duplicate; duplicates are not inserted/),
    ).toBeInTheDocument()
    // …and the trace is live (the run was not blocked).
    expect(screen.getByText(/Step \d+ of \d+\./)).toBeInTheDocument()
  })
})
