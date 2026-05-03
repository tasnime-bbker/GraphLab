import { path } from 'd3'
import type { GraphEdge, GraphState, NodeId } from '../../graph/model/types'
import { findEulerianPathOrCircuit, buildEulerianTraceReport } from '../../graph/utils/graphAnalysis'

export type CinemaAlgorithm = 'BFS' | 'DFS' | 'Dijkstra' | 'Prims' | 'Kruskals' | 'MaxFlow' | 'ConnectedComponents' | 'SpanningForest' | 'StronglyConnectedComponents' | 'Bellman' | 'BellmanFord' | 'WelshPowell' | 'EdgeColoring' | 'EulerienPath' | 'RechercheChaine'

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
  /** Custom colors for nodes and edges (Spanning Forest, etc.) */
  nodeColors?: Record<number, string>
  edgeColors?: Record<string, string>
  // graphe résiduel pour FLowMAX, avec capacité restante et indication de sens (forward/backward)
  residualEdges?: Array<{
    from: NodeId
    to: NodeId
    capacity: number
    isBackward: boolean
    originalEdgeId: string
  }>,
  augmentingPathIndex?: number   // numéro du chemin (1er, 2ème, 3ème...)
  bottleneck?: number,
  // valeur du bottleneck de ce chemin
  pathHistory?: Array<{
  index: number
  bottleneck: number
  edgeIds: string[]
  edgeLabels: string[]   //: "1→2", "2→3" etc.

}>
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
/*
function buildDijkstraProgram(graph: GraphState, source: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []

  // Edge Case: Negative Weights
  const hasNegativeWeights = graph.edges.some(e => e.weight < 0)
  if (hasNegativeWeights) {
    steps.push({
      narration: "⚠️ Erreur : L'algorithme de Dijkstra ne supporte pas les poids négatifs. Veuillez utiliser Bellman-Ford pour ce graphe.",
      visited: [],
      frontier: [],
      treeEdges: [],
    })
    return steps
  }
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
*/
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

  if (graph.nodes.length === 0) {
    steps.push({ narration: 'Kruskal : graphe vide — rien à faire.', visited: [], frontier: [], treeEdges: [] })
    return steps
  }

  // ── Union-Find with path compression + union by rank ─────────────────────
  const parent = new Map<NodeId, NodeId>()
  const rank   = new Map<NodeId, number>()
  for (const node of graph.nodes) {
    parent.set(node, node)
    rank.set(node, 0)
  }

  function find(x: NodeId): NodeId {
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)!)) // path compression
    }
    return parent.get(x)!
  }

  function union(a: NodeId, b: NodeId): boolean {
    const ra = find(a)
    const rb = find(b)
    if (ra === rb) return false          // same component → cycle
    // union by rank
    if ((rank.get(ra) ?? 0) < (rank.get(rb) ?? 0)) {
      parent.set(ra, rb)
    } else if ((rank.get(ra) ?? 0) > (rank.get(rb) ?? 0)) {
      parent.set(rb, ra)
    } else {
      parent.set(rb, ra)
      rank.set(ra, (rank.get(ra) ?? 0) + 1)
    }
    return true
  }

  // ── Deduplicate undirected edge pairs, then sort by weight ───────────────
  const seen = new Set<string>()
  const candidates = graph.edges
    .filter(e => {
      const key = e.from < e.to ? `${e.from}-${e.to}` : `${e.to}-${e.from}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(e => ({ ...e, w: graph.weighted ? e.weight : 1 }))
    .sort((a, b) => a.w - b.w)

  const N = graph.nodes.length
  const mstEdges: string[] = []
  let totalWeight = 0
  const inMst = new Set<NodeId>()

  // ── Step 0 — show the sorted candidate list ───────────────────────────────
  const sortedSummary = candidates
    .map(e => `(${e.from}↔${e.to}, p=${e.w})`)
    .join(', ')
  steps.push({
    narration: `Kruskal — initialisation. ${candidates.length} arête(s) triée(s) par poids croissant : ${sortedSummary}.`,
    visited: [],
    frontier: [],
    treeEdges: [],
    mstEdges: [],
    mstWeight: 0,
  })

  // ── Main loop ─────────────────────────────────────────────────────────────
  for (const edge of candidates) {
    if (mstEdges.length === N - 1) break  // MST complete

    const cycleWouldForm = find(edge.from) === find(edge.to)

    if (cycleWouldForm) {
      // ── Find the path in the current MST that forms the cycle ──────────────
      const cycleEdges: string[] = []
      const adj = new Map<NodeId, Array<{ to: NodeId; edgeId: string }>>()
      const mstEdgeSet = new Set(mstEdges)
      
      for (const e of graph.edges) {
        if (mstEdgeSet.has(e.id)) {
          if (!adj.has(e.from)) adj.set(e.from, [])
          if (!adj.has(e.to)) adj.set(e.to, [])
          adj.get(e.from)!.push({ to: e.to, edgeId: e.id })
          adj.get(e.to)!.push({ to: e.from, edgeId: e.id })
        }
      }

      const queue: Array<{ node: NodeId; path: string[] }> = [{ node: edge.from, path: [] }]
      const visited = new Set<NodeId>([edge.from])
      let foundPath: string[] = []

      while (queue.length > 0) {
        const { node, path } = queue.shift()!
        if (node === edge.to) {
          foundPath = path
          break
        }
        for (const neighbor of (adj.get(node) || [])) {
          if (!visited.has(neighbor.to)) {
            visited.add(neighbor.to)
            queue.push({ node: neighbor.to, path: [...path, neighbor.edgeId] })
          }
        }
      }

      const edgeColors: Record<string, string> = {}
      foundPath.forEach(id => { edgeColors[id] = '#ef4444' }) // Red highlight for cycle
      edgeColors[edge.id] = '#ef4444' // The rejected edge itself

      const nodeColors: Record<number, string> = {}
      // Optional: highlight nodes in the cycle too
      const cycleNodes = new Set<NodeId>([edge.from, edge.to])
      // we could trace nodes from foundPath if needed

      // Rejected — would create a cycle
      steps.push({
        narration: `❌ Arête ${edge.from}↔${edge.to} (p=${edge.w}) rejetée — formerait un cycle dans le MST.`,
        visited: [...inMst],
        frontier: [],
        treeEdges: [],
        currentEdgeId: edge.id,
        rejectedEdgeId: edge.id,
        mstEdges: [...mstEdges],
        mstWeight: totalWeight,
        edgeColors,
      })
    } else {
      // Accepted — merge components
      union(edge.from, edge.to)
      mstEdges.push(edge.id)
      inMst.add(edge.from)
      inMst.add(edge.to)
      totalWeight += edge.w

      steps.push({
        narration: `✅ Arête ${edge.from}↔${edge.to} (p=${edge.w}) ajoutée au MST. `
          + `MST = {${mstEdges.length} arête(s)} | Poids total = ${totalWeight}.`,
        visited: [...inMst],
        frontier: [],
        treeEdges: [],
        currentEdgeId: edge.id,
        mstEdges: [...mstEdges],
        mstNewEdgeId: edge.id,
        mstWeight: totalWeight,
      })
    }
  }

  // ── Final step ────────────────────────────────────────────────────────────
  const isComplete = mstEdges.length === N - 1
  steps.push({
    narration: isComplete
      ? `✅ Kruskal terminé ! MST optimal trouvé — ${mstEdges.length} arête(s), poids total = ${totalWeight}.`
      : `⚠️ Graphe non connexe. MST partiel : ${mstEdges.length} arête(s), poids = ${totalWeight}.`,
    visited: [...inMst],
    frontier: [],
    treeEdges: [],
    mstEdges: [...mstEdges],
    mstWeight: totalWeight,
  })

  return steps
}

function buildPrimsProgram(graph: GraphState, source: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []

  // ── Vérification graphe non dirigé ───────────────────────────────────────
  if (graph.directed) {
    steps.push({
      narration: "Prim nécessite un graphe non orienté.",
      visited: [], frontier: [], treeEdges: [],
    })
    return steps
  }

  const visited = new Set<NodeId>([source])
  const mstEdges: string[] = []
  let totalWeight = 0

  // ── PHASE 0 : Initialisation ──────────────────────────────────────────────
  steps.push({
    narration: `Initialisation — On part du nœud ${source}. `
             + `Tous les autres nœuds {${graph.nodes.filter(n => n !== source).join(', ')}} `
             + `sont non visités. L'arbre MST est vide.`,
    visited: [source],
    frontier: graph.nodes.filter(n => n !== source),
    treeEdges: [],
    currentNode: source,
    mstEdges: [],
    mstWeight: 0,
  })

  while (visited.size < graph.nodes.length) {

    // ── PHASE 1 : Identifier les arêtes candidates (la coupe) ─────────────
    const candidates: GraphEdge[] = []
    for (const edge of graph.edges) {
      const fromVisited = visited.has(edge.from)
      const toVisited   = visited.has(edge.to)
      if (fromVisited !== toVisited) {
        candidates.push(edge)
      }
    }

    if (candidates.length === 0) break

    steps.push({
      narration: `Coupe actuelle — Visités : {${[...visited].join(', ')}}. `
               + `Non-visités : {${graph.nodes.filter(n => !visited.has(n)).join(', ')}}. `
               + `Arêtes candidates : ${candidates.map(e => `(${e.from},${e.to}) w=${e.weight}`).join(' | ')}.`,
      visited: [...visited],
      frontier: graph.nodes.filter(n => !visited.has(n)),
      treeEdges: [...mstEdges],
      mstEdges: [...mstEdges],
      mstWeight: totalWeight,
    })

    // ── PHASE 2 : Examiner chaque candidat ───────────────────────────────
    let best: GraphEdge | null = null

    for (const edge of candidates) {
      const isBetter = best === null || edge.weight < best.weight
      const isEqual  = best !== null && edge.weight === best.weight
      const isWorse  = best !== null && edge.weight > best.weight

      steps.push({
        narration: isBetter
          ? best === null
            ? `Examen de (${edge.from},${edge.to}) w=${edge.weight} → première candidate, retenue.`
            : `Examen de (${edge.from},${edge.to}) w=${edge.weight} → meilleure que (${best.from},${best.to}) w=${best.weight}, remplace la candidate.`
          : isEqual
            ? `Examen de (${edge.from},${edge.to}) w=${edge.weight} → même poids que (${best!.from},${best!.to}) w=${best!.weight}, on garde la première trouvée.`
            : `Examen de (${edge.from},${edge.to}) w=${edge.weight} → plus coûteuse que (${best!.from},${best!.to}) w=${best!.weight}, ignorée.`,
        visited: [...visited],
        frontier: graph.nodes.filter(n => !visited.has(n)),
        treeEdges: [...mstEdges],
        currentEdgeId: edge.id,
        mstEdges: [...mstEdges],
        mstWeight: totalWeight,
        ...(isBetter
          ? { mstNewEdgeId: edge.id }
          : isWorse
            ? { rejectedEdgeId: edge.id }
            : {}  // égale → ni vert ni rouge, juste examinée
        ),
      })

      if (isBetter) best = edge
    }

    // ── PHASE 3 : Ajouter la meilleure arête à l'arbre ────────────────────
    if (best === null) break

    const nextNode = visited.has(best.from) ? best.to : best.from
    visited.add(nextNode)
    mstEdges.push(best.id)
    totalWeight += best.weight

    steps.push({
      narration: `Choix — (${best.from},${best.to}) w=${best.weight} est la moins coûteuse parmi les candidates. `
               + `On ajoute le nœud ${nextNode} à l'arbre. `
               + `Poids total MST = ${totalWeight}.`,
      visited: [...visited],
      frontier: graph.nodes.filter(n => !visited.has(n)),
      treeEdges: [...mstEdges],
      currentNode: nextNode,
      currentEdgeId: best.id,
      mstEdges: [...mstEdges],
      mstNewEdgeId: best.id,
      mstWeight: totalWeight,
    })

    // ── PHASE 4 : Bilan de l'itération ───────────────────────────────────
    const remaining = graph.nodes.filter(n => !visited.has(n))
    if (remaining.length > 0) {
      steps.push({
        narration: `Bilan — MST contient ${mstEdges.length} arête(s), poids cumulé = ${totalWeight}. `
                 + `Il reste ${remaining.length} nœud(s) à visiter : {${remaining.join(', ')}}. `
                 + `On recommence avec la nouvelle coupe.`,
        visited: [...visited],
        frontier: remaining,
        treeEdges: [...mstEdges],
        mstEdges: [...mstEdges],
        mstWeight: totalWeight,
      })
    }
  }

  // ── PHASE FINALE ──────────────────────────────────────────────────────────
  const isComplete = visited.size === graph.nodes.length
  steps.push({
    narration: isComplete
      ? `Prim terminé ✓ — L'arbre couvrant minimal est complet. `
      + `${mstEdges.length} arête(s), poids total = ${totalWeight}. `
      + `Arêtes MST : ${mstEdges.map(eid => {
          const e = graph.edges.find(x => x.id === eid)
          return e ? `(${e.from},${e.to}) w=${e.weight}` : eid
        }).join(', ')}.`
      : `Prim terminé — Graphe non connexe. `
      + `Arbre partiel : ${mstEdges.length} arête(s), poids = ${totalWeight}. `
      + `Nœuds non atteints : {${graph.nodes.filter(n => !visited.has(n)).join(', ')}}.`,
    visited: [...visited],
    frontier: [],
    treeEdges: [...mstEdges],
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
/*
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
*/
// FORD-FULKERSON — Recherche d'un chemin augmentant via DFS
// ─────────────────────────────────────────────────────────────────────────────

function dfsAugmentingPath(
  graph: GraphState,               // le graphe complet
  source: NodeId,                  // nœud de départ
  sink: NodeId,                    // nœud d'arrivée (le puits)
  flowByEdge: Map<string, number>, // flow actuel sur chaque arête
): { edgeIds: string[]; directions: (1 | -1)[]; bottleneck: number } | null {

  // On mémorise les nœuds déjà visités pour éviter les boucles infinies
  // On y met la source directement car on part d'elle
  const visited = new Set<NodeId>([source])

  // Le chemin en cours d'exploration
  // Chaque entrée = une arête empruntée + sa direction (1=normal, -1=inverse)
  const path: { edgeId: string; direction: 1 | -1; from: NodeId; to: NodeId }[] = []

  // ── Exploration DFS récursive ──────────────────────────────────────────────
  function dfs(current: NodeId): boolean {

    // On est arrivé au puits → chemin trouvé → on s'arrête
    if (current === sink) return true

    // On regarde toutes les arêtes du graphe
    for (const edge of graph.edges) {

      // ── CAS 1 : arête FORWARD (sens normal) ───────────────────────────────
      // Cette arête part du nœud où on est
      if (edge.from === current) {

        // Capacité de l'arête (minimum 1 pour éviter les capacités nulles)
        const capacity = Math.max(1, edge.weight)

        // Flow qui circule déjà sur cette arête
        const flow = flowByEdge.get(edge.id) ?? 0

        // Place restante = capacité - ce qui est déjà utilisé
        const residual = capacity - flow

        // On emprunte cette arête seulement si :
        // - il reste de la place (residual > 0)
        // - on n'a pas déjà visité le nœud au bout
        if (residual > 0 && !visited.has(edge.to)) {

          // On marque le nœud suivant comme visité
          visited.add(edge.to)

          // On ajoute cette arête au chemin en cours (sens normal = 1)
          path.push({ edgeId: edge.id, direction: 1, from: edge.from, to: edge.to })

          // On continue l'exploration depuis le nœud suivant
          // Si on atteint le puits → on remonte immédiatement
          if (dfs(edge.to)) return true

          // Cette route ne mène pas au puits → backtrack
          // On efface cette arête du chemin et on essaie une autre route
          path.pop()
        }
      }

      // ── CAS 2 : arête BACKWARD (sens inverse) ─────────────────────────────
      // Cette arête arrive au nœud où on est
      // On peut la remonter à l'envers pour annuler du flow déjà envoyé
      // C'est la magie de Ford-Fulkerson : corriger les mauvais choix précédents
      if (edge.to === current) {

        // Flow qui circule sur cette arête
        const flow = flowByEdge.get(edge.id) ?? 0

        // On peut remonter cette arête seulement si :
        // - du flow y circule déjà (sinon rien à annuler)
        // - on n'a pas déjà visité le nœud source de cette arête
        if (flow > 0 && !visited.has(edge.from)) {

          // On marque le nœud comme visité
          visited.add(edge.from)

          // On ajoute cette arête au chemin (sens inverse = -1)
          path.push({ edgeId: edge.id, direction: -1, from: edge.to, to: edge.from })

          // On continue l'exploration depuis le nœud source de cette arête
          if (dfs(edge.from)) return true

          // Backtrack : cette route ne mène pas au puits non plus
          path.pop()
        }
      }
    }

    // Aucune arête exploitable depuis ce nœud → cul-de-sac
    return false
  }

  // On lance le DFS depuis la source
  // Si on ne trouve aucun chemin → on retourne null (flow maximum atteint)
  if (!dfs(source)) return null

  // ── Calcul du bottleneck ───────────────────────────────────────────────────
  // Le bottleneck = la place minimale sur toutes les arêtes du chemin
  // C'est lui qui limite la quantité de flow qu'on peut envoyer
  let bottleneck = Infinity

  for (const { edgeId, direction } of path) {

    // On récupère l'arête complète depuis son ID
    const edge = graph.edges.find(e => e.id === edgeId)!

    const residual =
      direction === 1
        // Arête forward : place restante = capacité - flow actuel
        ? Math.max(1, edge.weight) - (flowByEdge.get(edgeId) ?? 0)
        // Arête backward : place restante = flow actuel (ce qu'on peut annuler)
        : flowByEdge.get(edgeId) ?? 0

    // On garde le minimum → c'est le goulot d'étranglement du chemin
    bottleneck = Math.min(bottleneck, residual)
  }

  // On retourne le chemin trouvé avec ses directions et son bottleneck
  return {
    edgeIds: path.map(p => p.edgeId),
    directions: path.map(p => p.direction),
    bottleneck,
  }
}

function buildResidualEdges(
  graph: GraphState,
  flowByEdge: Map<string, number>
): CinemaStep['residualEdges'] {
  const residual: CinemaStep['residualEdges'] = []

  for (const edge of graph.edges) {
    const flow = flowByEdge.get(edge.id) ?? 0
    const capacity = Math.max(1, edge.weight)

    const forwardResidual = capacity - flow
    if (forwardResidual > 0) {
      residual.push({
        from: edge.from,
        to: edge.to,
        capacity: forwardResidual,
        isBackward: false,
        originalEdgeId: edge.id,
      })
    }

    if (flow > 0) {
      residual.push({
        from: edge.to,
        to: edge.from,
        capacity: flow,
        isBackward: true,
        originalEdgeId: edge.id,
      })
    }
  }

  return residual
}
// ─────────────────────────────────────────────────────────────────────────────
// FORD-FULKERSON — Construction des étapes visuelles
// ─────────────────────────────────────────────────────────────────────────────

function buildMaxFlowProgram(graph: GraphState, source: NodeId, target: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []

  // Flow actuel sur chaque arête
  const flowByEdge = new Map<string, number>()

  // Initialisation : on peut avoir du flot initial qui circule
  for (const edge of graph.edges) {
    //flowByEdge.set(edge.id, 0)
    flowByEdge.set(edge.id, edge.flow ?? 0)

  }
   // Compteur de chemins augmentants
  let pathIndex = 0

  // Historique des chemins trouvés
 const pathHistory: Array<{ index: number; bottleneck: number; edgeIds: string[]; edgeLabels: string[] }> = []


  // Première étape visuelle : état initial du graphe
  steps.push({
    narration: `Début Ford-Fulkerson de ${source} vers ${target}.`,
    visited: [source],
    frontier: [],
    treeEdges: [],
    currentNode: source,
    flowByEdge: Object.fromEntries(flowByEdge.entries()),
    residualEdges: buildResidualEdges(graph, flowByEdge),
    augmentingPathIndex: 0,
    bottleneck: 0,
    pathHistory: [],

  })

  // ── Boucle principale Ford-Fulkerson ──────────────────────────────────────
  // On cherche des chemins augmentants jusqu'à ce qu'il n'en existe plus
  while (true) {

    // Recherche d'un chemin augmentant via DFS
    const augmenting = dfsAugmentingPath(graph, source, target, flowByEdge)

    // Plus aucun chemin → le flow maximum est atteint → on sort
    if (augmenting === null) break
    pathIndex++;
    pathHistory.push({
       index: pathIndex,
       bottleneck: augmenting.bottleneck,
       edgeIds: augmenting.edgeIds,
          // ── AJOUTER ──────────────────────────────────────────────────────────
  edgeLabels: augmenting.edgeIds.map((eid, i) => {
    const direction = augmenting.directions[i]
    const edge = graph.edges.find(e => e.id === eid)
    if (!edge) return eid
    // Forward : sens normal
    // Backward : sens inverse (on affiche avec ↩ pour indiquer l'annulation)
    return direction === 1
      ? `${edge.from}→${edge.to}`
      : `${edge.to}→${edge.from} ↩`
  }),
})

    // On enregistre le chemin trouvé visuellement
    steps.push({
      narration: `Chemin augmentant n°${pathIndex} trouvé, bottleneck = ${augmenting.bottleneck}.`,
      visited: [],
      frontier: [],
      treeEdges: [],
      augmentingEdgeIds: augmenting.edgeIds,
      augmentingPathIndex: pathIndex,
      bottleneck: augmenting.bottleneck,
      pathHistory: [...pathHistory],
      flowByEdge: Object.fromEntries(flowByEdge.entries()),
      residualEdges: buildResidualEdges(graph, flowByEdge), //

    })

    // ── Application du flow sur chaque arête du chemin ────────────────────
    for (let i = 0; i < augmenting.edgeIds.length; i++) {
      const edgeId = augmenting.edgeIds[i]
      const direction = augmenting.directions[i] // 1 = forward, -1 = backward

      const edge = graph.edges.find((candidate) => candidate.id === edgeId)
      if (!edge) continue

      // Flow actuel sur cette arête
      const current = flowByEdge.get(edge.id) ?? 0

      // Capacité maximum de cette arête
      const capacity = Math.max(1, edge.weight)

      const next =
        direction === 1
          // Arête forward : on AJOUTE le bottleneck au flow existant
          // Math.min empêche de dépasser la capacité maximum
          ? Math.min(capacity, current + augmenting.bottleneck)
          // Arête backward : on SOUSTRAIT le bottleneck (on annule du flow)
          // Math.max empêche d'avoir un flow négatif
          : Math.max(0, current - augmenting.bottleneck)

      // On met à jour le flow de cette arête
      flowByEdge.set(edge.id, next)
    }

    // On identifie les arêtes saturées (flow = capacité max)
    // Ces arêtes ne peuvent plus recevoir de flow supplémentaire
    const saturatedEdgeIds = graph.edges
      .filter((edge) => (flowByEdge.get(edge.id) ?? 0) >= Math.max(1, edge.weight))
      .map((edge) => edge.id)

    // On enregistre l'état après application du flow
    steps.push({
      narration:  `Flow appliqué. +${augmenting.bottleneck} unités sur le chemin n°${pathIndex}.`,
      visited: [],
      frontier: [],
      treeEdges: [],
      augmentingEdgeIds: augmenting.edgeIds,
      saturatedEdgeIds,
      augmentingPathIndex: pathIndex,
      bottleneck: augmenting.bottleneck,
      pathHistory: [...pathHistory],
      flowByEdge: Object.fromEntries(flowByEdge.entries()),
      residualEdges: buildResidualEdges(graph, flowByEdge), // ← AJOUTER partout

    })


    // On retourne au début de la boucle pour chercher un nouveau chemin
  }

  // ── Calcul du flow total ───────────────────────────────────────────────────
  // Le flow maximum = somme de tout ce qui sort de la source
  const maxFlow = graph.edges
    .filter((edge) => edge.from === source)
    .reduce((sum, edge) => sum + (flowByEdge.get(edge.id) ?? 0), 0)

  // Dernière étape visuelle : résultat final
  steps.push({
    narration:  `Ford-Fulkerson terminé. ${pathIndex} chemin(s) augmentant(s). Flow maximum = ${maxFlow}.`,
    visited: [],
    frontier: [],
    treeEdges: [],
    saturatedEdgeIds: graph.edges
      .filter((edge) => (flowByEdge.get(edge.id) ?? 0) >= Math.max(1, edge.weight))
      .map((edge) => edge.id),
    augmentingPathIndex: pathIndex,
    bottleneck: 0,
    pathHistory: [...pathHistory],
    flowByEdge: Object.fromEntries(flowByEdge.entries()),
    residualEdges: buildResidualEdges(graph, flowByEdge),

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
  const nodeColors: Record<number, string> = {}
 
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
    nodeColors: { ...nodeColors },
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
    nodeColors[startNode] = color
    members.push(startNode)
 
    // Étape : découverte du nœud racine de la nouvelle composante
    const nodeSnap1 = buildNodeSnapshot()
    nodeSnap1[startNode] = { id: startNode, state: 'visiting', badge: `C${componentIndex + 1}` }
 
    steps.push({
      narration: `Nouvelle composante C${componentIndex + 1} (${color}) — nœud source : ${startNode}.`,
      visited: [...visited],
      frontier: [startNode],
      treeEdges: [],
      nodeColors: { ...nodeColors },
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
          nodeColors[neighbor] = color
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
            nodeColors: { ...nodeColors },
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
      nodeColors: { ...nodeColors },
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
    nodeColors: { ...nodeColors },
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
  const nodeColors: Record<number, string> = {}
  const edgeColors: Record<string, string> = {}
 
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
      nodeColors: { ...nodeColors },
      edgeColors: { ...edgeColors },
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
        
        const currentColor = COMPONENT_COLORS[componentIndex % COMPONENT_COLORS.length]
        nodeColors[neighbor] = currentColor
        edgeColors[edgeId] = currentColor
        nodeColors[startNode] = currentColor // Ensure start node is colored
        
        stack.push(neighbor)
 
        steps.push({
          narration: `Arête (${current} → ${neighbor}) ajoutée à l'arbre T${componentIndex + 1}.`,
          visited: [...visited],
          frontier: [...stack],
          treeEdges: [...forestEdgeIds],
          currentNode: neighbor,
          currentEdgeId: edgeId,
          nodeColors: { ...nodeColors },
          edgeColors: { ...edgeColors },
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
      nodeColors: { ...nodeColors },
      edgeColors: { ...edgeColors },
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
    nodeColors: { ...nodeColors },
    edgeColors: { ...edgeColors },
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

  // Early exit: si la source ou la cible est isolée (aucune arête incidente), inutile de parcourir tout le graphe.
  const hasIncidentEdges = (n: NodeId) => graph.edges.some(e => e.from === n || e.to === n)
  if (!hasIncidentEdges(source)) {
    steps.push({
      narration: `❌ Abandon : la source ${source} est isolée (aucune arête incidente).`,
      visited: [],
      frontier: [],
      treeEdges: []
    })
    return steps
  }
  if (!hasIncidentEdges(target)) {
    steps.push({
      narration: `❌ Abandon : la cible ${target} est isolée (aucune arête incidente).`,
      visited: [],
      frontier: [],
      treeEdges: []
    })
    return steps
  }

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
    if (foundTarget) break
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
  const resultMessages = [chainStatus, cycleStatus, verdict].filter((message) => message.trim().length > 0)

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

  for (const message of resultMessages) {
    steps.push({
      narration: message,
      visited: graph.nodes,
      frontier: properties.oddNodes,
      treeEdges: [],
    })
  }

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

  if (resultMessages.length > 0) {
    steps.push({
      narration: resultMessages.join(' '),
      visited: report.chainTrace,
      frontier: [],
      treeEdges: Array.from(usedEdges),
    })
  }

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

// ─────────────────────────────────────────────────────────────────────────────
// WELSH-POWELL — Coloration de graphe
//
// FLUX GÉNÉRAL :
//   1. Calculer le degré de chaque sommet (nombre de voisins).
//   2. Trier les sommets par degré décroissant → liste ordonnée X1, X2,…, Xn.
//   3. Attribuer une nouvelle couleur au premier sommet non encore coloré.
//   4. Parcourir le reste de la liste : attribuer cette même couleur à chaque
//      sommet non coloré et non adjacent à un sommet déjà de cette couleur.
//   5. S'il reste des sommets non colorés, retourner à l'étape 3.
//      Sinon, la coloration est terminée.
//
// RENDU VISUEL (CinemaStep) :
//   • colorGroups  → tableau de { color, nodeIds } → anneaux colorés distincts
//                    par groupe dans GraphCanvas (C1=bleu, C2=orange, C3=vert…).
//   • frontier     → sommet en cours d'examen → anneau ambre.
//   • currentNode  → sommet actif → anneau blanc tournant.
//   • visited / frontier / treeEdges → toujours [] (obligatoires pour le
//     contrat CinemaStep car GraphCanvas y accède sans optional chaining).
// ─────────────────────────────────────────────────────────────────────────────
function buildWelshPowellProgram(graph: GraphState): CinemaStep[] {
  const steps: CinemaStep[] = []

  // ── 1. CALCUL DES DEGRÉS ──────────────────────────────────────────────────
  // Le degré d'un sommet pour la coloration = nombre de voisins distincts.
  // On ignore la direction (une arête A->B ou B->A crée un conflit entre A et B).
  // On ignore les arêtes multiples (elles ne créent qu'un seul conflit).
  // On ignore les boucles (self-loops) car elles ne lient pas le sommet à d'autres.
  const degrees: Record<NodeId, number> = {}
  for (const node of graph.nodes) {
    const uniqueNeighbors = new Set(
      neighborsFor(graph, node, true)
        .map(n => n.nodeId)
        .filter(neighborId => neighborId !== node)
    )
    degrees[node] = uniqueNeighbors.size
  }

  // ── 2. TRI DÉCROISSANT ────────────────────────────────────────────────────
  // On trie du degré le plus élevé au plus bas.
  // En cas d'égalité, on trie par ID pour garantir un ordre stable et déterministe.
  const sortedNodes = [...graph.nodes].sort((a, b) => {
    if (degrees[b] !== degrees[a]) return degrees[b] - degrees[a]
    return a - b
  })

  // nodeColors[sommet] = index de couleur (0 = C1, 1 = C2, …)
  const nodeColors: Record<NodeId, number> = {}
  let colorIndex = 0

  // buildColorGroups : construit le tableau colorGroups à partir de l'état
  // courant de nodeColors. C'est ce tableau que GraphCanvas lit pour afficher
  // des anneaux de couleurs distinctes autour de chaque groupe de sommets.
  const buildColorGroups = (): Array<{ color: string; nodeIds: NodeId[] }> => {
    const groups: Record<number, NodeId[]> = {}
    for (const [nodeStr, idx] of Object.entries(nodeColors)) {
      if (!groups[idx]) groups[idx] = []
      groups[idx].push(Number(nodeStr))
    }
    return Object.entries(groups).map(([idxStr, nodeIds]) => ({
      color: COMPONENT_COLORS[Number(idxStr) % COMPONENT_COLORS.length],
      nodeIds,
    }))
  }

  // ── ÉTAPE 1 : snapshot initial (aucun sommet coloré) ──────────────────────
  steps.push({
    narration: `Étape 1 — Tri par degré décroissant : ${sortedNodes.map(n => `${n}(d=${degrees[n]})`).join(', ')}`,
    visited: [],
    frontier: [],
    treeEdges: [],
    colorGroups: [],
  })

  // Ensemble des sommets pas encore colorés (préservé dans l'ordre trié via sortedNodes)
  const uncolored = new Set(sortedNodes)

  // ── ÉTAPES 2 & 3 : COLORATION EN BOUCLE ──────────────────────────────────
  while (uncolored.size > 0) {

    // 2a. Premier sommet non coloré dans la liste triée → nouvelle couleur
    const firstNode = sortedNodes.find(n => uncolored.has(n))!

    steps.push({
      narration: `Étape 2 — Nouvelle couleur C${colorIndex + 1}. Premier sommet non coloré dans la liste : ${firstNode} (d=${degrees[firstNode]}).`,
      visited: [],
      frontier: [firstNode], // Anneau ambre = sommet examiné
      treeEdges: [],
      currentNode: firstNode,
      colorGroups: buildColorGroups(),
    })

    // On colorie ce premier sommet et on le retire des non-colorés
    nodeColors[firstNode] = colorIndex
    uncolored.delete(firstNode)

    // currentGroup mémorise tous les sommets qui reçoivent la couleur courante,
    // pour pouvoir tester l'adjacence des candidats suivants.
    const currentGroup = [firstNode]

    steps.push({
      narration: `Sommet ${firstNode} → couleur C${colorIndex + 1}.`,
      visited: [],
      frontier: [],
      treeEdges: [],
      currentNode: firstNode,
      colorGroups: buildColorGroups(),
    })

    // 2b. Parcourir le reste de la liste pour étendre ce groupe de couleur
    for (const node of sortedNodes) {
      if (!uncolored.has(node)) continue // Déjà coloré → on passe

      // Test d'adjacence : ce sommet est-il voisin d'un membre de currentGroup ?
      const neighbors = neighborsFor(graph, node, true).map(n => n.nodeId)
      const isAdjacent = currentGroup.some(colored => neighbors.includes(colored))

      if (isAdjacent) {
        // Adjacent → conflit de couleur, on ne peut pas lui attribuer C(colorIndex+1)
        steps.push({
          narration: `Sommet ${node} (d=${degrees[node]}) est adjacent à un sommet de couleur C${colorIndex + 1} → couleur impossible.`,
          visited: [],
          frontier: [node], // Anneau ambre = sommet examiné mais rejeté
          treeEdges: [],
          currentNode: node,
          colorGroups: buildColorGroups(),
        })
      } else {
        // Non adjacent → on lui attribue la même couleur
        nodeColors[node] = colorIndex
        uncolored.delete(node)
        currentGroup.push(node)

        steps.push({
          narration: `Sommet ${node} (d=${degrees[node]}) n'est pas adjacent à C${colorIndex + 1} → couleur C${colorIndex + 1} attribuée.`,
          visited: [],
          frontier: [],
          treeEdges: [],
          currentNode: node,
          colorGroups: buildColorGroups(),
        })
      }
    }

    colorIndex++ // On passe à la couleur suivante

    // 3. S'il reste des sommets, on retourne à l'étape 2
    if (uncolored.size > 0) {
      steps.push({
        narration: `Étape 3 — Il reste ${uncolored.size} sommet(s) non coloré(s). On retourne à l'étape 2 avec une nouvelle couleur.`,
        visited: [],
        frontier: [],
        treeEdges: [],
        colorGroups: buildColorGroups(),
      })
    }
  }

  // ── FIN : tous les sommets ont une couleur ────────────────────────────────
  steps.push({
    narration: `Coloration de Welsh-Powell terminée — ${colorIndex} couleur(s) utilisée(s) pour ${graph.nodes.length} sommet(s).`,
    visited: [],
    frontier: [],
    treeEdges: [],
    colorGroups: buildColorGroups(),
  })

  return steps
}

// ─────────────────────────────────────────────────────────────────────────────
// COLORATION DES ARÊTES (Greedy Edge Coloring)
// ─────────────────────────────────────────────────────────────────────────────
function buildEdgeColoringProgram(graph: GraphState): CinemaStep[] {
  const steps: CinemaStep[] = []
  const edgeColors: Record<string, string> = {}
  
  if (graph.edges.length === 0) {
    steps.push({ narration: "Aucune arête à colorier.", visited: [], frontier: [], treeEdges: [] })
    return steps
  }

  steps.push({
    narration: "Début de la coloration des arêtes. Deux arêtes adjacentes ne doivent pas avoir la même couleur.",
    visited: [],
    frontier: [],
    treeEdges: [],
  })

  // Sort edges by some criteria for stability
  const sortedEdges = [...graph.edges].sort((a, b) => a.id.localeCompare(b.id))
  
  for (const edge of sortedEdges) {
    // Find colors used by incident edges
    const incidentEdgeIds = graph.edges
      .filter(e => e.id !== edge.id && (e.from === edge.from || e.to === edge.from || e.from === edge.to || e.to === edge.to))
      .map(e => e.id)
    
    const forbiddenColors = new Set(incidentEdgeIds.map(id => edgeColors[id]).filter(Boolean))
    
    // Pick the first available color
    let colorIdx = 0
    while (forbiddenColors.has(COMPONENT_COLORS[colorIdx % COMPONENT_COLORS.length])) {
      colorIdx++
    }
    
    const assignedColor = COMPONENT_COLORS[colorIdx % COMPONENT_COLORS.length]
    edgeColors[edge.id] = assignedColor

    steps.push({
      narration: `Coloration de l'arête ${edge.from}—${edge.to} avec la couleur ${colorIdx + 1}.`,
      visited: [],
      frontier: [edge.from, edge.to],
      treeEdges: [],
      currentEdgeId: edge.id,
      edgeColors: { ...edgeColors }
    })
  }

  steps.push({
    narration: `Coloration terminée ! Nombre chromatique d'arêtes (approximatif) : ${new Set(Object.values(edgeColors)).size}.`,
    visited: [],
    frontier: [],
    treeEdges: [],
    edgeColors: { ...edgeColors }
  })

  return steps
}

// buildAllCyclesProgram removed: AllCycles cinema algorithm has been deleted.

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
      case 'EdgeColoring':
        return buildEdgeColoringProgram(graph)
      // 'AllCycles' removed — no-op fallback
      case 'Bellman':
        return buildBellmanProgram(graph, source)
      case 'BellmanFord':
        return buildBellmanFordProgram(graph, source)
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
function buildBellmanFordProgram(graph: GraphState, source: NodeId): CinemaStep[] {
  const steps: CinemaStep[] = []

  const distances = new Map<NodeId, number>()
  const parent = new Map<NodeId, string>()

  for (const node of graph.nodes) {
    distances.set(node, Number.POSITIVE_INFINITY)
  }
  distances.set(source, 0)

  const toDistanceRecord = (): Record<number, number> => {
    const record: Record<number, number> = {}
    for (const node of graph.nodes) {
      const val = distances.get(node)!
      if (val !== Number.POSITIVE_INFINITY) record[node] = val
    }
    return record
  }

  const rebuildTreeEdges = () => Array.from(parent.values())

  const V = new Set<NodeId>([source])

  steps.push({
    narration: `[Iter 1] Initialization: d(${source}) = 0, all others = ∞. V = {${source}}`,
    visited: [],
    frontier: [source],
    treeEdges: [],
    currentNode: source,
    distances: toDistanceRecord(),
  })

  let iterCount = 2

  while (V.size > 0) {
    const i = V.values().next().value as NodeId
    V.delete(i)

    steps.push({
      narration: `[Iter ${iterCount}] Select node ${i} from V and remove it. V = {${[...V].join(', ') || '∅'}}`,
      visited: [],
      frontier: [...V],
      treeEdges: rebuildTreeEdges(),
      currentNode: i,
      distances: toDistanceRecord(),
    })

    const outEdges = graph.edges.filter(e => e.from === i)

    for (const edge of outEdges) {
      const j = edge.to
      const lij = graph.weighted ? edge.weight : 1
      const di = distances.get(i)!
      const dj = distances.get(j)!
      const newDist = di + lij

      steps.push({
        narration: `[Iter ${iterCount}] Examine edge (${i} → ${j}), weight = ${lij}. d(${i}) + ${lij} = ${newDist} vs d(${j}) = ${dj === Infinity ? '∞' : dj}`,
        visited: [],
        frontier: [...V],
        treeEdges: rebuildTreeEdges(),
        currentNode: i,
        currentEdgeId: edge.id,
        distances: toDistanceRecord(),
      })

      if (dj > newDist) {
        distances.set(j, newDist)
        parent.set(j, edge.id)
        V.add(j)

        steps.push({
          narration: `[Iter ${iterCount}] ✅ Update: d(${j}) = ${newDist}. Node ${j} added to V. V = {${[...V].join(', ')}}`,
          visited: [],
          frontier: [...V],
          treeEdges: rebuildTreeEdges(),
          currentNode: j,
          currentEdgeId: edge.id,
          distances: toDistanceRecord(),
        })
      } else {
        steps.push({
          narration: `[Iter ${iterCount}] ❌ No update for ${j}: ${newDist} ≥ ${dj === Infinity ? '∞' : dj}`,
          visited: [],
          frontier: [...V],
          treeEdges: rebuildTreeEdges(),
          currentNode: i,
          currentEdgeId: edge.id,
          distances: toDistanceRecord(),
        })
      }
    }

    iterCount++
  }

  steps.push({
    narration: `V is empty. Algorithm complete after ${iterCount - 1} iteration(s). Distances: ${graph.nodes.map(n => `d(${n})=${distances.get(n) === Infinity ? '∞' : distances.get(n)}`).join(', ')}`,
    visited: graph.nodes.filter(n => distances.get(n) !== Infinity),
    frontier: [],
    treeEdges: rebuildTreeEdges(),
    distances: toDistanceRecord(),
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
      if (value !== Number.POSITIVE_INFINITY) record[nodeId] = value
    }
    return record
  }

  const distSnapshot = (): string =>
    graph.nodes
      .map(n => {
        const d = distances.get(n)
        return `d(${n})=${d === Number.POSITIVE_INFINITY ? '∞' : d}`
      })
      .join(', ')

  const sSnapshot = (): string => `{${[...visited].join(', ')}}`

  // ── Iter 1 : Initialisation pure ──────────────────────────────────────────
  visited.add(source)

  steps.push({
    narration: `[Iter 1] Initialization: d(${source}) = 0, all others = ∞. xp = ${source}, A(xp) = -, S = {${source}}. ${distSnapshot()}`,
    visited: [...visited],
    frontier: graph.nodes.filter(n => !visited.has(n)),
    treeEdges: [],
    currentNode: source,
    distances: toDistanceRecord(),
  })

  // ── Itérations 2, 3, ... ──────────────────────────────────────────────────
  let iterCount = 2
  let currentNode: NodeId = source

  while (true) {
    // Traitement des arcs sortants du xp courant
    for (const neighbor of neighborsFor(graph, currentNode)) {
      if (visited.has(neighbor.nodeId)) continue

      const currentDist = distances.get(currentNode) ?? Number.POSITIVE_INFINITY
      const tentative = currentDist + Math.max(0, neighbor.weight)
      const currentBest = distances.get(neighbor.nodeId) ?? Number.POSITIVE_INFINITY

      steps.push({
        narration: `[Iter ${iterCount}] Examine edge (${currentNode} → ${neighbor.nodeId}), weight = ${neighbor.weight}. d(${currentNode}) + ${neighbor.weight} = ${tentative} vs d(${neighbor.nodeId}) = ${currentBest === Infinity ? '∞' : currentBest}`,
        visited: [...visited],
        frontier: graph.nodes.filter(n => !visited.has(n)),
        treeEdges: [...treeEdges],
        currentNode,
        currentEdgeId: neighbor.edgeId,
        distances: toDistanceRecord(),
      })

      if (tentative < currentBest) {
        distances.set(neighbor.nodeId, tentative)
        incomingEdge.set(neighbor.nodeId, neighbor.edgeId)

        steps.push({
          narration: `[Iter ${iterCount}] ✅ Update: d(${neighbor.nodeId}) = ${currentBest === Infinity ? '∞' : currentBest} → ${tentative}. ${distSnapshot()}`,
          visited: [...visited],
          frontier: graph.nodes.filter(n => !visited.has(n)),
          treeEdges: [...treeEdges],
          currentNode: neighbor.nodeId,
          currentEdgeId: neighbor.edgeId,
          distances: toDistanceRecord(),
        })
      } else {
        steps.push({
          narration: `[Iter ${iterCount}] ❌ No update for ${neighbor.nodeId}: ${tentative} ≥ ${currentBest === Infinity ? '∞' : currentBest}`,
          visited: [...visited],
          frontier: graph.nodes.filter(n => !visited.has(n)),
          treeEdges: [...treeEdges],
          currentNode,
          currentEdgeId: neighbor.edgeId,
          distances: toDistanceRecord(),
        })
      }
    }

    // Choisir le prochain xp = nœud non visité avec distance minimale
    let nextNode: NodeId | null = null
    let nextDist = Number.POSITIVE_INFINITY
    for (const n of graph.nodes) {
      if (visited.has(n)) continue
      const d = distances.get(n) ?? Number.POSITIVE_INFINITY
      if (d < nextDist) { nextDist = d; nextNode = n }
    }

    if (nextNode === null) break

    // Ajouter nextNode à S
    visited.add(nextNode)
    const edgeId = incomingEdge.get(nextNode)
    if (typeof edgeId === 'string' && !treeEdges.includes(edgeId)) {
      treeEdges.push(edgeId)
    }

    const arcLabel = (() => {
      const e = graph.edges.find(x => x.id === incomingEdge.get(nextNode!))
      return e ? `(${e.from},${e.to})` : '-'
    })()

    // Step résumé de fin d'itération : distances + xp choisi + S
    steps.push({
      narration: `[Iter ${iterCount}] End: ${distSnapshot()} | xp = ${nextNode}, A(xp) = ${arcLabel}, S = ${sSnapshot()}`,
      visited: [...visited],
      frontier: graph.nodes.filter(n => !visited.has(n)),
      treeEdges: [...treeEdges],
      currentNode: nextNode,
      distances: toDistanceRecord(),
    })

    currentNode = nextNode
    iterCount++
  }

  // Step final
  steps.push({
    narration: `Dijkstra complete after ${iterCount - 1} iteration(s). ${distSnapshot()} | S = ${sSnapshot()} — STOP`,
    visited: [...visited],
    frontier: [],
    treeEdges: [...treeEdges],
    distances: toDistanceRecord(),
  })

  return steps
}