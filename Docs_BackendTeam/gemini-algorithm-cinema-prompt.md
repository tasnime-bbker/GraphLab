# Gemini Pro Prompt — Algorithm Cinema: Step-by-Step Output Contract Design

---

## YOUR ROLE

You are a Senior API Contract Architect and Frontend Systems Designer. You specialize in designing data contracts between algorithm engines and rich visual frontends. You think in terms of **serializable state snapshots**, **UI rendering contracts**, and **zero-ambiguity type systems**.

---

## CONTEXT: THE PROJECT

We are building **Graph Lab** — a high-performance, browser-based graph editor with a "Cyber-Lab" aesthetic (dark glassmorphism, neon SVG, dot grid canvas). The frontend is React + TypeScript + SVG.

The crown feature is **Algorithm Cinema**: a cinematic, VCR-style algorithm playback system. The user picks an algorithm and a source node, then watches the algorithm execute step-by-step on the canvas — with play/pause/rewind/scrub controls, a per-step narration line, and rich SVG visual overlays applied to nodes and edges at each step.

---

## THE PROBLEM YOU MUST SOLVE

The algorithm engine (backend or a pure frontend module) needs to produce a **complete, pre-computed array of step snapshots** before playback begins. The frontend consumes this array and renders each snapshot as a full visual state — no logic, no computation on the frontend side. The frontend is a **pure renderer**: it receives a snapshot, it paints it. That's all.

You must design the **definitive TypeScript output contract** for this snapshot array, covering every algorithm we support.

---

## ALGORITHMS TO COVER

Design the contract to support all of the following. Each has unique visual requirements:

1. **BFS** (Breadth-First Search)
2. **DFS** (Depth-First Search)
3. **Dijkstra** (Single-Source Shortest Path)
4. **Prim's MST** (Minimum Spanning Tree)
5. **Kruskal's MST** (Minimum Spanning Tree)
6. **Ford-Fulkerson / Edmonds-Karp** (Max Flow)
7. **Topological Sort** (DAG only)
8. **Bellman-Ford** (handles negative weights)

---

## VISUAL SYSTEM: WHAT THE FRONTEND CAN RENDER

The frontend SVG canvas can apply the following visual states to any node or edge at any step. Your contract must express these precisely:

### Node Visual States
- `idle` — default, no highlight
- `frontier` — on the exploration boundary (pulsing amber ring)
- `visiting` — currently being processed (bright white flash)
- `visited` — already processed (muted green fill)
- `in_path` — part of the final result path (vivid indigo/purple)
- `rejected` — considered but excluded (dim red, faded)
- `source` — the origin node (permanent gold ring)
- `target` — the destination node (permanent rose ring)
- `mst_included` — part of the MST result
- `flow_source` — max-flow source (outflow particles)
- `flow_sink` — max-flow sink (inflow particles)
- Custom label overlay: show a dynamic value badge (distance, rank, flow, etc.)

### Edge Visual States
- `idle` — default
- `examining` — currently being evaluated (bright white, animated)
- `tree_edge` — part of BFS/DFS tree (permanent green stroke)
- `relaxed` — weight was just updated in Dijkstra/Bellman-Ford (pulse flash)
- `mst_edge` — part of MST result (permanent vivid stroke)
- `rejected_edge` — considered but not added to MST (brief red flash, then faded)
- `augmenting` — part of augmenting path in max-flow (bright animated)
- `saturated` — flow = capacity (red pulsing)
- `flow_fill` — inner stroke width proportional to flow/capacity ratio
- Custom label overlay: show flow/capacity, weight, or relaxed distance

### Canvas-Level Overlays (per step)
- Highlight a **set of nodes** forming a community/component (colored convex hull region)
- Draw a **path trace** between two nodes (animated dashed stroke sequence)
- Show a **global counter badge** (e.g., total MST weight, current max flow value)

---

## YOUR DELIVERABLE

### Part 1 — The TypeScript Contract

Design the complete TypeScript type definitions for:

```
AlgorithmCinemaPayload
  └── metadata: AlgorithmMetadata
  └── steps: AlgorithmStep[]
  └── result: AlgorithmResult
```

Requirements:
- `AlgorithmStep` must be a **discriminated union** by algorithm type — each algorithm gets its own step shape, but all share a common base
- Every step must be **fully self-contained**: the frontend applies it wholesale, it does NOT diff from the previous step. Each step describes the COMPLETE visual state of ALL nodes and edges at that moment.
- Node and edge visual states must be **typed enums**, not raw strings
- Each step must carry a `narration` field: a human-readable English string explaining what is happening at this exact step (written as if explaining to a student learning the algorithm)
- Steps must support **optional per-node and per-edge value badges** (distance labels, flow/capacity labels, etc.)
- The `result` object must encode the final answer in algorithm-appropriate typed form (shortest path array, MST edge set, max flow value + flow map, topological order, etc.)
- Include a `highlights` array per step for canvas-level overlays (convex hulls, path traces, global counters)
- Design for **zero frontend logic**: if the frontend has to compute anything beyond "read this field, apply this style", the contract has failed

### Part 2 — Step-by-Step Generation Rules

For each of the 8 algorithms, write the **precise rules** for how steps are generated:
- What triggers a new step (each edge examination? each node visit? each relaxation?)
- What the complete node/edge state looks like at that step
- What the narration string says (give 2–3 example narration strings per algorithm)
- What goes in the `result` object

### Part 3 — Frontend Rendering Contract

Write the **renderer specification**: given an `AlgorithmStep`, what does the React component do?
- Map each `NodeVisualState` → exact SVG properties (fill, stroke, strokeWidth, animation class, badge content)
- Map each `EdgeVisualState` → exact SVG properties (stroke, strokeWidth, strokeDasharray, animation class, badge content)
- Specify how `highlights` are rendered (convex hull polygon, path trace, counter badge position)
- Define the **transition behavior** between steps (which properties animate, duration, easing)
- Define the **playback state machine**: states (idle, playing, paused, scrubbing, complete) and transitions

### Part 4 — Narration Style Guide

Write a style guide for the `narration` field strings. Rules for:
- Tone (conversational? technical? teaching?)
- Length (character limit?)
- How to reference nodes and edges (by ID? by label?)
- Tense (present tense: "Visiting node 3" vs past: "Visited node 3")
- How to express mathematical operations ("Relaxing edge 2→5: 8 + 4 = 12, better than current ∞")
- Special cases: when a step produces no change, when the algorithm terminates early

### Part 5 — Example Payload

Write a **complete concrete example** of an `AlgorithmCinemaPayload` for Dijkstra's algorithm running on this graph:

```
Nodes: A, B, C, D  
Edges: A→B (w=4), A→C (w=2), B→D (w=3), C→B (w=1), C→D (w=5)  
Source: A, Target: D
```

Show every step from initialization to termination, with full node/edge state arrays and narration strings. This example will be used as the **golden reference** for frontend developers implementing the renderer.

---

## OUTPUT FORMAT REQUIREMENTS

- Use TypeScript for all type definitions (strict, no `any`)
- Use JSDoc comments on every type and field explaining its purpose and frontend rendering contract
- Organize output as: Part 1 → Part 2 → Part 3 → Part 4 → Part 5, with clear headers
- After Part 5, add a **"Frontend Integration Checklist"**: a numbered list of everything the React developer must implement to consume this contract correctly
- Tone: precise, engineering-grade. Written for a TypeScript developer who will implement this tomorrow morning.

---

## QUALITY BARS

Your contract passes if:
- ✅ A frontend developer can implement the full renderer without asking a single clarifying question
- ✅ Any of the 8 algorithms can be added/removed without breaking the contract's core structure
- ✅ The narration strings alone could serve as a teaching tool for someone learning graph algorithms
- ✅ The contract is extensible: adding a 9th algorithm (e.g., A*) requires only adding a new discriminated union member, nothing else
- ✅ The `result` type is rich enough to power a "solution summary" panel in the UI (not just a pass/fail)

Reject any design where:
- ❌ The frontend must compute diffs between steps
- ❌ Visual states are raw strings instead of typed enums
- ❌ Node/edge state is implicit (e.g., "not in visited set means idle") — all state must be explicit
- ❌ The contract conflates algorithm logic with visual representation
- ❌ Narration strings are generic ("Processing node...") instead of step-specific

Begin writing Part 1 immediately. Do not preamble.
