# Algorithm Cinema Backend Guide

This guide outlines how backend engineers must implement graph algorithms to interface with the Graph Lab **Algorithm Cinema** frontend feature. 

The frontend acts as a pure, dumb renderer. It performs no graph logic or diffing. It simply receives an array of complete step snapshots and renders them.

## 1. The Output Contract
Your algorithm must output an `AlgorithmCinemaPayload` JSON object. You can find the exact TypeScript types in `src/features/graph/model/algorithmContract.ts`.

```json
{
  "metadata": {
    "algorithm": "Dijkstra",
    "sourceNode": 1,
    "targetNode": 4,
    "graphSignature": "..."
  },
  "steps": [ ... ],
  "result": { ... }
}
```

## 2. Step-by-Step Snapshot Rule
Every item in the `steps` array must represent the **complete visual state of all nodes and edges** at that point in time. 
- You do **not** emit deltas or patches.
- If a node is `visited` in Step 3, it must remain `visited` in Step 4, Step 5, etc., unless its state changes explicitly.
- The frontend will directly map `state` enums (e.g., `visiting`, `frontier`) to SVG styles and animations.

### Example Node State inside a Step
```json
"nodes": {
  "1": { "id": 1, "state": "visited", "badge": "0" },
  "2": { "id": 2, "state": "visiting", "badge": "12" },
  "3": { "id": 3, "state": "frontier", "badge": "∞" }
}
```

### Example Edge State inside a Step
```json
"edges": {
  "e1": { "id": "e1", "state": "tree_edge" },
  "e2": { "id": "e2", "state": "examining", "badge": "4" }
}
```

## 3. Narration Rule
Every step requires a `narration` field. This is a human-readable English string describing what the algorithm is doing. 
- **Be conversational but precise.**
- **Use present tense.** (e.g., "Relaxing edge A→B")
- **Include mathematical context** where relevant. (e.g., "Current distance 12 + edge weight 4 = 16. This is better than the known distance of ∞, updating.")
- **State completion.** (e.g., "Node B has been fully explored and is marked visited.")

## 4. Valid Visual States
You must use these exact string enums:

**Nodes:** `idle`, `frontier`, `visiting`, `visited`, `in_path`, `rejected`, `source`, `target`, `mst_included`, `flow_source`, `flow_sink`.
**Edges:** `idle`, `examining`, `tree_edge`, `relaxed`, `mst_edge`, `rejected_edge`, `augmenting`, `saturated`, `flow_fill`.

## 5. Triggers for a New Step
A new step should be pushed to the `steps` array whenever there is a meaningful conceptual change that a student would want to see:
- Node added to a frontier (Queue, Stack, Priority Queue)
- Node popped from the frontier for processing
- Edge currently being evaluated
- Edge weight relaxation successful/failed
- Augmenting path found
- Algorithm complete

If no state changes visually or conceptually, do not emit a step.

## 6. Returning the Result
The final field `result` encodes the ultimate answer. It is a discriminated union based on what was solved:
- Shortest path: `{ type: 'path', pathNodes: [1,2,4], distance: 16 }`
- MST: `{ type: 'mst', edgeIds: ['e1', 'e4'], totalWeight: 32 }`
- Flow: `{ type: 'max_flow', maxFlow: 45 }`

The frontend uses this to render a summary panel upon playback completion.
