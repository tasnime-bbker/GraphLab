export type NodeId = number

export interface Position {
  x: number
  y: number
}

export interface GraphEdge {
  id: string
  from: NodeId
  to: NodeId
  weight: number // considéré comme capacité pour les algos de flot
  directed?: boolean
  symmetryKey?: string
  flow?: number      // flow initial _ ALGO_FLOWMAX (optionnel, 0 par défaut)

}

// Backend-facing contract.
export interface GraphUI {
  nodes: NodeId[]
  edges: Array<{ from: NodeId; to: NodeId; weight: number }>
  directed: boolean
  weighted: boolean
  positions?: Record<number, Position>
}

export type EditorMode = 'visual' | 'matrix'

export type WeightPolicy = 'positive' | 'nonNegative' | 'any'

export interface GraphInteractionState {
  selectedNodeId: NodeId | null
  selectedEdgeId: string | null
  edgeDraftFrom: NodeId | null
}

export interface GraphState {
  nodes: NodeId[]
  edges: GraphEdge[]
  directed: boolean
  weighted: boolean
  weightPolicy: WeightPolicy
  positions: Record<number, Position>
  nextNodeId: number
  nextEdgeId: number
}

export interface GraphDocument {
  mode: EditorMode
  isDevMode: boolean
  graph: GraphState
  interaction: GraphInteractionState
}

