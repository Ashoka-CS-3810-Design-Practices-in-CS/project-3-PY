# `src/data/presets/`

Example datasets, one JSON file per teaching case, loaded into the guide's input field.

Naming convention: `<structure>-<case>.json`, chosen so the case *teaches* something rather than
just filling the field. Planned examples:

- `bst-degenerate.json` — sorted input, producing a height-`n` (linked-list-shaped) BST, so the
  `O(n)` worst case is visible next to the `O(log n)` average.
- `heap-build-vs-insert.json` — one array built with `buildHeap` (`O(n)`) and the same array built
  by repeated `insert` (`O(n log n)`), for comparison on one input.
- `graph-bfs-dfs.json` — a graph whose BFS and DFS orders differ clearly.
- `list-reverse.json` — a small list for the reverse operation.

Keep each file small and readable; these are teaching inputs, not stress tests. Input caps are
100 elements for linear structures and 200 nodes for trees/graphs.
