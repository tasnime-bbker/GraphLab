import type { GraphState, NodeId } from '../../graph/model/types'
import { isGraphConnected } from '../connectivity/connectivityService'
import { countOddDegreeNodes, getOddDegreeNodes } from '../degrees/degreeService'

/**
 * Service pour déterminer si un graphe admet des parcours eulériens
 * Théorie des graphes: 
 * - Cycle eulérien: visite chaque arête exactement une fois et revient au point de départ
 * - Chaîne eulérienne: visite chaque arête exactement une fois
 */

export interface EulerianAnalysis {
  hasEulerianCycle: boolean      // Cycle eulérien (graphe eulérien)
  hasEulerianPath: boolean       // Chemin eulérien
  hasEulerianChain: boolean      // Chaîne eulérienne (graphe non orienté)
  isEulerian: boolean            // Graphe eulérien (a un cycle eulérien)
  oddDegreeNodes: NodeId[]       // Nœuds avec degré impair
  oddDegreeCount: number         // Nombre de nœuds avec degré impair
  isConnected: boolean           // Graphe connexe (condition nécessaire)
  message: string                // Message descriptif
  startNode?: NodeId             // Nœud de départ pour un chemin eulérien
  endNode?: NodeId               // Nœud de fin pour un chemin eulérien
}

/**
 * Analyse un graphe pour déterminer les types de parcours eulériens possibles
 * 
 * Règles:
 * - Graphe EULÉRIEN (cycle eulérien): connexe + tous les nœuds ont degré pair
 * - Chemin EULÉRIEN: connexe + exactement 2 nœuds de degré impair
 * - Aucun parcours: plus de 2 nœuds de degré impair ou non connexe
 */
export function analyzeEulerian(graph: GraphState): EulerianAnalysis {
  // Vérifications préalables
  const isConnected = isGraphConnected(graph).isConnected
  const oddDegreeNodes = getOddDegreeNodes(graph)
  const oddDegreeCount = oddDegreeNodes.length

  // Déterminer le type de parcours eulérien
  let hasEulerianCycle = false
  let hasEulerianPath = false
  let hasEulerianChain = false
  let isEulerian = false
  let message = ''
  let startNode: NodeId | undefined
  let endNode: NodeId | undefined

  if (!isConnected) {
    message = '❌ Graphe non connexe - Aucun parcours eulérien possible'
  } else if (graph.edges.length === 0) {
    hasEulerianCycle = true
    hasEulerianPath = true
    if (!graph.directed) {
      hasEulerianChain = true
    }
    isEulerian = true
    message = '✓ Graphe vide - Cycle eulérien trivial'
  } else if (oddDegreeCount === 0) {
    // Tous les nœuds ont degré pair
    hasEulerianCycle = true
    hasEulerianPath = true
    if (!graph.directed) {
      hasEulerianChain = true
    }
    isEulerian = true
    message = '✓ GRAPHE EULÉRIEN - Cycle eulérien possible (tous les nœuds ont degré pair)'
  } else if (oddDegreeCount === 2) {
    // Exactement 2 nœuds de degré impair
    hasEulerianPath = true
    if (!graph.directed) {
      hasEulerianChain = true
    }
    startNode = oddDegreeNodes[0]
    endNode = oddDegreeNodes[1]
    message = `✓ Chemin eulérien possible de ${startNode} à ${endNode} (2 nœuds de degré impair)`
  } else {
    // Plus de 2 nœuds de degré impair
    message = `❌ Aucun parcours eulérien (${oddDegreeCount} nœuds de degré impair)`
  }

  return {
    hasEulerianCycle,
    hasEulerianPath,
    hasEulerianChain,
    isEulerian,
    oddDegreeNodes,
    oddDegreeCount,
    isConnected,
    message,
    startNode,
    endNode,
  }
}

/**
 * Vérifie si le graphe admet un CYCLE EULÉRIEN
 * Condition: connexe + tous les nœuds ont degré pair
 */
export function hasEulerianCycle(graph: GraphState): boolean {
  const analysis = analyzeEulerian(graph)
  return analysis.hasEulerianCycle
}

/**
 * Vérifie si le graphe admet un CHEMIN EULÉRIEN (graphe orienté)
 * Condition: connexe + exactement 2 nœuds de degré impair
 * OU: connexe + tous les nœuds de degré pair (cas du cycle)
 */
export function hasEulerianPath(graph: GraphState): boolean {
  const analysis = analyzeEulerian(graph)
  return analysis.hasEulerianPath
}

/**
 * Vérifie si le graphe admet une CHAÎNE EULÉRIENNE (graphe non orienté)
 * Condition: connexe + exactement 0 ou 2 nœuds de degré impair
 */
export function hasEulerianChain(graph: GraphState): boolean {
  const analysis = analyzeEulerian(graph)
  return analysis.hasEulerianChain
}

/**
 * Vérifie si le graphe est EULÉRIEN (admet un cycle eulérien)
 * Condition: connexe + tous les nœuds ont degré pair
 */
export function isGraphEulerian(graph: GraphState): boolean {
  const analysis = analyzeEulerian(graph)
  return analysis.isEulerian
}

/**
 * Retourne les nœuds de départ et d'arrivée pour un chemin eulérien
 * Retourne undefined si aucun chemin eulérien n'existe
 */
export function getEulerianPathEndpoints(graph: GraphState): { start: NodeId; end: NodeId } | undefined {
  const analysis = analyzeEulerian(graph)

  if (analysis.hasEulerianPath && analysis.startNode !== undefined && analysis.endNode !== undefined) {
    return {
      start: analysis.startNode,
      end: analysis.endNode,
    }
  }

  // Pour un cycle eulérien, on peut commencer par n'importe quel nœud
  if (analysis.hasEulerianCycle && graph.nodes.length > 0) {
    return {
      start: graph.nodes[0],
      end: graph.nodes[0],
    }
  }

  return undefined
}

/**
 * Retourne un résumé lisible de l'analyse eulérienne
 */
export function getEulerianSummary(graph: GraphState): string {
  const analysis = analyzeEulerian(graph)

  if (!analysis.isConnected) {
    return `❌ Graphe non connexe (${analysis.oddDegreeCount} nœuds de degré impair)`
  }

  if (analysis.isEulerian) {
    return `✅ Graphe EULÉRIEN - Cycle eulérien possible`
  }

  if (analysis.hasEulerianPath) {
    return `✅ Chemin eulérien possible (${analysis.oddDegreeCount} nœuds de degré impair)`
  }

  return `❌ Aucun parcours eulérien (${analysis.oddDegreeCount} nœuds de degré impair)`
}
