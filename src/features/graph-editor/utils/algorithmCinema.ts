import type { GraphEdge, GraphState, NodeId } from '../../graph/model/types'
import { findEulerianPathOrCircuit, buildEulerianTraceReport, findAllDirectedCycles, findAllUndirectedCycles } from '../../graph/utils/graphAnalysis'

export type CinemaAlgorithm = 'BFS' | 'DFS' | 'Dijkstra' | 'Prims' | 'Kruskals' | 'MaxFlow' | 'ConnectedComponents' | 'SpanningForest' | 'StronglyConnectedComponents' | 'Bellman' | 'BellmanFord' | 'WelshPowell' | 'EulerienPath' | 'RechercheChaine' | 'AllCycles'

export interface CinemaStep {
  narration: string
  visited: NodeId[]
  frontier: NodeId[]
  treeEdges: string[]
  currentNode?: NodeId
  currentEdgeId?: string
  distances?: Record<number, number>
  mstEdges?: string[]
  mstNewEdgeId?: string
  rejectedEdgeId?: string
  mstWeight?: number
  flowByEdge?: Record<string, number>
  augmentingEdgeIds?: string[]
  saturatedEdgeIds?: string[]
  pathEdges?: string[]
  /** Coloration par groupe (Welsh-Powell, etc.) :
   *  chaque entrée porte une couleur CSS et les IDs des sommets de ce groupe. */
  colorGroups?: Array<{ color: string; nodeIds: NodeId[] }>
}

export interface CinemaProgram {
  algorithm: CinemaAlgorithm
  steps: CinemaStep[]
  source: NodeId
  target?: NodeId
  graphSignature: string
}

interface WeightedNeighbor {
  nodeId: NodeId
  edgeId: string
  weight: number
}

function graphSignature(graph: GraphState): string {
  const edges = [...graph.edges]
    .map((edge) => `${edge.id}:${edge.from}->${edge.to}:${edge.weight}`)
    .sort()
    .join('|')
  return `${graph.directed ? 'D' : 'U'}|${graph.weighted ? 'W' : 'N'}|${graph.nodes.join(',')}|${edges}`
}

function neighborsFor(graph: GraphState, nodeId: NodeId, ignoreDirection = false): WeightedNeighbor[] {
  const neighbors: WeightedNeighbor[] = []
  for (const edge of graph.edges) {
    if (edge.from === nodeId) {
      neighbors.push({
        nodeId: edge.to,
        edgeId: edge.id,
        weight: graph.weighted ? edge.weight : 1,
      })
    }
  if ((ignoreDirection || !graph.directed) && edge.to === nodeId) {
      neighbors.push({
        nodeId: edge.from,
        edgeId: edge.id,
        weight: graph.weighted ? edge.weight : 1,
      })
    }
  }
  return neighbors
}

function edgeById(graph: GraphState): Map<string, GraphEdge> {
  const map = new Map<string, GraphEdge>()
  for (const edge of graph.edges) {
    map.set(edge.id, edge)
  }
  return map
}

function emptyStep(narration: string): CinemaStep {
  return {
    narration,
    visited: [],
    frontier: [],
    treeEdges: [],
  }
}

function buildBfsProgram(graph: GraphState, source: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []
  const visited = new Set<NodeId>()
  const queue: NodeId[] = [source]
  const treeEdges: string[] = []

  visited.add(source)
  steps.push({ ...emptyStep(`Start BFS from node ${source}.`), visited: [source], frontier: [source], currentNode: source })

  while (queue.length > 0) {
    const current = queue.shift()
    if (typeof current !== 'number') {
      continue
    }

    const neighbors = neighborsFor(graph, current, true)
    for (const neighbor of neighbors) {
      steps.push({
        narration: `Inspect edge ${current}->${neighbor.nodeId}.`,
        visited: [...visited],
        frontier: [...queue],
        treeEdges: [...treeEdges],
        currentNode: current,
        currentEdgeId: neighbor.edgeId,
      })

      if (!visited.has(neighbor.nodeId)) {
        visited.add(neighbor.nodeId)
        queue.push(neighbor.nodeId)
        treeEdges.push(neighbor.edgeId)
        steps.push({
          narration: `Visit node ${neighbor.nodeId} and add it to the BFS frontier.`,
          visited: [...visited],
          frontier: [...queue],
          treeEdges: [...treeEdges],
          currentNode: neighbor.nodeId,
          currentEdgeId: neighbor.edgeId,
        })
      }
    }
  }

  steps.push({
    narration: `BFS complete. Reached ${visited.size} node(s).`,
    visited: [...visited],
    frontier: [],
    treeEdges: [...treeEdges],
  })

  return steps
}

function buildDfsProgram(graph: GraphState, source: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []
  const visited = new Set<NodeId>()
  const treeEdges: string[] = []
  const activePathEdges: string[] = []

  function dfs(nodeId: NodeId): void {
    visited.add(nodeId)
    steps.push({
      narration: `Enter node ${nodeId}.`,
      visited: [...visited],
      frontier: [nodeId],
      treeEdges: [...treeEdges],
      currentNode: nodeId,
      pathEdges: [...activePathEdges],
    })

    for (const neighbor of neighborsFor(graph, nodeId)) {
      steps.push({
        narration: `Probe edge ${nodeId}->${neighbor.nodeId}.`,
        visited: [...visited],
        frontier: [nodeId],
        treeEdges: [...treeEdges],
        currentNode: nodeId,
        currentEdgeId: neighbor.edgeId,
        pathEdges: [...activePathEdges],
      })

      if (!visited.has(neighbor.nodeId)) {
        treeEdges.push(neighbor.edgeId)
        activePathEdges.push(neighbor.edgeId)
        dfs(neighbor.nodeId)
        activePathEdges.pop()
        steps.push({
          narration: `Backtrack to node ${nodeId}.`,
          visited: [...visited],
          frontier: [nodeId],
          treeEdges: [...treeEdges],
          currentNode: nodeId,
          pathEdges: [...activePathEdges],
        })
      }
    }
  }

  dfs(source)
  steps.push({
    narration: `DFS complete. Reached ${visited.size} node(s).`,
    visited: [...visited],
    frontier: [],
    treeEdges: [...treeEdges],
    pathEdges: [],
  })

  return steps
}

function buildDijkstraProgram(graph: GraphState, source: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []
  const distances = new Map<NodeId, number>()
  const visited = new Set<NodeId>()
  const treeEdges: string[] = []
  const incomingEdge = new Map<NodeId, string>()

  for (const nodeId of graph.nodes) {
    distances.set(nodeId, Number.POSITIVE_INFINITY)
  }
  distances.set(source, 0)

  const toDistanceRecord = (): Record<number, number> => {
    const record: Record<number, number> = {}
    for (const nodeId of graph.nodes) {
      const value = distances.get(nodeId) ?? Number.POSITIVE_INFINITY
      if (value !== Number.POSITIVE_INFINITY) {
        record[nodeId] = value
      }
    }
    return record
  }

  steps.push({
    narration: `Initialize Dijkstra at node ${source}.`,
    visited: [],
    frontier: [source],
    treeEdges: [],
    currentNode: source,
    distances: toDistanceRecord(),
  })

  while (visited.size < graph.nodes.length) {
    let currentNode: NodeId | null = null
    let currentDistance = Number.POSITIVE_INFINITY

    for (const nodeId of graph.nodes) {
      if (visited.has(nodeId)) {
        continue
      }
      const distance = distances.get(nodeId) ?? Number.POSITIVE_INFINITY
      if (distance < currentDistance) {
        currentDistance = distance
        currentNode = nodeId
      }
    }

    if (currentNode === null || currentDistance === Number.POSITIVE_INFINITY) {
      break
    }

    visited.add(currentNode)
    const edgeId = incomingEdge.get(currentNode)
    if (typeof edgeId === 'string' && !treeEdges.includes(edgeId)) {
      treeEdges.push(edgeId)
    }

    steps.push({
      narration: `Finalize node ${currentNode} with distance ${currentDistance}.`,
      visited: [...visited],
      frontier: graph.nodes.filter((nodeId) => !visited.has(nodeId)),
      treeEdges: [...treeEdges],
      currentNode,
      distances: toDistanceRecord(),
    })

    for (const neighbor of neighborsFor(graph, currentNode)) {
      if (visited.has(neighbor.nodeId)) {
        continue
      }

      const tentative = currentDistance + Math.max(0, neighbor.weight)
      const currentBest = distances.get(neighbor.nodeId) ?? Number.POSITIVE_INFINITY

      steps.push({
        narration: `Relax edge ${currentNode}->${neighbor.nodeId}.`,
        visited: [...visited],
        frontier: graph.nodes.filter((nodeId) => !visited.has(nodeId)),
        treeEdges: [...treeEdges],
        currentNode,
        currentEdgeId: neighbor.edgeId,
        distances: toDistanceRecord(),
      })

      if (tentative < currentBest) {
        distances.set(neighbor.nodeId, tentative)
        incomingEdge.set(neighbor.nodeId, neighbor.edgeId)
        steps.push({
          narration: `Update node ${neighbor.nodeId}: ${currentBest === Number.POSITIVE_INFINITY ? '∞' : currentBest} -> ${tentative}.`,
          visited: [...visited],
          frontier: graph.nodes.filter((nodeId) => !visited.has(nodeId)),
          treeEdges: [...treeEdges],
          currentNode: neighbor.nodeId,
          currentEdgeId: neighbor.edgeId,
          distances: toDistanceRecord(),
        })
      }
    }
  }

  steps.push({
    narration: 'Dijkstra complete.',
    visited: [...visited],
    frontier: [],
    treeEdges: [...treeEdges],
    distances: toDistanceRecord(),
  })

  return steps
}

function unionFind(nodes: NodeId[]) {
  const parent = new Map<NodeId, NodeId>()
  const rank = new Map<NodeId, number>()
  for (const node of nodes) {
    parent.set(node, node)
    rank.set(node, 0)
  }

  const find = (node: NodeId): NodeId => {
    const root = parent.get(node)
    if (typeof root !== 'number') {
      return node
    }
    if (root !== node) {
      const collapsed = find(root)
      parent.set(node, collapsed)
      return collapsed
    }
    return root
  }

  const unite = (left: NodeId, right: NodeId): boolean => {
    const rootLeft = find(left)
    const rootRight = find(right)
    if (rootLeft === rootRight) {
      return false
    }

    const rankLeft = rank.get(rootLeft) ?? 0
    const rankRight = rank.get(rootRight) ?? 0

    if (rankLeft < rankRight) {
      parent.set(rootLeft, rootRight)
    } else if (rankLeft > rankRight) {
      parent.set(rootRight, rootLeft)
    } else {
      parent.set(rootRight, rootLeft)
      rank.set(rootLeft, rankLeft + 1)
    }

    return true
  }

  return { unite }
}

function buildKruskalsProgram(graph: GraphState): CinemaStep[] {
  const steps: CinemaStep[] = []
  const sorted = [...graph.edges].sort((a, b) => a.weight - b.weight)
  const uf = unionFind(graph.nodes)
  const mstEdges: string[] = []
  let totalWeight = 0

  for (const edge of sorted) {
    steps.push({
      narration: `Consider edge ${edge.from}->${edge.to} (w=${edge.weight}).`,
      visited: [],
      frontier: [],
      treeEdges: [],
      currentEdgeId: edge.id,
      mstEdges: [...mstEdges],
      mstWeight: totalWeight,
    })

    if (uf.unite(edge.from, edge.to)) {
      mstEdges.push(edge.id)
      totalWeight += edge.weight
      steps.push({
        narration: `Add edge ${edge.id} to MST. Total weight ${totalWeight}.`,
        visited: [],
        frontier: [],
        treeEdges: [],
        currentEdgeId: edge.id,
        mstEdges: [...mstEdges],
        mstNewEdgeId: edge.id,
        mstWeight: totalWeight,
      })
    } else {
      steps.push({
        narration: `Reject edge ${edge.id}; it forms a cycle.`,
        visited: [],
        frontier: [],
        treeEdges: [],
        currentEdgeId: edge.id,
        mstEdges: [...mstEdges],
        rejectedEdgeId: edge.id,
        mstWeight: totalWeight,
      })
    }
  }

  steps.push({
    narration: `Kruskal complete. MST weight ${totalWeight}.`,
    visited: [],
    frontier: [],
    treeEdges: [],
    mstEdges: [...mstEdges],
    mstWeight: totalWeight,
  })

  return steps
}

function buildPrimsProgram(graph: GraphState, source: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []
  const visited = new Set<NodeId>([source])
  const mstEdges: string[] = []
  let totalWeight = 0

  steps.push({
    narration: `Start Prim's at node ${source}.`,
    visited: [source],
    frontier: [],
    treeEdges: [],
    currentNode: source,
    mstEdges: [],
    mstWeight: 0,
  })

  while (visited.size < graph.nodes.length) {
    let best: GraphEdge | null = null

    for (const edge of graph.edges) {
      const fromVisited = visited.has(edge.from)
      const toVisited = visited.has(edge.to)
      const crossesCut = fromVisited !== toVisited
      if (!crossesCut) {
        continue
      }
      if (best === null || edge.weight < best.weight) {
        best = edge
      }
    }

    if (best === null) {
      break
    }

    const nextNode = visited.has(best.from) ? best.to : best.from
    visited.add(nextNode)
    mstEdges.push(best.id)
    totalWeight += best.weight

    steps.push({
      narration: `Add edge ${best.id}. Include node ${nextNode}.`,
      visited: [...visited],
      frontier: graph.nodes.filter((nodeId) => !visited.has(nodeId)),
      treeEdges: [],
      currentNode: nextNode,
      currentEdgeId: best.id,
      mstEdges: [...mstEdges],
      mstNewEdgeId: best.id,
      mstWeight: totalWeight,
    })
  }

  steps.push({
    narration: `Prim's complete. MST weight ${totalWeight}.`,
    visited: [...visited],
    frontier: [],
    treeEdges: [],
    mstEdges: [...mstEdges],
    mstWeight: totalWeight,
  })

  return steps
}

function bfsAugmentingPath(
  graph: GraphState,
  source: NodeId,
  sink: NodeId,
  flowByEdge: Map<string, number>,
): { edgeIds: string[]; bottleneck: number } | null {
  const previousNode = new Map<NodeId, NodeId>()
  const previousEdge = new Map<NodeId, string>()
  const previousDirection = new Map<NodeId, 1 | -1>()
  const queue: NodeId[] = [source]
  const visited = new Set<NodeId>([source])
  const byId = edgeById(graph)

  while (queue.length > 0) {
    const current = queue.shift()
    if (typeof current !== 'number') {
      continue
    }

    for (const edge of graph.edges) {
      // Forward residual
      if (edge.from === current) {
        const capacity = Math.max(1, edge.weight)
        const flow = flowByEdge.get(edge.id) ?? 0
        const residual = capacity - flow
        if (residual > 0 && !visited.has(edge.to)) {
          visited.add(edge.to)
          previousNode.set(edge.to, current)
          previousEdge.set(edge.to, edge.id)
          previousDirection.set(edge.to, 1)
          queue.push(edge.to)
        }
      }

      // Backward residual
      if (edge.to === current) {
        const flow = flowByEdge.get(edge.id) ?? 0
        if (flow > 0 && !visited.has(edge.from)) {
          visited.add(edge.from)
          previousNode.set(edge.from, current)
          previousEdge.set(edge.from, edge.id)
          previousDirection.set(edge.from, -1)
          queue.push(edge.from)
        }
      }
    }

    if (visited.has(sink)) {
      break
    }
  }

  if (!visited.has(sink)) {
    return null
  }

  const pathEdges: string[] = []
  let bottleneck = Number.POSITIVE_INFINITY
  let walker = sink

  while (walker !== source) {
    const prev = previousNode.get(walker)
    const edgeId = previousEdge.get(walker)
    const direction = previousDirection.get(walker)
    if (typeof prev !== 'number' || typeof edgeId !== 'string' || typeof direction !== 'number') {
      return null
    }

    const edge = byId.get(edgeId)
    if (!edge) {
      return null
    }

    const residual =
      direction === 1
        ? Math.max(1, edge.weight) - (flowByEdge.get(edgeId) ?? 0)
        : flowByEdge.get(edgeId) ?? 0

    bottleneck = Math.min(bottleneck, residual)
    pathEdges.unshift(edgeId)
    walker = prev
  }

  return { edgeIds: pathEdges, bottleneck }
}

function buildMaxFlowProgram(graph: GraphState, source: NodeId, target: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []
  const flowByEdge = new Map<string, number>()

  for (const edge of graph.edges) {
    flowByEdge.set(edge.id, 0)
  }

  steps.push({
    narration: `Start Edmonds-Karp from ${source} to ${target}.`,
    visited: [source],
    frontier: [],
    treeEdges: [],
    currentNode: source,
    flowByEdge: Object.fromEntries(flowByEdge.entries()),
  })

  while (true) {
    const augmenting = bfsAugmentingPath(graph, source, target, flowByEdge)
    if (augmenting === null) {
      break
    }

    steps.push({
      narration: `Found augmenting path with bottleneck ${augmenting.bottleneck}.`,
      visited: [],
      frontier: [],
      treeEdges: [],
      augmentingEdgeIds: augmenting.edgeIds,
      flowByEdge: Object.fromEntries(flowByEdge.entries()),
    })

    for (const edgeId of augmenting.edgeIds) {
      const edge = graph.edges.find((candidate) => candidate.id === edgeId)
      if (!edge) {
        continue
      }
      const current = flowByEdge.get(edge.id) ?? 0
      const capacity = Math.max(1, edge.weight)
      const next = Math.min(capacity, current + augmenting.bottleneck)
      flowByEdge.set(edge.id, next)
    }

    const saturatedEdgeIds = graph.edges
      .filter((edge) => (flowByEdge.get(edge.id) ?? 0) >= Math.max(1, edge.weight))
      .map((edge) => edge.id)

    steps.push({
      narration: 'Apply flow on path.',
      visited: [],
      frontier: [],
      treeEdges: [],
      augmentingEdgeIds: augmenting.edgeIds,
      saturatedEdgeIds,
      flowByEdge: Object.fromEntries(flowByEdge.entries()),
    })
  }

  const maxFlow = graph.edges
    .filter((edge) => edge.from === source)
    .reduce((sum, edge) => sum + (flowByEdge.get(edge.id) ?? 0), 0)

  steps.push({
    narration: `Max flow complete. Total flow ${maxFlow}.`,
    visited: [],
    frontier: [],
    treeEdges: [],
    saturatedEdgeIds: graph.edges
      .filter((edge) => (flowByEdge.get(edge.id) ?? 0) >= Math.max(1, edge.weight))
      .map((edge) => edge.id),
    flowByEdge: Object.fromEntries(flowByEdge.entries()),
  })

  return steps
}

const COMPONENT_COLORS = [
  '#3b82f6', // blue
  '#f97316', // orange
  '#22c55e', // green
  '#a855f7', // purple
  '#eab308', // yellow
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
]
 
function buildConnectedComponentsProgram(graph: GraphState): CinemaStep[] {
  const steps: CinemaStep[] = []
  const visited = new Set<NodeId>()
  // componentOf[nodeId] = index de la composante (0-based)
  const componentOf: Record<NodeId, number> = {}
  // componentMembers[i] = liste des noeuds de la composante i
  const componentMembers: NodeId[][] = []
  let componentIndex = 0
 
  // ── Étape initiale ──────────────────────────────────────────────────────────
  const allIdle: Record<number, { id: number; state: 'idle' }> = {}
  for (const n of graph.nodes) allIdle[n] = { id: n, state: 'idle' }
  const allEdgesIdle: Record<string, { id: string; state: 'idle' }> = {}
  for (const e of graph.edges) allEdgesIdle[e.id] = { id: e.id, state: 'idle' }
 
  steps.push({
    narration: 'Début de la détection des composantes connexes. Chaque composante sera colorée différemment.',
    visited: [],
    frontier: [],
    treeEdges: [],
    componentColors: { ...allIdle },   // on réutilise le champ visited/frontier
    componentMap: {},
  } as unknown as CinemaStep)
 
  // Fonction utilitaire : construit le snapshot complet des noeuds
  function buildNodeSnapshot(): Record<number, { id: number; state: string; badge?: string }> {
    const snap: Record<number, { id: number; state: string; badge?: string }> = {}
    for (const n of graph.nodes) {
      if (typeof componentOf[n] === 'number') {
        snap[n] = { id: n, state: 'visited', badge: `C${componentOf[n] + 1}` }
      } else {
        snap[n] = { id: n, state: 'idle' }
      }
    }
    return snap
  }
 
  // Fonction utilitaire : construit les highlights convex_hull pour chaque composante découverte
  function buildHighlights(): Array<{ type: 'convex_hull' | 'path_trace' | 'global_counter'; nodes?: number[]; value?: string | number; color?: string }> {
    return componentMembers.map((members, idx) => ({
      type: 'convex_hull' as const,
      nodes: [...members],
      color: COMPONENT_COLORS[idx % COMPONENT_COLORS.length],
    }))
  }
 
  // ── Parcours principal ──────────────────────────────────────────────────────
  for (const startNode of graph.nodes) {
    if (visited.has(startNode)) continue
 
    const members: NodeId[] = []
    componentMembers.push(members)
    const color = COMPONENT_COLORS[componentIndex % COMPONENT_COLORS.length]
 
    const queue: NodeId[] = [startNode]
    visited.add(startNode)
    componentOf[startNode] = componentIndex
    members.push(startNode)
 
    // Étape : découverte du nœud racine de la nouvelle composante
    const nodeSnap1 = buildNodeSnapshot()
    nodeSnap1[startNode] = { id: startNode, state: 'visiting', badge: `C${componentIndex + 1}` }
 
    steps.push({
      narration: `Nouvelle composante C${componentIndex + 1} (${color}) — nœud source : ${startNode}.`,
      visited: [...visited],
      frontier: [startNode],
      treeEdges: [],
      _nodes: nodeSnap1,
      _highlights: [...buildHighlights().slice(0, componentIndex), { type: 'convex_hull', nodes: [...members], color }],
    } as unknown as CinemaStep)
 
    while (queue.length > 0) {
      const current = queue.shift()!
     const neighbors = neighborsFor(graph, current, true) 
 
      for (const { nodeId: neighbor, edgeId } of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          componentOf[neighbor] = componentIndex
          members.push(neighbor)
          queue.push(neighbor)
 
          const nodeSnap = buildNodeSnapshot()
          nodeSnap[neighbor] = { id: neighbor, state: 'visiting', badge: `C${componentIndex + 1}` }
          nodeSnap[current] = { id: current, state: 'visited', badge: `C${componentIndex + 1}` }
 
          steps.push({
            narration: `Nœud ${neighbor} ajouté à C${componentIndex + 1} via l'arête (${current} → ${neighbor}).`,
            visited: [...visited],
            frontier: [...queue],
            treeEdges: [],
            currentNode: neighbor,
            currentEdgeId: edgeId,
            _nodes: nodeSnap,
            _highlights: [...buildHighlights().slice(0, componentIndex), { type: 'convex_hull', nodes: [...members], color }],
          } as unknown as CinemaStep)
        }
      }
    }
 
    // Étape : composante terminée
    steps.push({
      narration: `Composante C${componentIndex + 1} complète : {${members.join(', ')}}.`,
      visited: [...visited],
      frontier: [],
      treeEdges: [],
      _nodes: buildNodeSnapshot(),
      _highlights: buildHighlights(),
    } as unknown as CinemaStep)
 
    componentIndex++
  }
 
  // ── Étape finale ────────────────────────────────────────────────────────────
  steps.push({
    narration: `Terminé ! ${componentIndex} composante(s) connexe(s) détectée(s).`,
    visited: [...visited],
    frontier: [],
    treeEdges: [],
    _nodes: buildNodeSnapshot(),
    _highlights: [
      ...buildHighlights(),
      { type: 'global_counter', value: `${componentIndex} composante(s)` },
    ],
  } as unknown as CinemaStep)
 
  return steps
}
 
// ─────────────────────────────────────────────────────────────────────────────
// FORÊT COUVRANTE — DFS multi-source
// Construit un arbre couvrant par composante connexe.
// Les arêtes de l'arbre sont marquées tree_edge.
// ─────────────────────────────────────────────────────────────────────────────
function buildSpanningForestProgram(graph: GraphState): CinemaStep[] {
  const steps: CinemaStep[] = []
  const visited = new Set<NodeId>()
  const forestEdgeIds: string[] = []
  const componentOf: Record<NodeId, number> = {}
  const componentMembers: NodeId[][] = []
  let componentIndex = 0
 
  // Snapshot helpers
  function buildNodeSnapshot(visiting?: NodeId): Record<number, { id: number; state: string; badge?: string }> {
    const snap: Record<number, { id: number; state: string; badge?: string }> = {}
    for (const n of graph.nodes) {
      if (n === visiting) {
        snap[n] = { id: n, state: 'visiting', badge: `T${(componentOf[n] ?? componentIndex) + 1}` }
      } else if (visited.has(n)) {
        snap[n] = { id: n, state: 'visited', badge: `T${componentOf[n] + 1}` }
      } else {
        snap[n] = { id: n, state: 'idle' }
      }
    }
    return snap
  }
 
  function buildEdgeSnapshot(activeEdgeId?: string): Record<string, { id: string; state: string }> {
    const snap: Record<string, { id: string; state: string }> = {}
    for (const e of graph.edges) {
      if (forestEdgeIds.includes(e.id)) {
        snap[e.id] = { id: e.id, state: e.id === activeEdgeId ? 'examining' : 'tree_edge' }
      } else {
        snap[e.id] = { id: e.id, state: 'idle' }
      }
    }
    return snap
  }
 
  function buildHighlights(): Array<{ type: 'convex_hull'; nodes: number[]; color: string }> {
    return componentMembers.map((members, idx) => ({
      type: 'convex_hull' as const,
      nodes: [...members],
      color: COMPONENT_COLORS[idx % COMPONENT_COLORS.length],
    }))
  }
 
  // Étape initiale
  steps.push({
    narration: 'Début de la construction de la forêt couvrante. Un arbre DFS par composante connexe.',
    visited: [],
    frontier: [],
    treeEdges: [],
    _nodes: buildNodeSnapshot(),
    _edges: buildEdgeSnapshot(),
    _highlights: [],
  } as unknown as CinemaStep)
 
  for (const startNode of graph.nodes) {
    if (visited.has(startNode)) continue
 
    const members: NodeId[] = []
    componentMembers.push(members)
 
    const stack: NodeId[] = [startNode]
    visited.add(startNode)
    componentOf[startNode] = componentIndex
    members.push(startNode)
 
    steps.push({
      narration: `Arbre T${componentIndex + 1} : DFS depuis le nœud racine ${startNode}.`,
      visited: [...visited],
      frontier: [startNode],
      treeEdges: [...forestEdgeIds],
      currentNode: startNode,
      _nodes: buildNodeSnapshot(startNode),
      _edges: buildEdgeSnapshot(),
      _highlights: buildHighlights(),
    } as unknown as CinemaStep)
 
    while (stack.length > 0) {
      const current = stack[stack.length - 1]!
 
      // Chercher un voisin non visité
      const unvisitedNeighbor = neighborsFor(graph, current).find(n => !visited.has(n.nodeId))
 
      if (unvisitedNeighbor) {
        const { nodeId: neighbor, edgeId } = unvisitedNeighbor
        visited.add(neighbor)
        componentOf[neighbor] = componentIndex
        members.push(neighbor)
        forestEdgeIds.push(edgeId)
        stack.push(neighbor)
 
        steps.push({
          narration: `Arête (${current} → ${neighbor}) ajoutée à l'arbre T${componentIndex + 1}.`,
          visited: [...visited],
          frontier: [...stack],
          treeEdges: [...forestEdgeIds],
          currentNode: neighbor,
          currentEdgeId: edgeId,
          _nodes: buildNodeSnapshot(neighbor),
          _edges: buildEdgeSnapshot(edgeId),
          _highlights: buildHighlights(),
        } as unknown as CinemaStep)
      } else {
        stack.pop()
      }
    }
 
    steps.push({
      narration: `Arbre T${componentIndex + 1} complet : {${members.join(', ')}}, ${forestEdgeIds.filter(eid => {
        const e = graph.edges.find(x => x.id === eid)
        return e && componentOf[e.from] === componentIndex
      }).length} arête(s).`,
      visited: [...visited],
      frontier: [],
      treeEdges: [...forestEdgeIds],
      _nodes: buildNodeSnapshot(),
      _edges: buildEdgeSnapshot(),
      _highlights: buildHighlights(),
    } as unknown as CinemaStep)
 
    componentIndex++
  }
 
  // Étape finale
  steps.push({
    narration: `Forêt couvrante complète : ${componentIndex} arbre(s), ${forestEdgeIds.length} arête(s) au total.`,
    visited: [...visited],
    frontier: [],
    treeEdges: [...forestEdgeIds],
    _nodes: buildNodeSnapshot(),
    _edges: buildEdgeSnapshot(),
    _highlights: [
      ...buildHighlights(),
      { type: 'global_counter' as const, value: `${forestEdgeIds.length} arête(s) dans la forêt` },
    ],
  } as unknown as CinemaStep)
 
  return steps
}
function buildStronglyConnectedComponentsProgram(graph: GraphState): CinemaStep[] {
  const steps: CinemaStep[] = []

  if (!graph.directed) {
    steps.push({
      narration: 'SCC nécessite un graphe orienté.',
      visited: [],
      frontier: [],
      treeEdges: [],
    })
    return steps
  }

  const visited = new Set<NodeId>()
  const stack: NodeId[] = []

  function dfs(node: NodeId) {
    visited.add(node)
    for (const n of neighborsFor(graph, node)) {
      if (!visited.has(n.nodeId)) dfs(n.nodeId)
    }
    stack.push(node)
  }

  // 1er passage
  for (const node of graph.nodes) {
    if (!visited.has(node)) dfs(node)
  }

  // Inverser le graphe
  const reversed: GraphState = {
    ...graph,
    edges: graph.edges.map(e => ({
      ...e,
      from: e.to,
      to: e.from,
    })),
  }

  visited.clear()
  let componentIndex = 0

  function dfs2(node: NodeId, comp: NodeId[]) {
    visited.add(node)
    comp.push(node)

    for (const n of neighborsFor(reversed, node)) {
      if (!visited.has(n.nodeId)) dfs2(n.nodeId, comp)
    }
  }

  while (stack.length > 0) {
    const node = stack.pop()!

    if (!visited.has(node)) {
      const comp: NodeId[] = []
      dfs2(node, comp)

      steps.push({
        narration: `Composante fortement connexe C${componentIndex + 1} : {${comp.join(', ')}}`,
        visited: [...comp],
        frontier: [],
        treeEdges: [],
      })

      componentIndex++
    }
  }

  steps.push({
    narration: `Total SCC trouvées : ${componentIndex}`,
    visited: [],
    frontier: [],
    treeEdges: [],
  })

  return steps
}

function buildSearchChainProgram(graph: GraphState, source: NodeId, target: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []

  // Étape 1: Présentation (label selon orientation)
  const pathLabel = graph.directed ? 'Chemin' : 'Chaîne'
  steps.push({
    narration: `Recherche ${pathLabel.toLowerCase()} de ${source} à ${target}`,
    visited: [],
    frontier: [],
    treeEdges: []
  })

  // BFS pour trouver la chaîne
  const visited = new Set<NodeId>([source])
  const parent: Record<NodeId, NodeId | null> = {}
  parent[source] = null
  const queue: NodeId[] = [source]
  const treeEdgesAccumulated: string[] = []
  let foundTarget = false

  // Étape 2: Initialisation
  steps.push({
    narration: `Sommet source: ${source}`,
    visited: [source],
    frontier: [source],
    treeEdges: []
  })

  // BFS
  while (queue.length > 0) {
    const node = queue.shift()!

    if (node === target) {
      foundTarget = true
      break
    }

    // Trouver les voisins selon l'orientation du graphe
    const neighbors = graph.directed
      ? graph.edges
          .filter(e => e.from === node)
          .map(e => e.to)
          .filter(n => !visited.has(n))
      : graph.edges
          .filter(e => (e.from === node || e.to === node))
          .map(e => (e.from === node ? e.to : e.from))
          .filter(n => !visited.has(n))

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        parent[neighbor] = node
        queue.push(neighbor)

        // Étape : exploration du voisin (trouver l'arête correspondante)
        const edge = graph.edges.find(e => {
          if (graph.directed) return e.from === node && e.to === neighbor
          return (e.from === node && e.to === neighbor) || (e.from === neighbor && e.to === node)
        })

        if (edge) {
          treeEdgesAccumulated.push(edge.id)
        }

        steps.push({
          narration: `Explorer ${node} → ${neighbor}`,
          visited: Array.from(visited),
          frontier: [neighbor, ...queue],
          treeEdges: [...treeEdgesAccumulated],
          currentNode: neighbor,
          currentEdgeId: edge?.id
        })

        if (neighbor === target) {
          foundTarget = true
          break
        }
      }
    }
  }

  if (!foundTarget) {
    // Pas de chemin/chaîne trouvé(e)
    steps.push({
      narration: `❌ Aucun ${pathLabel.toLowerCase()} de ${source} à ${target}`,
      visited: Array.from(visited),
      frontier: [],
      treeEdges: []
    })
    return steps
  }

  // Reconstruire la chaîne
  const chain: NodeId[] = []
  let curr: NodeId | null = target
  while (curr !== null) {
    chain.unshift(curr)
    curr = parent[curr] || null
  }

  // Étape finale: chemin/chaîne trouvée
  steps.push({
    narration: `✅ ${pathLabel} trouvé(e): ${chain.join(' → ')}`,
    visited: chain,
    frontier: [],
    treeEdges: graph.edges
      .filter((e) => {
        for (let j = 0; j < chain.length - 1; j++) {
          if (graph.directed) {
            if (e.from === chain[j] && e.to === chain[j + 1]) return true
          } else {
            if ((e.from === chain[j] && e.to === chain[j + 1]) ||
                (e.from === chain[j + 1] && e.to === chain[j])) return true
          }
        }
        return false
      })
      .map(e => e.id)
  })

  return steps
}

function buildEulerienProgram(graph: GraphState, source: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []
  const report = buildEulerianTraceReport(graph.nodes, graph.edges, graph.directed)
  const properties = report.properties
  const degreeSummary = graph.nodes
    .map((nodeId) => `${nodeId}=${graph.edges.reduce((degree, edge) => degree + (edge.from === nodeId || edge.to === nodeId ? 1 : 0), 0)}`)
    .join(', ')
  const chainStatus = report.chainMessage
  const cycleStatus = report.cycleMessage
  const verdict = report.verdictMessage

  steps.push({
    narration: `Analyse eulérienne du graphe: ${graph.nodes.length} sommet(s), ${graph.edges.length} arête(s).`,
    visited: [],
    frontier: [],
    treeEdges: [],
  })

  steps.push({
    narration: `Connexité: ${properties.isConnexe ? 'oui' : 'non'}. ${properties.ruleMatched}`,
    visited: [],
    frontier: [],
    treeEdges: [],
  })

  steps.push({
    narration: `Degrés: ${degreeSummary || 'aucun sommet'}. Sommets impairs: ${properties.oddNodes.length > 0 ? properties.oddNodes.join(', ') : 'aucun'}.`,
    visited: graph.nodes,
    frontier: properties.oddNodes,
    treeEdges: graph.edges.map((edge) => edge.id),
  })

  steps.push({
    narration: chainStatus,
    visited: graph.nodes,
    frontier: properties.oddNodes,
    treeEdges: [],
  })

  steps.push({
    narration: cycleStatus,
    visited: graph.nodes,
    frontier: [],
    treeEdges: [],
  })

  steps.push({
    narration: verdict,
    visited: graph.nodes,
    frontier: [],
    treeEdges: [],
  })

  if (!properties.hasEulerianPathOrChain || !report.chainTrace) {
    return steps
  }

  const startNode = properties.oddDegreeCount === 2 && properties.oddNodes.length > 0 ? properties.oddNodes[0] : source
  const usedEdges = new Set<string>()

  steps.push({
    narration: `Départ du parcours eulérien depuis ${startNode}.`,
    visited: [startNode],
    frontier: [startNode],
    treeEdges: [],
    currentNode: startNode,
  })

  for (let index = 0; index < report.chainTrace.length - 1; index++) {
    const from = report.chainTrace[index]
    const to = report.chainTrace[index + 1]
    const edge = graph.edges.find((candidate) => {
      if (usedEdges.has(candidate.id)) {
        return false
      }
      return (
        (candidate.from === from && candidate.to === to) ||
        (!graph.directed && candidate.from === to && candidate.to === from)
      )
    })

    if (!edge) {
      continue
    }

    usedEdges.add(edge.id)

    steps.push({
      narration: `Traverser ${from} → ${to}.`,
      visited: report.chainTrace.slice(0, index + 2),
      frontier: [to],
      treeEdges: Array.from(usedEdges),
      currentNode: to,
      currentEdgeId: edge.id,
    })
  }

  steps.push({
    narration: `${report.chainMessage} ${report.cycleMessage} ${report.verdictMessage}`,
    visited: report.chainTrace,
    frontier: [],
    treeEdges: Array.from(usedEdges),
  })

  return steps
}
 
function buildEulerianPathProgram(graph: GraphState): CinemaStep[] {
  const steps: CinemaStep[] = []
  
  const path = findEulerianPathOrCircuit(graph.nodes, graph.edges)
  
  if (!path || path.length === 0) {
    steps.push({
      narration: "Ce graphe ne possède ni chemin ni circuit eulérien. (Vérifiez la connexité et la parité des degrés).",
      visited: [],
      frontier: [],
      treeEdges: [],
    })
    return steps
  }

  const visitedNodes: NodeId[] = [path[0]]
  const visitedEdgeIds: string[] = []
  const usedEdgeIds = new Set<string>()

  steps.push({
    narration: `Début du parcours eulérien depuis le nœud ${path[0]}.`,
    visited: [path[0]],
    frontier: [],
    treeEdges: [],
    currentNode: path[0],
  })

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]
    const to = path[i + 1]

    const edge = graph.edges.find(e => {
      if (usedEdgeIds.has(e.id)) return false
      if (graph.directed) {
        return e.from === from && e.to === to
      } else {
        return (e.from === from && e.to === to) || (e.from === to && e.to === from)
      }
    })

    if (edge) {
      usedEdgeIds.add(edge.id)
      visitedEdgeIds.push(edge.id)
      if (!visitedNodes.includes(to)) visitedNodes.push(to)

      steps.push({
        narration: `Traversée de l'arête ${from} → ${to}.`,
        visited: [...visitedNodes],
        frontier: [],
        treeEdges: [...visitedEdgeIds],
        currentNode: to,
        currentEdgeId: edge.id,
      })
    }
  }

  steps.push({
    narration: `Parcours eulérien terminé ! Total : ${visitedEdgeIds.length} arêtes parcourues.`,
    visited: [...visitedNodes],
    frontier: [],
    treeEdges: [...visitedEdgeIds],
  })

  return steps
}

function buildWelshPowellProgram(graph: GraphState): CinemaStep[] {
  const steps: CinemaStep[] = []
  
  // Sorting nodes by degree descending
  const degrees = graph.nodes.map(nodeId => ({
    nodeId,
    degree: graph.edges.reduce((acc, edge) => acc + (edge.from === nodeId || edge.to === nodeId ? 1 : 0), 0)
  })).sort((a, b) => b.degree - a.degree)

  const colors = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#eab308', '#06b6d4', '#ec4899', '#84cc16']
  const nodeColors = new Map<NodeId, string>()
  const groups: Array<{ color: string; nodeIds: NodeId[] }> = []

  steps.push({
    narration: "Démarrage de l'algorithme de Welsh-Powell pour la coloration du graphe. Tri des sommets par degré décroissant.",
    visited: [],
    frontier: degrees.map(d => d.nodeId),
    treeEdges: [],
    colorGroups: []
  })

  let currentColorIndex = 0
  const uncoloredNodes = new Set(graph.nodes)

  while (uncoloredNodes.size > 0) {
    const color = colors[currentColorIndex % colors.length]
    const currentGroup: NodeId[] = []
    
    steps.push({
      narration: `Traitement de la couleur ${currentColorIndex + 1} (${color}).`,
      visited: Array.from(nodeColors.keys()),
      frontier: Array.from(uncoloredNodes),
      treeEdges: [],
      colorGroups: [...groups, { color, nodeIds: currentGroup }]
    })

    for (const { nodeId } of degrees) {
      if (uncoloredNodes.has(nodeId)) {
        // Check if any neighbor has the same color in currentGroup
        const neighbors = neighborsFor(graph, nodeId, true)
        const hasConflict = neighbors.some(n => currentGroup.includes(n.nodeId))
        
        if (!hasConflict) {
          uncoloredNodes.delete(nodeId)
          nodeColors.set(nodeId, color)
          currentGroup.push(nodeId)
          
          steps.push({
            narration: `Coloration du sommet ${nodeId} en ${color}. Aucun conflit avec le groupe actuel.`,
            visited: Array.from(nodeColors.keys()),
            frontier: Array.from(uncoloredNodes),
            treeEdges: [],
            currentNode: nodeId,
            colorGroups: [...groups, { color, nodeIds: [...currentGroup] }]
          })
        }
      }
    }
    
    groups.push({ color, nodeIds: currentGroup })
    currentColorIndex++
  }

  steps.push({
    narration: `Coloration de Welsh-Powell terminée. ${groups.length} couleurs utilisées.`,
    visited: graph.nodes,
    frontier: [],
    treeEdges: [],
    colorGroups: groups
  })

  return steps
}

function buildAllCyclesProgram(graph: GraphState): CinemaStep[] {
  const steps: CinemaStep[] = []
  const isDirected = graph.directed
  const cycleType = isDirected ? 'cycle' : 'circuit'
  const cycleLabelEn = isDirected ? 'cycles' : 'circuits'

  // Récupérer tous les cycles
  const allCycles = isDirected
    ? findAllDirectedCycles(graph.nodes, graph.edges)
    : findAllUndirectedCycles(graph.nodes, graph.edges)

  steps.push({
    narration: `Initialisation: Recherche de TOUS les ${cycleLabelEn} dans le graphe ${isDirected ? 'orienté' : 'non orienté'}.`,
    visited: [],
    frontier: [],
    treeEdges: []
  })

  if (allCycles.length === 0) {
    steps.push({
      narration: `Résultat: Aucun ${cycleType} détecté dans le graphe. Le graphe est acyclique.`,
      visited: [],
      frontier: [],
      treeEdges: []
    })
    return steps
  }

  steps.push({
    narration: `${allCycles.length} ${cycleLabelEn} trouvé(s). Affichage de chacun...`,
    visited: [],
    frontier: [],
    treeEdges: []
  })

  // Visualiser chaque cycle
  allCycles.forEach((cycle, cycleIndex) => {
    // Trouver les arêtes du cycle
    const treeEdges: string[] = []
    for (let i = 0; i < cycle.length - 1; i++) {
      const from = cycle[i]
      const to = cycle[i + 1]
      const matchingEdge = graph.edges.find(e =>
        (e.from === from && e.to === to) ||
        (!isDirected && e.from === to && e.to === from)
      )
      if (matchingEdge) {
        treeEdges.push(matchingEdge.id)
      }
    }

    const cycleLabel = cycle.join(' → ')
    steps.push({
      narration: `${cycleType} #${cycleIndex + 1}: ${cycleLabel}`,
      visited: cycle,
      frontier: [],
      treeEdges
    })
  })

  steps.push({
    narration: `Résultat final: ${allCycles.length} ${cycleLabelEn} au total ont été détectés dans ce graphe.`,
    visited: graph.nodes,
    frontier: [],
    treeEdges: []
  })

  return steps
}

export function buildCinemaProgram(
  graph: GraphState,
  algorithm: CinemaAlgorithm,
  source: NodeId,
  target?: NodeId,
): CinemaProgram {
  const steps: CinemaStep[] = (() => {
    switch (algorithm) {
      case 'BFS':
        return buildBfsProgram(graph, source)
      case 'DFS':
        return buildDfsProgram(graph, source)
      case 'Dijkstra':
        return buildDijkstraProgram(graph, source)
      case 'Prims':
        return buildPrimsProgram(graph, source)
      case 'Kruskals':
        return buildKruskalsProgram(graph)
      case 'MaxFlow':
        return buildMaxFlowProgram(graph, source, typeof target === 'number' ? target : source)
      case 'ConnectedComponents':
        return buildConnectedComponentsProgram(graph)
      case 'SpanningForest':
        return buildSpanningForestProgram(graph)
      case 'EulerienPath':
        return buildEulerienProgram(graph, source)
      case 'RechercheChaine':
        return buildSearchChainProgram(graph, source, typeof target === 'number' ? target : source)
      case 'StronglyConnectedComponents':
        return buildStronglyConnectedComponentsProgram(graph)
      case 'WelshPowell':
        return buildWelshPowellProgram(graph)
      case 'AllCycles':
        return buildAllCyclesProgram(graph)
      case 'Bellman':
      case 'BellmanFord':
        return buildBellmanProgram(graph, source)
      default:
        return []
    }
  })()
 
  return {
    algorithm,
    steps,
    source,
    target,
    graphSignature: graphSignature(graph),
  }
}
 
export function speedToInterval(speed: number): number {
  return Math.max(60, Math.round(900 / Math.max(0.25, speed)))
}

function buildBellmanProgram(graph: GraphState, source: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []

  const distances = new Map<NodeId, number>()
  const parent = new Map<NodeId, string>() // 🔥 IMPORTANT
  const treeEdges: string[] = []

  // Initialize
  for (const node of graph.nodes) {
    distances.set(node, Number.POSITIVE_INFINITY)
  }
  distances.set(source, 0)

  const toDistanceRecord = (): Record<number, number> => {
    const record: Record<number, number> = {}
    for (const node of graph.nodes) {
      const val = distances.get(node)!
      if (val !== Number.POSITIVE_INFINITY) {
        record[node] = val
      }
    }
    return record
  }

  // 🔥 Rebuild treeEdges from parent
  const rebuildTreeEdges = () => {
    return Array.from(parent.values())
  }

  // Initial step
  steps.push({
    narration: `Initialize Bellman algorithm from source node ${source}.`,
    visited: [],
    frontier: [source],
    treeEdges: [],
    currentNode: source,
    distances: toDistanceRecord(),
  })

  // Relax edges
  for (let i = 0; i < graph.nodes.length - 1; i++) {

    steps.push({
      narration: `Iteration ${i + 1} over all edges.`,
      visited: [],
      frontier: [],
      treeEdges: rebuildTreeEdges(),
      distances: toDistanceRecord(),
    })

    for (const edge of graph.edges) {
      const u = edge.from
      const v = edge.to
      const weight = graph.weighted ? edge.weight : 1

      const du = distances.get(u)!
      const dv = distances.get(v)!

      // Inspect
      steps.push({
        narration: `Inspect edge ${u} → ${v} with weight ${weight}.`,
        visited: [],
        frontier: [],
        treeEdges: rebuildTreeEdges(),
        currentEdgeId: edge.id,
        currentNode: u,
        distances: toDistanceRecord(),
      })

      // Relaxation
      if (du !== Infinity && du + weight < dv) {

        distances.set(v, du + weight)

        // 🔥 overwrite parent (IMPORTANT)
        parent.set(v, edge.id)

        steps.push({
          narration: `Update node ${v}: ${dv === Infinity ? '∞' : dv} → ${du + weight} (better path found).`,
          visited: [],
          frontier: [],
          treeEdges: rebuildTreeEdges(),
          currentNode: v,
          currentEdgeId: edge.id,
          distances: toDistanceRecord(),
        })
      }
    }
  }

  // Final
  steps.push({
    narration: `Bellman complete. Each node keeps only the best incoming edge.`,
    visited: [],
    frontier: [],
    treeEdges: rebuildTreeEdges(),
    distances: toDistanceRecord(),
  })

  return steps
}