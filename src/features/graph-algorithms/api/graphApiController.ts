/**
 * Contrôleur API Backend pour les algorithmes de graphes
 * Fournit les endpoints REST pour tester et utiliser les algorithmes
 */

import type { GraphState, NodeId } from '../graph/model/types'
import {
  analyzeEulerian,
  calculateDegrees,
  findChain,
  findConnectedComponents,
  findSimplePath,
  isGraphConnected,
} from '../index'
import type {
  ApiResponse,
  ChainResponse,
  ConnectivityResponse,
  DegreesResponse,
  EulerResponse,
  GraphStatsResponse,
  SimplePathResponse,
} from '../types/apiTypes'

/**
 * Contrôleur pour les requêtes de chaîne
 * GET /graph/chain?start=1&end=5
 */
export function handleChainRequest(graph: GraphState, startNode: NodeId, endNode: NodeId): ApiResponse<ChainResponse> {
  try {
    const result = findChain(graph, startNode, endNode)

    return {
      success: result.found,
      data: {
        found: result.found,
        chain: result.chain,
        edgeCount: result.edges,
        message: result.message,
      },
      message: result.message,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Erreur lors du calcul de la chaîne',
    }
  }
}

/**
 * Contrôleur pour les requêtes de chemin simple
 * GET /graph/path?start=1&end=5
 */
export function handlePathRequest(graph: GraphState, startNode: NodeId, endNode: NodeId): ApiResponse<SimplePathResponse> {
  try {
    const result = findSimplePath(graph, startNode, endNode)

    return {
      success: result.found,
      data: {
        found: result.found,
        path: result.path,
        edgeCount: result.edges,
        isElementary: result.isElementary,
        message: result.message,
      },
      message: result.message,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Erreur lors du calcul du chemin',
    }
  }
}

/**
 * Contrôleur pour l'analyse eulérienne
 * GET /graph/euler
 */
export function handleEulerRequest(graph: GraphState): ApiResponse<EulerResponse> {
  try {
    const analysis = analyzeEulerian(graph)

    return {
      success: true,
      data: {
        hasEulerianCycle: analysis.hasEulerianCycle,
        hasEulerianPath: analysis.hasEulerianPath,
        hasEulerianChain: analysis.hasEulerianChain,
        isEulerian: analysis.isEulerian,
        oddDegreeNodes: analysis.oddDegreeNodes,
        oddDegreeCount: analysis.oddDegreeCount,
        isConnected: analysis.isConnected,
        message: analysis.message,
        startNode: analysis.startNode,
        endNode: analysis.endNode,
      },
      message: analysis.message,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Erreur lors de l\'analyse eulérienne',
    }
  }
}

/**
 * Contrôleur pour les degrés
 * GET /graph/degrees
 */
export function handleDegreesRequest(graph: GraphState): ApiResponse<DegreesResponse> {
  try {
    const result = calculateDegrees(graph)

    const degrees: Record<NodeId, number> = {}
    for (const [nodeId, info] of result.degrees) {
      degrees[nodeId] = info.degree
    }

    return {
      success: true,
      data: {
        degrees,
        oddDegreeNodes: result.oddDegreeNodes,
        evenDegreeNodes: result.evenDegreeNodes,
        maxDegree: result.maxDegree,
        minDegree: result.minDegree,
        averageDegree: result.averageDegree,
      },
      message: 'Degrés calculés avec succès',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Erreur lors du calcul des degrés',
    }
  }
}

/**
 * Contrôleur pour la connectivité
 * GET /graph/connectivity
 */
export function handleConnectivityRequest(graph: GraphState): ApiResponse<ConnectivityResponse> {
  try {
    const connectivity = isGraphConnected(graph)
    const components = findConnectedComponents(graph)

    return {
      success: true,
      data: {
        isConnected: connectivity.isConnected,
        componentCount: components.length,
        components,
        message: connectivity.message,
      },
      message: connectivity.message,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Erreur lors de l\'analyse de connectivité',
    }
  }
}

/**
 * Contrôleur pour les statistiques complètes du graphe
 * GET /graph/stats
 */
export function handleStatsRequest(graph: GraphState): ApiResponse<GraphStatsResponse> {
  try {
    const euler = handleEulerRequest(graph)
    const degrees = handleDegreesRequest(graph)
    const connectivity = handleConnectivityRequest(graph)

    if (!euler.data || !degrees.data || !connectivity.data) {
      throw new Error('Erreur lors du calcul des statistiques')
    }

    return {
      success: true,
      data: {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        isDirected: graph.directed,
        isWeighted: graph.weighted,
        isConnected: connectivity.data.isConnected,
        isEulerian: euler.data.isEulerian,
        components: connectivity.data.componentCount,
        degrees: degrees.data,
        euler: euler.data,
      },
      message: 'Statistiques calculées avec succès',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Erreur lors du calcul des statistiques',
    }
  }
}

/**
 * Routes virtuelles pour la documentation API
 * @description Les routes suivantes pourraient être implémentées dans un vrai backend:
 *
 * GET /graph/chain?start=1&end=5
 *   -> Trouve une chaîne entre deux sommets
 *   -> handleChainRequest()
 *
 * GET /graph/path?start=1&end=5
 *   -> Trouve un chemin simple (élémentaire) entre deux sommets
 *   -> handlePathRequest()
 *
 * GET /graph/euler
 *   -> Analyse eulérienne complète
 *   -> handleEulerRequest()
 *
 * GET /graph/degrees
 *   -> Calcule tous les degrés
 *   -> handleDegreesRequest()
 *
 * GET /graph/connectivity
 *   -> Analyse la connectivité
 *   -> handleConnectivityRequest()
 *
 * GET /graph/stats
 *   -> Toutes les statistiques
 *   -> handleStatsRequest()
 */
