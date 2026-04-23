# Graph Lab Frontend

React + TypeScript + D3 frontend for creating graph inputs consumed by the backend Graph Builder and algorithm layer.

## Current Implementation Status

- Canonical graph state is centralized in a typed reducer (`GraphUI`-compatible output).
- Two modes are available and synchronized through one source of truth:
  - Visual editor (SVG canvas): add node, drag node, draft/create edge, delete node/edge.
  - Matrix input (adjacency): resize node count, edit matrix, apply to graph.
- `GraphUI` JSON contract preview is rendered live.

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
- `src/features/matrix/components`: adjacency matrix editor.
- `src/features/workspace/components`: toolbar, mode switching, contract panel.

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
