import type { GraphDocument, GraphUI, Position } from './types'

const defaultPositions: Record<number, Position> = {
  1: { x: 220, y: 160 },
  2: { x: 420, y: 160 },
}

export const initialDocument: GraphDocument = {
  mode: 'visual',
  graph: {
	nodes: [1, 2],
	edges: [{ id: 'e1', from: 1, to: 2, weight: 1 }],
	directed: false,
	weighted: false,
	weightPolicy: 'positive',
	positions: defaultPositions,
	nextNodeId: 3,
	nextEdgeId: 2,
  },
  interaction: {
	selectedNodeId: null,
	selectedEdgeId: null,
	edgeDraftFrom: null,
  },
}

export function toGraphUI(document: GraphDocument): GraphUI {
  const { graph } = document

  return {
	nodes: [...graph.nodes],
	edges: graph.edges.map((edge) => ({
	  from: edge.from,
	  to: edge.to,
	  weight: edge.weight,
	})),
	directed: graph.directed,
	weighted: graph.weighted,
	positions: { ...graph.positions },
  }
}

