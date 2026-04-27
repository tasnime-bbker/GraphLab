import type { GraphEdge, GraphState, NodeId } from '../../graph/model/types'

export type CinemaAlgorithm = 'BFS' | 'DFS' | 'Dijkstra' | 'Prims' | 'Kruskals' | 'MaxFlow'

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

function neighborsFor(graph: GraphState, nodeId: NodeId): WeightedNeighbor[] {
  const neighbors: WeightedNeighbor[] = []
  for (const edge of graph.edges) {
    if (edge.from === nodeId) {
      neighbors.push({
        nodeId: edge.to,
        edgeId: edge.id,
        weight: graph.weighted ? edge.weight : 1,
      })
    }
    if (!graph.directed && edge.to === nodeId) {
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

    const neighbors = neighborsFor(graph, current)
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

  function dfs(nodeId: NodeId): void {
    visited.add(nodeId)
    steps.push({
      narration: `Enter node ${nodeId}.`,
      visited: [...visited],
      frontier: [nodeId],
      treeEdges: [...treeEdges],
      currentNode: nodeId,
    })

    for (const neighbor of neighborsFor(graph, nodeId)) {
      steps.push({
        narration: `Probe edge ${nodeId}->${neighbor.nodeId}.`,
        visited: [...visited],
        frontier: [nodeId],
        treeEdges: [...treeEdges],
        currentNode: nodeId,
        currentEdgeId: neighbor.edgeId,
      })

      if (!visited.has(neighbor.nodeId)) {
        treeEdges.push(neighbor.edgeId)
        dfs(neighbor.nodeId)
        steps.push({
          narration: `Backtrack to node ${nodeId}.`,
          visited: [...visited],
          frontier: [nodeId],
          treeEdges: [...treeEdges],
          currentNode: nodeId,
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

export function buildCinemaProgram(
  graph: GraphState,
  algorithm: CinemaAlgorithm,
  source: NodeId,
  target?: NodeId,
): CinemaProgram {
  let steps: CinemaStep[] = []

  switch (algorithm) {
    case 'BFS':
      steps = buildBfsProgram(graph, source)
      break
    case 'DFS':
      steps = buildDfsProgram(graph, source)
      break
    case 'Dijkstra':
      steps = buildDijkstraProgram(graph, source)
      break
    case 'Prims':
      steps = buildPrimsProgram(graph, source)
      break
    case 'Kruskals':
      steps = buildKruskalsProgram(graph)
      break
    case 'MaxFlow':
      steps = buildMaxFlowProgram(graph, source, typeof target === 'number' ? target : source)
      break
    default:
      steps = []
      break
  }

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

