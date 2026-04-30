import type { GraphState, NodeId } from '../../graph/model/types'

/**
 * Service pour calculer les degrés des sommets dans un graphe
 */

export interface DegreeInfo {
  node: NodeId
  degree: number
  inDegree?: number  // Pour graphes orientés
  outDegree?: number // Pour graphes orientés
  isOdd: boolean
}

export interface DegreesResult {
  degrees: Map<NodeId, DegreeInfo>
  oddDegreeNodes: NodeId[]
  evenDegreeNodes: NodeId[]
  maxDegree: number
  minDegree: number
  averageDegree: number
}

/**
 * Calcule le degré de chaque sommet du graphe
 * Pour les graphes non orientés: degré = nombre d'arêtes incidentes
 * Pour les graphes orientés: degré = in-degré + out-degré
 */
export function calculateDegrees(graph: GraphState): DegreesResult {
  const degrees = new Map<NodeId, DegreeInfo>()
  
  // Initialiser tous les nœuds
  for (const node of graph.nodes) {
    degrees.set(node, {
      node,
      degree: 0,
      inDegree: graph.directed ? 0 : undefined,
      outDegree: graph.directed ? 0 : undefined,
      isOdd: false,
    })
  }

  // Compter les degrés
  for (const edge of graph.edges) {
    if (graph.directed) {
      // Graphe orienté: augmenter out-degré du nœud source
      const fromInfo = degrees.get(edge.from)!
      fromInfo.outDegree = (fromInfo.outDegree ?? 0) + 1
      fromInfo.degree = (fromInfo.outDegree ?? 0) + (fromInfo.inDegree ?? 0)

      // Augmenter in-degré du nœud destination
      const toInfo = degrees.get(edge.to)!
      toInfo.inDegree = (toInfo.inDegree ?? 0) + 1
      toInfo.degree = (toInfo.outDegree ?? 0) + (toInfo.inDegree ?? 0)
    } else {
      // Graphe non orienté: augmenter le degré des deux nœuds
      const fromInfo = degrees.get(edge.from)!
      fromInfo.degree += 1

      // Si ce n'est pas une boucle, augmenter aussi le nœud destination
      if (edge.from !== edge.to) {
        const toInfo = degrees.get(edge.to)!
        toInfo.degree += 1
      }
    }
  }

  // Classifier les nœuds par parité et calculer statistiques
  const oddDegreeNodes: NodeId[] = []
  const evenDegreeNodes: NodeId[] = []
  let maxDegree = 0
  let minDegree = Infinity
  let totalDegree = 0

  for (const [nodeId, info] of degrees) {
    info.isOdd = info.degree % 2 === 1

    if (info.isOdd) {
      oddDegreeNodes.push(nodeId)
    } else {
      evenDegreeNodes.push(nodeId)
    }

    maxDegree = Math.max(maxDegree, info.degree)
    minDegree = Math.min(minDegree, info.degree)
    totalDegree += info.degree
  }

  const averageDegree = graph.nodes.length > 0 ? totalDegree / graph.nodes.length : 0

  return {
    degrees,
    oddDegreeNodes,
    evenDegreeNodes,
    maxDegree: graph.nodes.length > 0 ? maxDegree : 0,
    minDegree: graph.nodes.length > 0 ? minDegree : 0,
    averageDegree,
  }
}

/**
 * Retourne le degré d'un sommet spécifique
 */
export function getNodeDegree(graph: GraphState, nodeId: NodeId): number {
  const result = calculateDegrees(graph)
  return result.degrees.get(nodeId)?.degree ?? 0
}

/**
 * Retourne les nœuds avec un degré impair
 */
export function getOddDegreeNodes(graph: GraphState): NodeId[] {
  const result = calculateDegrees(graph)
  return result.oddDegreeNodes
}

/**
 * Compte le nombre de sommets avec un degré impair
 */
export function countOddDegreeNodes(graph: GraphState): number {
  return getOddDegreeNodes(graph).length
}
