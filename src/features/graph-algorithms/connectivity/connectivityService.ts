import type { GraphState, NodeId } from '../../graph/model/types'

/**
 * Service pour tester la connexité d'un graphe
 */

export interface ConnectivityResult {
  isConnected: boolean
  components: NodeId[][]
  componentCount: number
  message: string
}

/**
 * Vérifie si le graphe est connexe
 * Un graphe est connexe si on peut atteindre n'importe quel nœud
 * à partir de n'importe quel autre nœud
 */
export function isGraphConnected(graph: GraphState): ConnectivityResult {
  if (graph.nodes.length === 0) {
    return {
      isConnected: true,
      components: [],
      componentCount: 0,
      message: '✓ Graphe vide (connexe par défaut)',
    }
  }

  if (graph.nodes.length === 1) {
    return {
      isConnected: true,
      components: [[graph.nodes[0]]],
      componentCount: 1,
      message: '✓ Graphe avec un seul nœud (connexe)',
    }
  }

  // Pour les graphes orientés, on utilise une version non-orientée pour tester la connexité faible
  const components = findConnectedComponents(graph)

  const isConnected = components.length === 1

  return {
    isConnected,
    components,
    componentCount: components.length,
    message: isConnected
      ? '✓ Graphe connexe'
      : `❌ Graphe NON connexe (${components.length} composantes)`,
  }
}

/**
 * Trouve toutes les composantes connexes du graphe
 */
export function findConnectedComponents(graph: GraphState): NodeId[][] {
  const visited = new Set<NodeId>()
  const components: NodeId[][] = []

  for (const node of graph.nodes) {
    if (!visited.has(node)) {
      const component = bfsComponent(graph, node, visited)
      components.push(component)
    }
  }

  return components
}

/**
 * Explore une composante connexe à partir d'un nœud (BFS)
 */
function bfsComponent(graph: GraphState, startNode: NodeId, visited: Set<NodeId>): NodeId[] {
  const queue: NodeId[] = [startNode]
  const component: NodeId[] = []
  visited.add(startNode)

  while (queue.length > 0) {
    const current = queue.shift()!
    component.push(current)

    // Pour les graphes non orientés
    if (!graph.directed) {
      for (const edge of graph.edges) {
        let neighbor: NodeId | null = null

        if (edge.from === current && !visited.has(edge.to)) {
          neighbor = edge.to
        } else if (edge.to === current && !visited.has(edge.from)) {
          neighbor = edge.from
        }

        if (neighbor !== null) {
          visited.add(neighbor)
          queue.push(neighbor)
        }
      }
    } else {
      // Pour les graphes orientés, on considère les arêtes dans les deux sens
      // pour la connexité faible
      for (const edge of graph.edges) {
        let neighbor: NodeId | null = null

        if (edge.from === current && !visited.has(edge.to)) {
          neighbor = edge.to
        } else if (edge.to === current && !visited.has(edge.from)) {
          neighbor = edge.from
        }

        if (neighbor !== null) {
          visited.add(neighbor)
          queue.push(neighbor)
        }
      }
    }
  }

  return component
}

/**
 * Vérifie si le graphe est connexe en passant par un nœud spécifique
 * (utile pour vérifier la connexité d'un sous-graphe)
 */
export function isConnectedFrom(graph: GraphState, startNode: NodeId): boolean {
  if (!graph.nodes.includes(startNode)) {
    return false
  }

  const visited = new Set<NodeId>()
  bfsComponent(graph, startNode, visited)

  return visited.size === graph.nodes.length
}

/**
 * Retourne le nombre de composantes connexes
 */
export function getComponentCount(graph: GraphState): number {
  return findConnectedComponents(graph).length
}
