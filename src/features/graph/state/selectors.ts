import type { GraphEdge, GraphState, NodeId } from '../model/types'

export interface VisualEdge extends GraphEdge {
  visualId: string
  hasArrow: boolean
}

export function getVisualEdges(edges: GraphEdge[]): VisualEdge[] {
  const visualEdges: VisualEdge[] = []
  const seenSymmetryKeys = new Set<string>()

  for (const edge of edges) {
    if (edge.symmetryKey) {
      if (seenSymmetryKeys.has(edge.symmetryKey)) {
        continue
      }
      seenSymmetryKeys.add(edge.symmetryKey)
      visualEdges.push({
        ...edge,
        visualId: edge.symmetryKey,
        hasArrow: false,
      })
    } else {
      visualEdges.push({
        ...edge,
        visualId: edge.id,
        hasArrow: edge.directed !== false, // Default to true if not specified
      })
    }
  }

  return visualEdges
}

export function sortedNodes(nodes: NodeId[]): NodeId[] {
  return [...nodes].sort((left, right) => left - right)
}

export function buildAdjacencyMatrix(graph: GraphState): number[][] {
  const ordered = sortedNodes(graph.nodes)
  const indexByNode = new Map<number, number>()

  ordered.forEach((nodeId, index) => {
    indexByNode.set(nodeId, index)
  })

  const matrix = ordered.map(() => ordered.map(() => 0))

  for (const edge of graph.edges) {
    const row = indexByNode.get(edge.from)
    const col = indexByNode.get(edge.to)

    if (typeof row !== 'number' || typeof col !== 'number') {
      continue
    }

    matrix[row][col] = graph.weighted ? edge.weight : 1

    if (!graph.directed && row !== col) {
      matrix[col][row] = graph.weighted ? edge.weight : 1
    }
  }

  return matrix
}

export interface GraphDiff {
  addedNodes: NodeId[]
  removedNodes: NodeId[]
  addedEdges: string[]
  removedEdges: string[]
}

function edgeTraversable(edge: GraphEdge, from: NodeId, directed: boolean): boolean {
  return directed ? edge.from === from : edge.from === from || edge.to === from
}

function edgeNextNode(edge: GraphEdge, from: NodeId): NodeId {
  return edge.from === from ? edge.to : edge.from
}

export function detectCycle(
  edges: GraphEdge[],
  from: NodeId,
  to: NodeId,
  directed: boolean,
): string[] | null {
  const visited = new Set<NodeId>()

  function dfs(current: NodeId, pathEdgeIds: string[]): string[] | null {
    if (current === from) {
      return pathEdgeIds
    }

    visited.add(current)

    for (const edge of edges) {
      if (!edgeTraversable(edge, current, directed)) {
        continue
      }

      const nextNode = edgeNextNode(edge, current)
      if (visited.has(nextNode)) {
        continue
      }

      const found = dfs(nextNode, [...pathEdgeIds, edge.id])
      if (found !== null) {
        return found
      }
    }

    return null
  }

  return dfs(to, [])
}

export function diffGraphStates(previous: GraphState, current: GraphState): GraphDiff {
  const previousNodes = new Set(previous.nodes)
  const currentNodes = new Set(current.nodes)
  const previousEdges = new Set(previous.edges.map((edge) => edge.id))
  const currentEdges = new Set(current.edges.map((edge) => edge.id))

  return {
    addedNodes: current.nodes.filter((nodeId) => !previousNodes.has(nodeId)),
    removedNodes: previous.nodes.filter((nodeId) => !currentNodes.has(nodeId)),
    addedEdges: current.edges
      .filter((edge) => !previousEdges.has(edge.id))
      .map((edge) => edge.id),
    removedEdges: previous.edges
      .filter((edge) => !currentEdges.has(edge.id))
      .map((edge) => edge.id),
  }
}

export function neighborsOfNode(graph: GraphState, nodeId: NodeId): NodeId[] {
  const neighbors = new Set<NodeId>()

  for (const edge of graph.edges) {
    if (edge.from === nodeId) {
      neighbors.add(edge.to)
    }
    if (!graph.directed && edge.to === nodeId) {
      neighbors.add(edge.from)
    }
    if (graph.directed && edge.to === nodeId) {
      neighbors.add(edge.from)
    }
  }

  return sortedNodes([...neighbors])
}

export function degreeOfNode(graph: GraphState, nodeId: NodeId): number {
  if (graph.directed) {
    return graph.edges.filter((edge) => edge.from === nodeId || edge.to === nodeId).length
  }

  return graph.edges.reduce((count, edge) => {
    if (edge.from === nodeId && edge.to === nodeId) {
      return count + 2
    }

    if (edge.from === nodeId || edge.to === nodeId) {
      return count + 1
    }

    return count
  }, 0)
}

export function findComponents(graph: GraphState): NodeId[][] {
  const visited = new Set<NodeId>()
  const components: NodeId[][] = []

  for (const nodeId of sortedNodes(graph.nodes)) {
    if (visited.has(nodeId)) {
      continue
    }

    const component: NodeId[] = []
    const queue: NodeId[] = [nodeId]
    visited.add(nodeId)

    while (queue.length > 0) {
      const current = queue.shift()
      if (typeof current !== 'number') {
        continue
      }

      component.push(current)

      for (const edge of graph.edges) {
        if (!edgeTraversable(edge, current, false)) {
          continue
        }
        const next = edgeNextNode(edge, current)
        if (visited.has(next)) {
          continue
        }
        visited.add(next)
        queue.push(next)
      }
    }

    components.push(sortedNodes(component))
  }

  return components
}

export interface PathResult {
  nodeIds: NodeId[]
  edgeIds: string[]
  distance: number
}

export function shortestPathBetweenNodes(
  graph: GraphState,
  source: NodeId,
  target: NodeId,
): PathResult | null {
  if (!graph.nodes.includes(source) || !graph.nodes.includes(target)) {
    return null
  }

  const distances = new Map<NodeId, number>()
  const previousNode = new Map<NodeId, NodeId>()
  const previousEdge = new Map<NodeId, string>()
  const unvisited = new Set<NodeId>(graph.nodes)

  for (const nodeId of graph.nodes) {
    distances.set(nodeId, Number.POSITIVE_INFINITY)
  }
  distances.set(source, 0)

  while (unvisited.size > 0) {
    let current: NodeId | null = null
    let currentDistance = Number.POSITIVE_INFINITY

    for (const nodeId of unvisited) {
      const distance = distances.get(nodeId) ?? Number.POSITIVE_INFINITY
      if (distance < currentDistance) {
        currentDistance = distance
        current = nodeId
      }
    }

    if (current === null || currentDistance === Number.POSITIVE_INFINITY) {
      break
    }

    unvisited.delete(current)
    if (current === target) {
      break
    }

    for (const edge of graph.edges) {
      if (!edgeTraversable(edge, current, graph.directed)) {
        continue
      }
      const next = edgeNextNode(edge, current)
      if (!unvisited.has(next)) {
        continue
      }

      const weight = graph.weighted ? edge.weight : 1
      const tentative = currentDistance + weight
      const nextDistance = distances.get(next) ?? Number.POSITIVE_INFINITY
      if (tentative < nextDistance) {
        distances.set(next, tentative)
        previousNode.set(next, current)
        previousEdge.set(next, edge.id)
      }
    }
  }

  const targetDistance = distances.get(target) ?? Number.POSITIVE_INFINITY
  if (targetDistance === Number.POSITIVE_INFINITY) {
    return null
  }

  const pathNodes: NodeId[] = [target]
  const pathEdges: string[] = []
  let walker = target

  while (walker !== source) {
    const prevNode = previousNode.get(walker)
    const prevEdge = previousEdge.get(walker)
    if (typeof prevNode !== 'number' || typeof prevEdge !== 'string') {
      return null
    }
    pathEdges.unshift(prevEdge)
    pathNodes.unshift(prevNode)
    walker = prevNode
  }

  return {
    nodeIds: pathNodes,
    edgeIds: pathEdges,
    distance: targetDistance,
  }
}

