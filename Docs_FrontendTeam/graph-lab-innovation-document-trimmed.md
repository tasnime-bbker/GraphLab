# GRAPH LAB — Frontend Innovation Notes (trimmed)

---

Scope (kept items):
- Revert 4.2 (Semantic clustering zones)
- Layout overhaul: Mantine UI, gradient background (no glass), elementary color palette, parameter toggles moved to right/top, French language option
- Dark mode switch (defaults to light)
- Switch graph model: oriented -> unoriented-edge internal representation (pair of directed edges, single visual edge)
- User Guide moved into visual editor top-left corner with hover-to-open
- Bellman-Ford and a Bellman (relaxation) visualizer (use same animation system as Dijkstra)
- Rework Prim (visual + PQ panel)

---

## 1. Revert 4.2 — Semantic Clustering Zones
Pitch: Remove semantic clustering zones from the active code path and roadmap; keep utilities but disable rendering.

Description: Clustering hulls and colored regions are currently not desired. Remove the default rendering of cluster zones and guard any cluster-specific selectors or UI toggles behind a feature flag.

Implementation hint:
- Set a single flag `ENABLE_CLUSTER_ZONES = false` in a central feature-flags file.
- Remove cluster region rendering from the primary SVG render tree (keep utilities in `utils/` but mark deprecated).
- Remove cluster-related menu items and docs references, or hide them when the flag is false.

Owner: Developer B

---

## 2. Layout Overhaul + i18n + Parameter Placement
Pitch: Replace the UI shell with Mantine components, use a gradient background (no glass), adopt an elementary color palette, move parameter toggles to a right/top affix, and add EN/FR language support.

Description: The goal is purely visual & structural: swap custom shells for Mantine primitives, remove glassmorphism, apply a clean gradient background, and centralize UI copy for English and French. The parameter toggles (grid, labels, particles, algorithm toggles, directed-mode visual hints, animation speed etc.) should be displayed in a vertical control strip anchored at the top-right (this is the new primary control surface).

Implementation hint:
- Add `@mantine/core` and `@mantine/hooks` to the frontend (update `package.json`).
- Create a `ThemeProvider` wrapper using Mantine's `ColorSchemeProvider` and `MantineProvider` that applies a gradient background via global styles and supplies an elementary color palette token map.
- Implement `i18n/en.json` and `i18n/fr.json` with keys for all UI strings used by controls and the user guide summary. Use a small `useI18n()` hook that selects strings based on state.
- Implement a `TopRightParameters` component using `Affix` + `Stack` + `Switch`/`Select` components from Mantine. Ensure keyboard accessibility and tooltips (localized).
- Keep dark mode option integrated with Mantine's color scheme (default `light`).

Owner: Developer B

---

## 3. Dark Mode Switch (defaults to light)
Pitch: Expose a global dark-mode switch in the TopRightParameters; the default initial color-scheme is light.

Description: Dark mode toggles the general colorScheme (Mantine) and flips base tokens (background, text). Animations and SVG-stroke palettes should adapt to remain legible.

Implementation hint:
- In `ThemeProvider`, persist user choice to localStorage (`colorScheme`), default `light` if absent.
- Provide a `Switch` control inside `TopRightParameters` and expose `setColorScheme('dark'|'light')`.
- Ensure CSS variables for the SVG theme are derived from tokens so SVG layers update automatically.

Owner: Developer B

---

## 4. Graph Model: Oriented -> Unoriented (internal symmetric directed pairs)
Pitch: Convert editor logic so an undirected relationship is represented internally as two directed edges (u→v and v→u) with a shared symmetry key; the visual editor displays one undirected line (no arrow).

Description: This change fixes the current inconsistencies in edge logic. Algorithms operate on directed arcs (good for adjacency lists), while the UX shows a single undirected connection. Adding/removing undirected edges should act atomically.

Implementation hint:
- Data model changes:
  - Add `isDirected: boolean` on graph metadata (or per-edge `directed?: boolean`).
  - Add `symmetryKey?: string` to `Edge` objects used when creating an undirected pair.
- Reducer behavior:
  - `ADD_EDGE` when `directed=false` should create two internal edge records with same `symmetryKey` and `directed=false` but unique ids (u→v and v→u).
  - `REMOVE_EDGE` using a `symmetryKey` must remove both edges.
- Selectors & display:
  - Provide `getVisualEdges(edges)` selector that collapses symmetric pairs into a single visual representation with `hasArrow=false` and `visualId` derived from the `symmetryKey`.
  - Algorithms (BFS, Dijkstra, Bellman-Ford, Prim, etc.) should operate on the internal directed-edge list (no code changes needed if adjacency functions already use directed arcs).
- Editor UI:
  - When creating an edge, show a small toggle (Directed / Undirected). If undirected, create pair atomically and show single line in the canvas with no arrowhead.
- Migration:
  - Provide a migration helper to convert older saved graphs to the new pattern: for each undirected record (if any), expand to symmetric pair; or for saved directed-only graphs leave unchanged.

Owner: Developer A & Developer C (joint: A leads reducers/selectors, C leads visual collapse & editor UX)

---

## 5. User Guide: Move to visual editor top-left with hover reveal
Pitch: Move the lightweight user guide into a compact top-left icon inside the visual editor. Hover (or tap on mobile) reveals a quick-help popover with common shortcuts and links to the full guide.

Description: The previous separate page or panel for the guide is replaced by an in-canvas, context-aware help item. It should be localized (EN/FR) and small by default. On hover it reveals a summary and buttons like "Export", "Keyboard", "Algorithm Cinema" etc.

Implementation hint:
- Implement `CanvasHelp` component using Mantine's `Popover` (desktop hover) and `Modal` (mobile tap). Keep content sourced from `i18n`.
- Place the component inside `GraphWorkspace` at absolute coordinates `top: 12px; left: 12px; z-index: 60`.
- Ensure the popover contains quick-action buttons that call existing commands (e.g., open export, run layout).

Owner: Developer B

---

## 6. Bellman-Ford + "Bellman" (relaxation view) visualizers
Pitch: Add Bellman-Ford visualizer and a compact relaxation-step "Bellman" view; animations match Dijkstra's style (distance halos, narrated steps).

Description: Bellman-Ford supports negative-weight edges and has a different stepping pattern: iterate |V|-1 times relaxing all edges. The "Bellman" view steps per relaxation (edge attempt) and narrates the old/new tentative distances. Use the same animation primitives and playback/cinema system used for Dijkstra.

Implementation hint:
- Implement Bellman-Ford as a generator `function* bellmanFord(graph, source)` that yields snapshots: `{distances: Map, relaxedEdge?: {u,v,old,new}, iteration, narration}`.
- Implement `function* bellmanRelaxation(graph, source)` that yields for every attempted relaxation a snapshot `{candidateEdge, oldDist, newCandidate, narration}`.
- Reuse Dijkstra's visual primitives: distance halo radius = base + tentative * scale, animated transitions on distance updates, and narration strings localized via `i18n`.
- Integrate into Algorithm Cinema playback: allow selecting Bellman-Ford or Bellman-relaxation as algorithms and scrub/play steps.

Owner: Developer A

---

## 7. Rework Prim (visual + priority-queue panel)
Pitch: Rework Prim's MST visualization to show the growing tree plus a live priority-queue panel that displays candidate edges and their keys.

Description: Prim should animate each accepted edge (grow animation) and briefly flash rejected candidates. The PQ panel shows pushes/pops and the current top; this helps teach the algorithm and aligns Prim with the Cinema playback model.

Implementation hint:
- Implement Prim as a generator `function* prim(graph, seed)` yielding `{mstEdges, candidateHeap: [{edge, key}], chosenEdge, narration}`.
- Visualize chosen edge growth via `stroke-dasharray`/`offset` animation; rejected edges flash red.
- Implement a `PriorityQueuePanel` component (collapsible) that animates inserts/removes (slide-in rows). Keep it localized.
- Integrate Prim generator with the cinema playback so users can scrub and watch the PQ evolve.

Owner: Developer A

---

## Ownership Summary
- Developer A: reducers & algorithm generator work (Graph model migration logic, Bellman-Ford / Bellman / Prim generators, selectors)
- Developer B: UI shell (Mantine), TopRightParameters, i18n, User Guide popover, dark-mode integration
- Developer C: Canvas visuals & UX (visual collapse of symmetric edges, editor UX changes for edge creation, visual animations integration)

---

If you want this trimmed content written into the earlier `graph-lab-innovation-document-v2.md` (overwrite) instead of creating this separate file, tell me and I will replace the original. Otherwise this trimmed file has been added as `Docs_FrontendTeam/graph-lab-innovation-document-trimmed.md` and contains only the items you asked to keep.

