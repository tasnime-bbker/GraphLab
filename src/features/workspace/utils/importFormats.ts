import type { GraphState, GraphEdge, NodeId, Position } from '../../graph/model/types'

function buildDefaultPosition(index: number): Position {
  const baseX = 110
  const baseY = 110
  const spacing = 90
  const perRow = 6
  return {
    x: baseX + (index % perRow) * spacing,
    y: baseY + Math.floor(index / perRow) * spacing,
  }
}

export function parseGraph(text: string, format: string, currentState: GraphState): GraphState {
  if (format === 'json') {
    const parsed = JSON.parse(text)
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('Invalid JSON format: missing nodes or edges array')
    }
    // Basic validation, you could use zod here in a real app
    return parsed as GraphState
  }

  if (format === 'edgelist') {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    const nodes = new Set<NodeId>()
    const edges: GraphEdge[] = []
    let nextEdgeId = 1
    
    for (const line of lines) {
      const parts = line.split(/\s+/)
      if (parts.length >= 2) {
        const from = parseInt(parts[0], 10)
        const to = parseInt(parts[1], 10)
        const weight = parts.length >= 3 ? parseFloat(parts[2]) : 1
        
        if (!isNaN(from) && !isNaN(to)) {
          nodes.add(from)
          nodes.add(to)
          edges.push({
            id: `e${nextEdgeId++}`,
            from,
            to,
            weight: isNaN(weight) ? 1 : weight
          })
        }
      }
    }

    const nodesArr = Array.from(nodes).sort((a, b) => a - b)
    const positions = { ...currentState.positions }
    nodesArr.forEach((nodeId, idx) => {
      if (!positions[nodeId]) {
        positions[nodeId] = buildDefaultPosition(idx)
      }
    })

    return {
      ...currentState,
      nodes: nodesArr,
      edges,
      positions,
      nextNodeId: Math.max(...nodesArr, 0) + 1,
      nextEdgeId
    }
  }

  if (format === 'adjacency') {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l)
    const nodes = new Set<NodeId>()
    const edges: GraphEdge[] = []
    let nextEdgeId = 1

    for (const line of lines) {
      const [nodeStr, neighborsStr] = line.split(':')
      if (!nodeStr) continue
      const from = parseInt(nodeStr.trim(), 10)
      if (isNaN(from)) continue
      nodes.add(from)

      if (neighborsStr) {
        const neighbors = neighborsStr.split(',')
        for (const n of neighbors) {
          const match = n.trim().match(/^(\d+)(?:\(([^)]+)\))?$/)
          if (match) {
            const to = parseInt(match[1], 10)
            const weight = match[2] ? parseFloat(match[2]) : 1
            if (!isNaN(to)) {
              nodes.add(to)
              edges.push({
                id: `e${nextEdgeId++}`,
                from,
                to,
                weight: isNaN(weight) ? 1 : weight
              })
            }
          }
        }
      }
    }

    const nodesArr = Array.from(nodes).sort((a, b) => a - b)
    const positions = { ...currentState.positions }
    nodesArr.forEach((nodeId, idx) => {
      if (!positions[nodeId]) {
        positions[nodeId] = buildDefaultPosition(idx)
      }
    })

    return {
      ...currentState,
      nodes: nodesArr,
      edges,
      positions,
      nextNodeId: Math.max(...nodesArr, 0) + 1,
      nextEdgeId
    }
  }

  throw new Error(`Parsing format '${format}' is not supported yet.`)
}
