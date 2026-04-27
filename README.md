# Graph Lab Frontend

React + TypeScript + D3 frontend for creating graph inputs consumed by the backend Graph Builder and algorithm layer.

## Current Implementation Status

- Canonical graph state is centralized in a typed reducer (`GraphUI`-compatible output).
- Two modes are available and synchronized through one source of truth:
  - Visual editor (SVG canvas): add node, drag node, draft/create edge, delete node/edge.
  - Matrix input (adjacency): resize node count, edit matrix, apply to graph.
- `GraphUI` JSON contract preview is rendered live.
- Time-travel history now includes timeline scrubbing (`UNDO` / `REDO` / `JUMP_TO`) and visual diff ghosts.
- Visual editor includes Algorithm Cinema controls (BFS/DFS/Dijkstra/Prim/Kruskal/MaxFlow) with step playback.
- Query mini-language is available in-canvas: `path`, `neighbors`, `degree`, `components`.

## Project Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Main Frontend Modules

- `src/features/graph/model`: domain types and backend contract shape.
- `src/features/graph/state`: reducer, actions, context provider.
- `src/features/graph-editor/components`: D3-powered SVG interactions.
- `src/features/graph-editor/utils/algorithmCinema.ts`: frontend algorithm snapshot generators.
- `src/features/matrix/components`: adjacency matrix editor.
- `src/features/workspace/components`: toolbar, mode switching, contract panel.

## New Interaction Controls

- **History timeline:** use the scrubber below mode switch to jump any recorded mutation.
- **Algorithm Cinema:** build steps, then play/pause/step/rewind and scrub in the canvas panel.
- **Query mini-language:** run commands like `path 1 5`, `neighbors 3`, `degree 4`, `components`.

## GraphUI Contract

```ts
class GraphUI {
  nodes: number[]
  edges: Array<{ from: number; to: number; weight: number }>
  directed: boolean
  weighted: boolean
  positions?: Record<number, { x: number; y: number }>
}
```

The live output shown in the right panel is the exact payload expected downstream.
