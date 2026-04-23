import type { GraphState, NodeId } from '../model/types'

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

