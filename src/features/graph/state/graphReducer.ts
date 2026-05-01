import { initialDocument } from '../model/defaults'
import type { GraphDocument, GraphEdge, NodeId, Position } from '../model/types'
import { isWeightAllowed } from '../model/weightPolicy'

export type GraphAction =
  | { type: 'SET_MODE'; payload: { mode: GraphDocument['mode'] } }
  | { type: 'SET_DIRECTED'; payload: { directed: boolean } }
  | { type: 'SET_WEIGHTED'; payload: { weighted: boolean } }
  | {
      type: 'SET_WEIGHT_POLICY'
      payload: { policy: GraphDocument['graph']['weightPolicy'] }
    }
  | { type: 'ADD_NODE'; payload: { position: Position } }
  | { type: 'MOVE_NODE'; payload: { nodeId: NodeId; position: Position } }
  | { type: 'SET_NODE_POSITIONS'; payload: { positions: Record<number, Position> } }
  | { type: 'START_EDGE_DRAFT'; payload: { from: NodeId } }
  | { type: 'CLEAR_EDGE_DRAFT' }
  | { type: 'ADD_EDGE'; payload: { from: NodeId; to: NodeId; weight?: number; directed?: boolean } }
  | { type: 'DELETE_NODE'; payload: { nodeId: NodeId } }
  | { type: 'DELETE_EDGE'; payload: { edgeId: string } }
  | { type: 'SET_EDGE_WEIGHT'; payload: { edgeId: string; weight: number } }
  | { type: 'SET_SELECTED_NODE'; payload: { nodeId: NodeId | null } }
  | { type: 'SET_SELECTED_EDGE'; payload: { edgeId: string | null } }
  | { type: 'RESIZE_NODE_COUNT'; payload: { count: number } }
  | { type: 'APPLY_ADJACENCY_MATRIX'; payload: { matrix: number[][] } }
  | { type: 'RESET' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'JUMP_TO'; payload: { index: number } }
  | { type: 'SET_DEV_MODE'; payload: { isDevMode: boolean } }

function edgeExists(
  edges: GraphEdge[],
  from: NodeId,
  to: NodeId,
  directed: boolean,
): boolean {
  if (directed) {
    return edges.some((edge) => edge.from === from && edge.to === to)
  }

  return edges.some(
    (edge) =>
      (edge.from === from && edge.to === to) ||
      (edge.from === to && edge.to === from),
  )
}

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

function normalizedWeight(
  weighted: boolean,
  value: number | undefined,
  policy: GraphDocument['graph']['weightPolicy'],
): number {
  if (!weighted) {
    return 1
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 1
  }

  if (!isWeightAllowed(value, policy)) {
    return 1
  }

  return value
}

function buildEdgesFromMatrix(
  matrix: number[][],
  nodes: NodeId[],
  directed: boolean,
  weighted: boolean,
  policy: GraphDocument['graph']['weightPolicy'],
): GraphEdge[] {
  const edges: GraphEdge[] = []
  let nextEdgeId = 1

  if (directed) {
    for (let row = 0; row < matrix.length; row += 1) {
      for (let col = 0; col < matrix[row].length; col += 1) {
        const cell = matrix[row][col]
        if (cell === 0) {
          continue
        }

        edges.push({
          id: `e${nextEdgeId}`,
          from: nodes[row],
          to: nodes[col],
          weight: weighted && isWeightAllowed(cell, policy) ? cell : 1,
        })
        nextEdgeId += 1
      }
    }

    return edges
  }

  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = row; col < matrix[row].length; col += 1) {
      const cell = matrix[row][col]
      const mirrored = matrix[col]?.[row] ?? 0
      const value = cell !== 0 ? cell : mirrored

      if (value === 0) {
        continue
      }

      edges.push({
        id: `e${nextEdgeId}`,
        from: nodes[row],
        to: nodes[col],
        weight: weighted && isWeightAllowed(value, policy) ? value : 1,
      })
      nextEdgeId += 1
    }
  }

  return edges
}

export function graphReducer(
  state: GraphDocument,
  action: GraphAction,
): GraphDocument {
  switch (action.type) {
    case 'SET_MODE': {
      return {
        ...state,
        mode: action.payload.mode,
      }
    }

    case 'SET_DIRECTED': {
      return {
        ...state,
        graph: {
          ...state.graph,
          directed: action.payload.directed,
        },
      }
    }

    case 'SET_WEIGHTED': {
      return {
        ...state,
        graph: {
          ...state.graph,
          weighted: action.payload.weighted,
          edges: state.graph.edges.map((edge) => ({
            ...edge,
            weight: action.payload.weighted ? edge.weight : 1,
          })),
        },
      }
    }

    case 'SET_WEIGHT_POLICY': {
      return {
        ...state,
        graph: {
          ...state.graph,
          weightPolicy: action.payload.policy,
          edges: state.graph.edges.map((edge) => ({
            ...edge,
            weight: state.graph.weighted && isWeightAllowed(edge.weight, action.payload.policy)
              ? edge.weight
              : 1,
          })),
        },
      }
    }

    case 'ADD_NODE': {
      // Find the lowest available positive integer to fill gaps
      let nextId = 1
      const sortedIds = [...state.graph.nodes].sort((a, b) => a - b)
      for (const id of sortedIds) {
        if (id === nextId) {
          nextId += 1
        } else if (id > nextId) {
          break // Found a gap!
        }
      }

      return {
        ...state,
        graph: {
          ...state.graph,
          nodes: [...state.graph.nodes, nextId],
          positions: {
            ...state.graph.positions,
            [nextId]: action.payload.position,
          },
          nextNodeId: Math.max(state.graph.nextNodeId, nextId + 1),
        },
      }
    }

    case 'MOVE_NODE': {
      if (!state.graph.nodes.includes(action.payload.nodeId)) {
        return state
      }

      return {
        ...state,
        graph: {
          ...state.graph,
          positions: {
            ...state.graph.positions,
            [action.payload.nodeId]: action.payload.position,
          },
        },
      }
    }

    case 'SET_NODE_POSITIONS': {
      const nextPositions = { ...state.graph.positions }
      let changed = false

      for (const nodeId of state.graph.nodes) {
        const candidate = action.payload.positions[nodeId]
        if (!candidate) {
          continue
        }
        const current = nextPositions[nodeId]
        if (!current || current.x !== candidate.x || current.y !== candidate.y) {
          nextPositions[nodeId] = candidate
          changed = true
        }
      }

      if (!changed) {
        return state
      }

      return {
        ...state,
        graph: {
          ...state.graph,
          positions: nextPositions,
        },
      }
    }

    case 'START_EDGE_DRAFT': {
      return {
        ...state,
        interaction: {
          ...state.interaction,
          edgeDraftFrom: action.payload.from,
        },
      }
    }

    case 'CLEAR_EDGE_DRAFT': {
      return {
        ...state,
        interaction: {
          ...state.interaction,
          edgeDraftFrom: null,
        },
      }
    }

    case 'ADD_EDGE': {
      const { from, to, directed } = action.payload

      // If the edge creation specifies a directed flag, use it, otherwise fallback to the graph's directed state.
      const isDirected = directed ?? state.graph.directed

      if (
        !state.graph.nodes.includes(from) ||
        !state.graph.nodes.includes(to) ||
        edgeExists(state.graph.edges, from, to, isDirected)
      ) {
        return {
          ...state,
          interaction: {
            ...state.interaction,
            edgeDraftFrom: null,
          },
        }
      }

      const weight = normalizedWeight(
        state.graph.weighted,
        action.payload.weight,
        state.graph.weightPolicy,
      )

      if (isDirected) {
        const edge: GraphEdge = {
          id: `e${state.graph.nextEdgeId}`,
          from,
          to,
          weight,
          directed: true,
        }

        return {
          ...state,
          graph: {
            ...state.graph,
            edges: [...state.graph.edges, edge],
            nextEdgeId: state.graph.nextEdgeId + 1,
          },
          interaction: {
            ...state.interaction,
            edgeDraftFrom: null,
          },
        }
      } else {
        const symmetryKey = `sym-${state.graph.nextEdgeId}`
        const edge1: GraphEdge = {
          id: `e${state.graph.nextEdgeId}`,
          from,
          to,
          weight,
          directed: false,
          symmetryKey,
        }
        const edge2: GraphEdge = {
          id: `e${state.graph.nextEdgeId + 1}`,
          from: to,
          to: from,
          weight,
          directed: false,
          symmetryKey,
        }

        return {
          ...state,
          graph: {
            ...state.graph,
            edges: [...state.graph.edges, edge1, edge2],
            nextEdgeId: state.graph.nextEdgeId + 2,
          },
          interaction: {
            ...state.interaction,
            edgeDraftFrom: null,
          },
        }
      }
    }

    case 'DELETE_NODE': {
      if (!state.graph.nodes.includes(action.payload.nodeId)) {
        return state
      }

      const removedEdgeIds = new Set(
        state.graph.edges
          .filter(
            (edge) =>
              edge.from === action.payload.nodeId || edge.to === action.payload.nodeId,
          )
          .map((edge) => edge.id),
      )

      const positions = { ...state.graph.positions }
      delete positions[action.payload.nodeId]

      return {
        ...state,
        graph: {
          ...state.graph,
          nodes: state.graph.nodes.filter((id) => id !== action.payload.nodeId),
          edges: state.graph.edges.filter(
            (edge) =>
              edge.from !== action.payload.nodeId && edge.to !== action.payload.nodeId,
          ),
          positions,
        },
        interaction: {
          ...state.interaction,
          selectedNodeId:
            state.interaction.selectedNodeId === action.payload.nodeId
              ? null
              : state.interaction.selectedNodeId,
          edgeDraftFrom:
            state.interaction.edgeDraftFrom === action.payload.nodeId
              ? null
              : state.interaction.edgeDraftFrom,
          selectedEdgeId:
            state.interaction.selectedEdgeId !== null &&
            removedEdgeIds.has(state.interaction.selectedEdgeId)
              ? null
              : state.interaction.selectedEdgeId,
        },
      }
    }

    case 'DELETE_EDGE': {
      const edgeToDelete = state.graph.edges.find(e => e.id === action.payload.edgeId)
      if (!edgeToDelete) return state

      const { symmetryKey } = edgeToDelete
      const idsToRemove = symmetryKey
        ? new Set(state.graph.edges.filter(e => e.symmetryKey === symmetryKey).map(e => e.id))
        : new Set([action.payload.edgeId])

      return {
        ...state,
        graph: {
          ...state.graph,
          edges: state.graph.edges.filter(
            (edge) => !idsToRemove.has(edge.id),
          ),
        },
        interaction: {
          ...state.interaction,
          selectedEdgeId:
            state.interaction.selectedEdgeId && idsToRemove.has(state.interaction.selectedEdgeId)
              ? null
              : state.interaction.selectedEdgeId,
        },
      }
    }

    case 'SET_EDGE_WEIGHT': {
      if (!state.graph.weighted) {
        return state
      }

      if (!isWeightAllowed(action.payload.weight, state.graph.weightPolicy)) {
        return state
      }

      return {
        ...state,
        graph: {
          ...state.graph,
          edges: state.graph.edges.map((edge) =>
            edge.id === action.payload.edgeId
              ? { ...edge, weight: action.payload.weight }
              : edge,
          ),
        },
      }
    }

    case 'SET_SELECTED_NODE': {
      return {
        ...state,
        interaction: {
          ...state.interaction,
          selectedNodeId: action.payload.nodeId,
          selectedEdgeId: null,
        },
      }
    }

    case 'SET_SELECTED_EDGE': {
      return {
        ...state,
        interaction: {
          ...state.interaction,
          selectedEdgeId: action.payload.edgeId,
          selectedNodeId: null,
        },
      }
    }

    case 'RESIZE_NODE_COUNT': {
      const targetCount = Math.max(0, Math.floor(action.payload.count))
      const current = [...state.graph.nodes]
      const positions = { ...state.graph.positions }
      let nextNodeId = state.graph.nextNodeId

      while (current.length < targetCount) {
        current.push(nextNodeId)
        positions[nextNodeId] = buildDefaultPosition(current.length - 1)
        nextNodeId += 1
      }

      while (current.length > targetCount) {
        const removedId = current.pop()
        if (typeof removedId === 'number') {
          delete positions[removedId]
        }
      }

      const valid = new Set(current)
      const edges = state.graph.edges.filter(
        (edge) => valid.has(edge.from) && valid.has(edge.to),
      )

      return {
        ...state,
        graph: {
          ...state.graph,
          nodes: current,
          edges,
          positions,
          nextNodeId,
        },
        interaction: {
          ...state.interaction,
          selectedNodeId:
            state.interaction.selectedNodeId !== null &&
            valid.has(state.interaction.selectedNodeId)
              ? state.interaction.selectedNodeId
              : null,
          edgeDraftFrom:
            state.interaction.edgeDraftFrom !== null &&
            valid.has(state.interaction.edgeDraftFrom)
              ? state.interaction.edgeDraftFrom
              : null,
        },
      }
    }

    case 'APPLY_ADJACENCY_MATRIX': {
      const matrix = action.payload.matrix
      const nodes = state.graph.nodes

      if (matrix.length !== nodes.length) {
        return state
      }

      const rebuiltEdges = buildEdgesFromMatrix(
        matrix,
        nodes,
        state.graph.directed,
        state.graph.weighted,
        state.graph.weightPolicy,
      )

      return {
        ...state,
        graph: {
          ...state.graph,
          edges: rebuiltEdges,
          nextEdgeId: rebuiltEdges.length + 1,
        },
      }
    }

    case 'RESET': {
      return initialDocument
    }

    case 'SET_DEV_MODE': {
      return {
        ...state,
        isDevMode: action.payload.isDevMode,
      }
    }

    default: {
      return state
    }
  }
}

