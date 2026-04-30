/**
 * Types pour les réponses API backend
 * Utilisés pour l'API REST des algorithmes de graphes
 */

import type { NodeId } from '../graph/model/types'

/**
 * Réponse générique de l'API
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message: string
}

/**
 * Requête de recherche de chaîne
 * GET /graph/chain?start=1&end=5
 */
export interface ChainRequestParams {
  start: NodeId
  end: NodeId
}

export interface ChainResponse {
  found: boolean
  chain: NodeId[]
  edgeCount: number
  message: string
}

/**
 * Requête de recherche de chemin simple
 * GET /graph/path?start=1&end=5
 */
export interface PathRequestParams {
  start: NodeId
  end: NodeId
}

export interface SimplePathResponse {
  found: boolean
  path: NodeId[]
  edgeCount: number
  isElementary: boolean
  message: string
}

/**
 * Réponse pour l'analyse eulérienne
 * GET /graph/euler
 */
export interface EulerResponse {
  hasEulerianCycle: boolean
  hasEulerianPath: boolean
  hasEulerianChain: boolean
  isEulerian: boolean
  oddDegreeNodes: NodeId[]
  oddDegreeCount: number
  isConnected: boolean
  message: string
  startNode?: NodeId
  endNode?: NodeId
}

/**
 * Réponse pour les degrés
 * GET /graph/degrees
 */
export interface DegreesResponse {
  degrees: Record<NodeId, number>
  oddDegreeNodes: NodeId[]
  evenDegreeNodes: NodeId[]
  maxDegree: number
  minDegree: number
  averageDegree: number
}

/**
 * Réponse pour la connectivité
 * GET /graph/connectivity
 */
export interface ConnectivityResponse {
  isConnected: boolean
  componentCount: number
  components: NodeId[][]
  message: string
}

/**
 * Réponse pour toutes les statistiques du graphe
 * GET /graph/stats
 */
export interface GraphStatsResponse {
  nodeCount: number
  edgeCount: number
  isDirected: boolean
  isWeighted: boolean
  isConnected: boolean
  isEulerian: boolean
  components: number
  degrees: DegreesResponse
  euler: EulerResponse
}
