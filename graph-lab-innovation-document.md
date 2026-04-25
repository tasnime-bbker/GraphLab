# GRAPH LAB — Frontend Innovation Document

---

## 1. Signature Interactions

### 1.1 — Particle Burst on Node Creation
**Pitch:** When a node is placed on the canvas, a radial burst of 12–20 tiny particles explodes outward and fades over 600ms.

**Description:** On the `ADD_NODE` dispatch, spawn a temporary `<g>` element containing small `<circle>` elements at the new node's position. Each particle gets a random angle and velocity. Animate them outward using `requestAnimationFrame`, decreasing opacity from 1→0 over 600ms. Remove the group after animation completes. Particles inherit the `indigo-400` color.

**Implementation Hint:** Create a `useNodeCreationEffect` hook. Listen to `graph.nodes.length` changes via `useEffect`. Use `requestAnimationFrame` loop with elapsed-time tracking. Each particle: `x += cos(angle) * speed * dt`, `y += sin(angle) * speed * dt`, `opacity -= dt / 600`. Append SVG circles directly to `svgRef.current` and remove on completion.

---

### 1.2 — Edge Completion Pulse Wave
**Pitch:** When an edge is successfully created, a pulse wave ripples along the edge path from source to target.

**Description:** On `ADD_EDGE`, clone the edge's `<path>`, apply `stroke-dasharray` equal to total path length, and animate `stroke-dashoffset` from full-length to 0 over 400ms. The clone has a brighter stroke (`purple-300`) and is removed after animation. This creates a "signal traveling through a wire" effect.

**Implementation Hint:** Use `path.getTotalLength()` to get length. Set `stroke-dasharray: length` and animate `stroke-dashoffset` from `length` to `0` using CSS `@keyframes` or inline style transition. Add a temporary `<path>` element with `pointer-events: none`.

---

### 1.3 — Cycle Detection Flash
**Pitch:** When a user closes a cycle (creates an edge that completes a loop), all edges in the detected cycle flash simultaneously in `green-400`.

**Description:** After each `ADD_EDGE`, run a lightweight DFS from the new edge's target back to its source. If a cycle is found, collect the edge IDs in the cycle path, then temporarily add a CSS class `cycle-flash` that applies a 1s animation: `flash-green 1s ease-out` keyframe (opacity 1→0 on a green overlay stroke). This gives immediate visual feedback that a cycle was formed.

**Implementation Hint:** Implement `detectCycle(edges, from, to)` as a pure function in `selectors.ts`. Returns `string[]` of edge IDs or `null`. In `GraphCanvas`, track a `flashingEdges` state set. On `ADD_EDGE`, check cycle, set flashing IDs, clear after 1000ms with `setTimeout`.

---

### 1.4 — Magnetic Snap Guides
**Pitch:** When dragging a node, faint guide lines appear when it aligns horizontally or vertically with another node (within 8px tolerance).

**Description:** During `MOVE_NODE` dispatch, compare the dragged node's x/y with all other nodes. If `|nodeA.x - nodeB.x| < 8`, render a vertical dashed line at that x spanning the canvas height. Same for the y-axis. Lines are `stroke: rgba(99,102,241,0.3)`, `strokeDasharray: 4 4`. This helps users create clean, aligned layouts without a grid-snap.

**Implementation Hint:** Add an `alignmentGuides` state to `GraphCanvas`: `{vertical: number[], horizontal: number[]}`. Compute in the drag handler before dispatching. Render as `<line>` elements in the SVG. Clear when drag ends (d3 drag `.on('end', ...)`).

---

### 1.5 — Delete Implosion
**Pitch:** When a node is deleted, its connected edges retract toward the deletion point before vanishing.

**Description:** On `DELETE_NODE`, before removing from state, capture the deleted node's position and its connected edge geometries. Render temporary "ghost" edges that animate their endpoints toward the deleted node's position over 300ms, shrinking to zero length. The node itself scales from 1→0. After animation, dispatch the actual state removal.

**Implementation Hint:** Use a `pendingDeletion` state: `{nodeId, position, connectedEdges[]}`. Render ghost elements conditionally. Use `CSS transition: all 300ms ease-in`. On `transitionend`, dispatch the real `DELETE_NODE`. This creates a two-phase delete: animate → commit.

---

### 1.6 — Edge Weight Scrub
**Pitch:** Instead of clicking to type a weight, hold Shift+drag vertically on an edge weight badge to "scrub" the value up/down like a slider.

**Description:** When `graph.weighted` is true, attach a drag listener to weight label circles. On `Shift+mousedown`, enter scrub mode. Moving mouse up increases weight, down decreases. The weight badge shows the live value updating. On `mouseup`, commit via `SET_EDGE_WEIGHT`. Value is clamped by `weightPolicy`.

**Implementation Hint:** Use `d3-drag` on the weight `<circle>`. Track `startY` on drag start. `delta = (startY - event.y) / 10`. New weight = `Math.round(startWeight + delta)`. Validate with `isWeightAllowed()` before each visual update. Dispatch on drag end.

---

## 2. Algorithmic Visualization Layer

### 2.1 — BFS/DFS Wavefront Animation
**Pitch:** Animate BFS as an expanding ring of color that floods outward from a source node, with DFS shown as a single probing tendril.

**Description:** Add an "Algorithm Visualizer" panel. User selects algorithm + source node. For BFS: at each step, the "frontier" nodes pulse with a bright ring animation (SVG `<circle>` with animated `r`). Visited nodes fade to a muted `green-800`. Edges in the traversal tree get a permanent bright stroke. For DFS: the current exploration path is highlighted as a single glowing trail that backtracks visually.

**Implementation Hint:** Implement BFS/DFS as generator functions (`function*`) that yield each step: `{visited: Set, frontier: Set, treeEdges: string[]}`. Use `setInterval` or `requestAnimationFrame` with configurable speed to consume yields. Store visualization state in a `useRef` to avoid re-render storms. Overlay colored circles/paths on the SVG.

---

### 2.2 — Dijkstra Probability Halos
**Pitch:** During Dijkstra execution, unvisited nodes display a "distance halo" — a radial gradient ring whose radius represents the current known shortest distance.

**Description:** As Dijkstra processes nodes, each unvisited node with a tentative distance gets a pulsing concentric ring. The ring radius = `baseRadius + tentativeDistance * scale`. Color transitions from indigo (close to source) to rose (far/infinity). When a node is finalized, its halo "locks in" with a satisfying snap animation (scale overshoot then settle). The shortest path, once found, is highlighted with an animated dashed stroke.

**Implementation Hint:** Dijkstra as `function*` yielding `{distances: Map<NodeId, number>, visited: Set, previous: Map}`. For each node, render `<circle r={computedRadius} fill="none" stroke={colorByDistance} opacity={0.4}>` with CSS `transition` on `r`. Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for the snap easing.

---

### 2.3 — MST Growth Animation
**Pitch:** Minimum Spanning Tree edges grow organically from the first node like roots of a tree, with each new edge "stretching" into existence.

**Description:** Kruskal's or Prim's MST visualized step-by-step. Each newly added MST edge animates from zero-length to full length over 500ms. Non-MST edges that are considered but rejected flash red briefly. The total weight counter increments in the corner with a number-rolling animation.

**Implementation Hint:** MST as generator yielding `{mstEdges: string[], rejectedEdge?: string, totalWeight: number}`. For edge grow animation, use `stroke-dasharray: totalLength` and animate `stroke-dashoffset` from `totalLength` to `0`. Number rolling: CSS `@property --weight` with `counter-set` or a React spring interpolation.

---

### 2.4 — Flow Network Saturation Fill
**Pitch:** For max-flow visualization, edges fill up like pipes — a colored inner stroke grows proportionally to flow/capacity ratio.

**Description:** Each edge renders two paths: an outer "pipe" (full width, dark) and an inner "flow" (width proportional to flow/capacity). As the Ford-Fulkerson algorithm runs, augmenting paths flash bright, and the inner flow strokes grow. Saturated edges (flow=capacity) pulse red. The source node has an "outflow" particle animation; the sink has an "inflow" animation.

**Implementation Hint:** Dual `<path>` per edge. Inner path: `strokeWidth = maxWidth * (flow / capacity)`. Animate with CSS `transition` on `stroke-width`. Augmenting path highlight: temporary overlay path with `animation: pulse 0.5s`. Track flow state in a `useReducer` separate from the graph reducer.

---

## 3. Data & State Innovations

### 3.1 — Time-Travel Graph History with Visual Diffing
**Pitch:** Every graph mutation is recorded. A timeline scrubber lets users travel backward/forward, with added/removed elements highlighted in green/red.

**Description:** Wrap the `graphReducer` in a history middleware that stores up to 50 snapshots. A horizontal timeline bar at the bottom shows dots for each state. Dragging the scrubber replays states. When comparing two states, added nodes/edges glow green, removed ones glow red as ghost elements. This makes debugging graph construction trivial and looks spectacular in demos.

**Implementation Hint:** Create `useGraphHistory` hook wrapping `useReducer`. Store `past: GraphDocument[], present: GraphDocument, future: GraphDocument[]`. New action types: `UNDO`, `REDO`, `JUMP_TO(index)`. Diff function: `diffGraphStates(a, b)` → `{addedNodes, removedNodes, addedEdges, removedEdges}`. Render ghosts with `opacity: 0.4` and colored stroke.

---

### 3.2 — Ghost Graph Overlay for A/B Comparison
**Pitch:** Load a second graph as a translucent overlay on the main canvas to visually compare two topologies.

**Description:** User can "snapshot" the current graph as a ghost layer. Continue editing the primary graph while the ghost remains visible underneath at 30% opacity with dashed edges. Differences are immediately visible. Useful for comparing "before/after" algorithm modifications or testing alternate topologies. Toggle ghost visibility with a button.

**Implementation Hint:** Store `ghostGraph: GraphState | null` in a new context slice. Render ghost nodes/edges in a separate SVG `<g>` layer below the main graph with `opacity: 0.3`, `stroke-dasharray: 3 3`, and a distinct color (`cyan-400`). Snapshot button copies current graph to `ghostGraph`.

---

### 3.3 — Multi-Format Export Engine
**Pitch:** Export the graph in 6+ formats from a single dropdown: JSON, adjacency list, edge list, DOT language, LaTeX TikZ, and PNG screenshot.

**Description:** Beyond the existing JSON panel, add a format switcher. Each format is computed live from the same `GraphState`. DOT format enables pasting into Graphviz. LaTeX TikZ output lets academic users drop the graph directly into papers. PNG uses `SVGElement.outerHTML` → Canvas → `toBlob()`. All formats include a "Copy to Clipboard" button with a checkmark animation on success.

**Implementation Hint:** Pure functions: `toAdjacencyList(graph)`, `toEdgeList(graph)`, `toDOT(graph)`, `toTikZ(graph)`. For PNG: create offscreen `<canvas>`, draw SVG via `new Image()` with `src = 'data:image/svg+xml;...'`, then `canvas.toBlob()`. Use `navigator.clipboard.writeText()` for text formats, `ClipboardItem` for PNG.

---

### 3.4 — Live Graph Metrics Dashboard
**Pitch:** A real-time stats bar showing computed graph properties: density, is-connected, is-bipartite, chromatic number estimate, diameter.

**Description:** Below the toolbar, a collapsible metrics strip auto-computes key graph properties on every state change. Each metric is displayed as a small badge with an icon. Properties that change flash briefly. "Connected: ✓" in green, "Bipartite: ✗" in red. Density shown as a mini progress bar. This makes the tool feel like a professional analysis environment, not just an editor.

**Implementation Hint:** Compute in `useMemo` selectors: `isConnected(graph)` via BFS, `isBipartite(graph)` via 2-coloring, `density = 2|E| / (|V|(|V|-1))`. Memoize aggressively since these run on every render. Show in a `<div>` strip with `transition: background-color 300ms` for flash effect on change.

---

## 4. Canvas Intelligence

### 4.1 — Force-Directed Auto-Layout
**Pitch:** One-click button to rearrange all nodes using a force-directed physics simulation, animated live on the canvas.

**Description:** Press "Auto Layout" and watch nodes repel each other while edges act as springs, settling into an aesthetically optimal arrangement over ~2 seconds. Uses Coulomb repulsion between all node pairs and Hooke's law attraction along edges. The simulation runs at 60fps, directly dispatching `MOVE_NODE` actions. Nodes settle with dampened velocity.

**Implementation Hint:** Use `d3-force` with `forceSimulation`, `forceLink(edges)`, `forceManyBody().strength(-300)`, `forceCenter(CANVAS_WIDTH/2, CANVAS_HEIGHT/2)`. On each tick, dispatch `MOVE_NODE` for each node. Run for ~300 ticks or until `alpha < 0.01`. Stop simulation on any manual drag.

---

### 4.2 — Semantic Clustering Zones
**Pitch:** Automatically detect graph communities and draw soft colored regions behind node clusters.

**Description:** Run a simple community detection (connected components, or Louvain-lite) and render a convex hull or rounded bounding box behind each cluster as a semi-transparent colored region. Each community gets a distinct color from a palette (indigo, emerald, amber, rose). The regions update live as edges are added/removed, with smooth shape transitions.

**Implementation Hint:** For connected components: BFS-based `findComponents(graph)` → `NodeId[][]`. For each component, compute convex hull of positions using Graham scan. Render as `<polygon>` with `fill: color/10%`, `stroke: color/30%`, rounded via SVG `<path>` with bezier curves between hull points. Use CSS `transition` on point positions.

---

### 4.3 — Smart Label Collision Avoidance
**Pitch:** Edge weight labels and node labels automatically reposition to avoid overlapping each other and edges.

**Description:** After computing edge geometries, run a simple collision pass: for each weight label, check overlap with every other label and with node positions. If overlap detected, offset the label perpendicular to the edge by an additional 15px. This prevents the common problem of weight badges stacking on top of each other in dense graphs.

**Implementation Hint:** After computing all `EdgeGeometry` objects, iterate pairs. Overlap check: `Math.hypot(a.labelX - b.labelX, a.labelY - b.labelY) < 30`. If colliding, offset the second label's normal component by `+= 18`. Store adjusted positions in a `useMemo` pass. Re-run when edges or positions change.

---

### 4.4 — Zoom & Pan with Minimap
**Pitch:** SVG zoom/pan with a picture-in-picture minimap showing the full graph with a viewport rectangle.

**Description:** Use `d3-zoom` to enable scroll-to-zoom and drag-to-pan on the SVG canvas. In the bottom-right corner, render a 120×80px minimap showing all nodes as tiny dots with a white rectangle indicating the current viewport. Clicking on the minimap teleports the viewport. Double-click canvas to reset zoom. Smooth easing on all transitions.

**Implementation Hint:** Apply `d3-zoom` to the SVG element. Store transform in state: `{k, x, y}`. Wrap all canvas content in a `<g transform={...}>`. Minimap: render a second tiny `<svg>` with all node positions scaled down by `canvasWidth / minimapWidth`. Viewport rect: inverse of current zoom transform. Use `zoom.transform()` with `d3.transition().duration(300)` for smooth jumps.

---

### 4.5 — Edge Bundling for Dense Graphs
**Pitch:** When graphs exceed 15+ edges, automatically bundle parallel-ish edges into curved bundles to reduce visual clutter.

**Description:** Detect groups of edges whose source-target pairs are spatially close. Route them through shared control points, creating smooth bundled curves. Individual edges within a bundle separate slightly on hover to reveal details. This transforms chaotic hairball graphs into elegant, readable diagrams.

**Implementation Hint:** For each edge, compute angle `atan2(dy, dx)`. Group edges with similar angles (within 15°) passing through similar midpoints (within 40px). For each bundle, compute a shared bezier control point as the average midpoint. Adjust individual offsets within the bundle by `index * 4px`. Use existing `buildEdgeGeometry` and modify the control point calculation.

---

## 5. Immersive Atmosphere Upgrades

### 5.1 — Animated Grid with CSS @property
**Pitch:** The dot grid subtly breathes — dots gently pulse in opacity in a wave pattern radiating from the center.

**Description:** Replace the static SVG pattern with an animated one. Using CSS `@property --grid-pulse`, animate the dot opacity in a sine wave: dots closer to the center pulse first, creating a radial "heartbeat" effect. The animation is extremely subtle (opacity between 0.08 and 0.2) so it reads as atmosphere, not distraction. Speed: one full cycle every 8 seconds.

**Implementation Hint:** Use multiple SVG `<circle>` elements in the pattern. Apply `<animate>` SVG element: `attributeName="opacity" values="0.08;0.2;0.08" dur="8s" repeatCount="indefinite"`. Stagger `begin` attribute by distance from center: `begin="${dist * 0.01}s"`. Alternative: use `feTurbulence + feDisplacementMap` for organic wobble.

---

### 5.2 — Glitch Effect on Error States
**Pitch:** When a weight policy violation or invalid operation occurs, the error badge and nearby UI elements "glitch" — a 200ms chromatic aberration + horizontal displacement effect.

**Description:** On error, apply a CSS class that uses `clip-path` slicing and `transform: translateX(±2px)` on alternating horizontal slices of the element, combined with red/cyan `text-shadow` offset. The effect fires once (200ms) then settles to a static error state. This is memorable, on-brand with the Cyber-Lab aesthetic, and immediately communicates "something went wrong."

**Implementation Hint:**
```css
@keyframes glitch {
  0%   { clip-path: inset(40% 0 0 0); transform: translateX(-2px); }
  20%  { clip-path: inset(0 0 60% 0); transform: translateX(2px); }
  40%  { clip-path: inset(20% 0 20% 0); transform: translateX(-1px); }
  100% { clip-path: none; transform: none; }
}
```
Apply via `animation: glitch 200ms linear` on the error element. Add `text-shadow: 2px 0 #ff0000, -2px 0 #00ffff` during the animation.

---

### 5.3 — Node Ambient Particle Ring
**Pitch:** Selected nodes emit a slow orbit of 3–4 tiny particles circling at a fixed radius, like electrons around an atom.

**Description:** When `selectedNodeId` is set, render 3 tiny circles (r=2) that orbit at `NODE_RADIUS + 8` using CSS `@keyframes rotate`. Each particle has a slight trail (motion blur via `filter: blur(1px)`). The orbit speed is 4 seconds per revolution. Particles are offset 120° from each other. This creates a subtle "active/scanning" visual without any performance cost.

**Implementation Hint:**
```jsx
{[0, 120, 240].map(angle => (
  <circle r={2} fill="#818cf8" opacity={0.7}
    style={{ transformOrigin: '0 0', animation: `orbit 4s linear infinite`,
             animationDelay: `${angle / 360 * 4}s` }}>
    <animateTransform attributeName="transform" type="rotate"
      from={`${angle} 0 0`} to={`${angle + 360} 0 0`} dur="4s" repeatCount="indefinite"/>
  </circle>
))}
```

---

### 5.4 — Edge Data Flow Particles
**Pitch:** In directed mode, tiny particles flow along edges in the direction of the arrow, like data traveling through a network.

**Description:** For each directed edge, spawn a small circle that travels along the edge path from source to target over 3 seconds, then repeats. Use SVG `<animateMotion>` with the edge's path data. Particles are 2px circles with `indigo-300` fill and 60% opacity. Maximum 1 particle per edge to keep performance clean. This makes the graph feel like a living network.

**Implementation Hint:** Inside each edge's `<g>`, when `graph.directed`:
```jsx
<circle r={2} fill="#a5b4fc" opacity={0.6}>
  <animateMotion dur="3s" repeatCount="indefinite" path={geometry.path} />
</circle>
```
The `path` attribute of `<animateMotion>` reuses the exact path string from `buildEdgeGeometry`. No JS needed — pure SVG animation.

---

## 6. Developer Experience Features

### 6.1 — Command Palette (⌘K / Ctrl+K)
**Pitch:** A Spotlight/VS Code-style command palette for power users to execute any action by typing.

**Description:** Press Ctrl+K to open a centered floating input with fuzzy search. Commands include: "Add 5 nodes", "Reset graph", "Toggle directed", "Export as DOT", "Auto layout", "Run BFS from node 3", "Set all weights to 5". Each command has a keyboard shortcut hint on the right. Arrow keys to navigate, Enter to execute, Escape to close. The palette is searchable by command name and description.

**Implementation Hint:** Create `CommandPalette.tsx` component. Register commands as `{id, name, description, shortcut?, action: () => void}[]`. Fuzzy match with `name.toLowerCase().includes(query)`. Global `useEffect` with `keydown` listener for Ctrl+K. Render as a fixed-position `<div>` with `z-index: 50`, glassmorphic styling, and `<input autoFocus>`. Dispatch actions via `useGraphDispatch`.

---

### 6.2 — Keyboard Shortcut System
**Pitch:** Full keyboard navigation: `N` to add node at center, `D` to toggle directed, `W` to toggle weighted, `Delete` to remove selected, `Z` for undo.

**Description:** A global keyboard handler intercepts single-key shortcuts when no input is focused. `N` adds a node at canvas center. `D`/`W` toggle graph properties. `Delete`/`Backspace` removes selected node or edge. `Escape` clears selection and edge draft. `Ctrl+Z`/`Ctrl+Y` for undo/redo (with history feature). A small `?` floating button shows all shortcuts in a modal.

**Implementation Hint:** Single `useEffect` on `document` with `keydown` listener. Check `document.activeElement.tagName !== 'INPUT'` before processing. Map keys to dispatch calls. For the help modal, use a simple `useState<boolean>` toggle rendering a glassmorphic overlay with a two-column shortcut table.

---

### 6.3 — Graph Query Mini-Language
**Pitch:** A tiny input bar where users type queries like `path 1→5` or `neighbors 3` and get instant visual highlighting on the canvas.

**Description:** A compact input at the top of the canvas. Typing `path 1 5` highlights the shortest path (if it exists) in green. `neighbors 3` highlights node 3 and all adjacent nodes/edges. `degree 4` shows the degree count. `components` colors each connected component differently. Results are overlaid as temporary highlights that fade after 5 seconds or on next query.

**Implementation Hint:** Parse input with simple regex: `/^(path|neighbors|degree|components)\s*(.*)$/`. Implement each as a pure function on `GraphState`. Store `queryHighlights: {nodes: Set<NodeId>, edges: Set<string>, color: string}` in component state. Render highlighted elements with an additional `<circle>` or `<path>` overlay with animated opacity.

---

## 7. The One Unforgettable Feature

### "ALGORITHM CINEMA" — Live Algorithm Playback with VCR Controls

**Pitch:** A full cinematic playback system that turns algorithm execution into a visual movie, complete with play/pause/step/rewind/speed controls and a timeline scrubber — entirely in the frontend.

**What it looks like:** Below the canvas, a sleek dark control bar appears (think: YouTube player meets music DAW timeline). It has: ◀◀ rewind, ◀ step-back, ▶ play/pause, ▶ step-forward, ▶▶ fast-forward, a speed selector (0.5x, 1x, 2x, 4x), and a horizontal timeline showing every algorithm step as a colored tick mark. The current step has a glowing playhead. Above the timeline, a one-line narration updates each step: *"Step 7: Relaxing edge 2→5, distance updated from ∞ to 12."*

**How it works:** The user selects an algorithm (BFS, DFS, Dijkstra, Prim's MST, Kruskal's) and a source node. The system pre-computes ALL steps using generator functions, storing them in an array of snapshots. Each snapshot contains: `{visited, frontier, currentNode, currentEdge, distances?, treeEdges, narration}`. The playback engine is a `useRef` timer that advances through snapshots, applying visual state to the SVG canvas without mutating the graph reducer.

Each step applies visual overlays: visited nodes get a green ring, frontier nodes get a pulsing amber ring, the current edge being examined gets a bright white flash, and tree edges accumulate a permanent green stroke. The narration text updates with each step, explaining what the algorithm is doing in plain English.

The timeline scrubber is fully interactive — drag it to any step and the canvas instantly shows that state. Click any tick mark to jump there. The entire experience feels like watching a movie of the algorithm thinking.

**Technologies:** Generator functions (`function*`) for algorithm implementation. `useReducer` for playback state: `{steps: Snapshot[], currentIndex: number, playing: boolean, speed: number}`. `setInterval` with dynamic interval `(1000 / speed)` for playback. SVG overlays rendered conditionally based on current snapshot. CSS transitions for smooth state changes between steps.

**Emotional reaction:** When demoed, the viewer sees an algorithm literally come alive on screen. The combination of animated canvas visualization, human-readable narration, and VCR-style controls makes every other team's static output look lifeless. A professor watching this thinks *"this team understands algorithms deeply enough to teach them visually."* A peer thinks *"I want to use this to study."*

---

## 8. Priority Matrix

| # | Feature | Section | Impact | Feasibility | Score | Order |
|---|---------|---------|--------|-------------|-------|-------|
| 1 | Force-Directed Auto-Layout | 4.1 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 25 | 🥇 1st |
| 2 | Algorithm Cinema | 7 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 20 | 🥇 1st |
| 3 | Command Palette | 6.1 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 20 | 🥈 2nd |
| 4 | Keyboard Shortcuts | 6.2 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 20 | 🥈 2nd |
| 5 | Time-Travel History | 3.1 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 20 | 🥈 2nd |
| 6 | Edge Data Flow Particles | 5.4 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 20 | 🥈 2nd |
| 7 | Multi-Format Export | 3.3 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 20 | 🥉 3rd |
| 8 | Live Metrics Dashboard | 3.4 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 16 | 🥉 3rd |
| 9 | Particle Burst on Node | 1.1 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 15 | 🥉 3rd |
| 10 | Edge Completion Pulse | 1.2 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 15 | 🥉 3rd |
| 11 | BFS/DFS Wavefront | 2.1 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 15 | 4th |
| 12 | Dijkstra Halos | 2.2 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 15 | 4th |
| 13 | MST Growth Animation | 2.3 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 12 | 4th |
| 14 | Magnetic Snap Guides | 1.4 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 12 | 4th |
| 15 | Zoom & Pan + Minimap | 4.4 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 12 | 4th |
| 16 | Clustering Zones | 4.2 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 12 | 5th |
| 17 | Glitch Error Effect | 5.2 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 12 | 5th |
| 18 | Node Orbit Particles | 5.3 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 12 | 5th |
| 19 | Label Collision Avoidance | 4.3 | ⭐⭐⭐ | ⭐⭐⭐ | 9 | 5th |
| 20 | Ghost Graph Overlay | 3.2 | ⭐⭐⭐ | ⭐⭐⭐ | 9 | 6th |
| 21 | Cycle Detection Flash | 1.3 | ⭐⭐⭐ | ⭐⭐⭐ | 9 | 5th |
| 22 | Animated Grid Pulse | 5.1 | ⭐⭐ | ⭐⭐⭐⭐ | 8 | 6th |
| 23 | Graph Query Language | 6.3 | ⭐⭐⭐⭐ | ⭐⭐ | 8 | 6th |
| 24 | Flow Saturation | 2.4 | ⭐⭐⭐⭐ | ⭐⭐ | 8 | 7th |
| 25 | Delete Implosion | 1.5 | ⭐⭐⭐ | ⭐⭐ | 6 | 7th |
| 26 | Edge Bundling | 4.5 | ⭐⭐⭐ | ⭐⭐ | 6 | 7th |
| 27 | Edge Weight Scrub | 1.6 | ⭐⭐ | ⭐⭐⭐ | 6 | 7th |

---

## Recommended Sprint Plan

| Sprint | Features | Goal |
|--------|----------|------|
| **Sprint 1** | Force-Directed Layout + Algorithm Cinema + Edge Flow Particles + Keyboard Shortcuts | Win the demo |
| **Sprint 2** | Command Palette + Time-Travel History + Multi-Format Export + Particle Burst + Edge Pulse | Polish |
| **Sprint 3** | Live Metrics Dashboard + BFS/DFS Wavefront + Dijkstra Halos + Snap Guides | Differentiate |
| **Sprint 4** | Everything else | Luxury |

---

> **The competitive kill shot:** Algorithm Cinema + Force-Directed Layout. Implement those two first and no other team will come close. The force layout takes ~30 minutes to wire up with `d3-force`. Algorithm Cinema is the single feature that turns your editor from a *"tool"* into an *"experience."* Ship those, then layer on the micro-interactions (particles, pulses, flow particles) for visual polish. Everything else is gravy.
>
> **Go win this.**
