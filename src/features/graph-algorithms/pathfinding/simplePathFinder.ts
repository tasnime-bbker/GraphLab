import type { GraphState, NodeId } from '../../graph/model/types'

/**
 * Service pour trouver des chemins simples entre deux sommets
 * Un chemin simple = sans répétition de sommets
 */

export interface SimplePathResult {
  found: boolean
  path: NodeId[]              // Le chemin trouvé (séquence de nœuds)
  edges: number               // Nombre d'arêtes
  isElementary: boolean       // Tous les nœuds sont distincts
  message: string
}

/**
 * Trouve un chemin simple (élémentaire) entre deux sommets
 * Un chemin simple n'a pas de nœuds répétés
 * Utilise DFS pour trouver un chemin
 */
export function findSimplePath(graph: GraphState, startNode: NodeId, endNode: NodeId): SimplePathResult {
  // Validation
  if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
    return {
      found: false,
      path: [],
      edges: 0,
      isElementary: false,
      message: '❌ Nœud invalide',
    }
  }

  if (startNode === endNode) {
    return {
      found: true,
      path: [startNode],
      edges: 0,
      isElementary: true,
      message: '✓ Même nœud',
    }
  }

  // DFS pour trouver un chemin simple
  const visited = new Set<NodeId>([startNode])
  const path: NodeId[] = [startNode]

  if (dfsSimplePath(graph, startNode, endNode, visited, path)) {
    return {
      found: true,
      path: [...path],
      edges: path.length - 1,
      isElementary: true,
      message: `✓ Chemin simple trouvé: ${path.join(' → ')}`,
    }
  }

  return {
    found: false,
    path: [],
    edges: 0,
    isElementary: false,
    message: `❌ Aucun chemin simple trouvé de ${startNode} à ${endNode}`,
  }
}

/**
 * DFS helper pour trouver un chemin simple
 */
function dfsSimplePath(graph: GraphState, current: NodeId, target: NodeId, visited: Set<NodeId>, path: NodeId[]): boolean {
  if (current === target) {
    return true
  }

  // Parcourir les voisins
  if (graph.directed) {
    // Graphe orienté: seulement les arêtes sortantes
    for (const edge of graph.edges) {
      if (edge.from === current && !visited.has(edge.to)) {
        visited.add(edge.to)
        path.push(edge.to)

        if (dfsSimplePath(graph, edge.to, target, visited, path)) {
          return true
        }

        path.pop()
        visited.delete(edge.to)
      }
    }
  } else {
    // Graphe non orienté: arêtes bidirectionnelles
    for (const edge of graph.edges) {
      let neighbor: NodeId | null = null

      if (edge.from === current && !visited.has(edge.to)) {
        neighbor = edge.to
      } else if (edge.to === current && !visited.has(edge.from)) {
        neighbor = edge.from
      }

      if (neighbor !== null) {
        visited.add(neighbor)
        path.push(neighbor)

        if (dfsSimplePath(graph, neighbor, target, visited, path)) {
          return true
        }

        path.pop()
        visited.delete(neighbor)
      }
    }
  }

  return false
}

/**
 * Trouve TOUS les chemins simples entre deux sommets
 */
export function findAllSimplePaths(graph: GraphState, startNode: NodeId, endNode: NodeId): SimplePathResult[] {
  if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
    return []
  }

  if (startNode === endNode) {
    return [
      {
        found: true,
        path: [startNode],
        edges: 0,
        isElementary: true,
        message: '✓ Même nœud',
      },
    ]
  }

  const allPaths: NodeId[][] = []
  const visited = new Set<NodeId>([startNode])
  const path: NodeId[] = [startNode]

  dfsAllSimplePaths(graph, startNode, endNode, visited, path, allPaths)

  // Convertir en SimplePathResult
  const results = allPaths.map((p) => ({
    found: true,
    path: p,
    edges: p.length - 1,
    isElementary: true,
    message: `Chemin: ${p.join(' → ')}`,
  }))

  // Trier par longueur (les plus courts en premier)
  results.sort((a, b) => a.path.length - b.path.length)

  return results
}

/**
 * DFS helper pour trouver TOUS les chemins simples
 */
function dfsAllSimplePaths(
  graph: GraphState,
  current: NodeId,
  target: NodeId,
  visited: Set<NodeId>,
  path: NodeId[],
  allPaths: NodeId[][],
): void {
  if (current === target) {
    allPaths.push([...path])
    return
  }

  if (graph.directed) {
    // Graphe orienté
    for (const edge of graph.edges) {
      if (edge.from === current && !visited.has(edge.to)) {
        visited.add(edge.to)
        path.push(edge.to)

        dfsAllSimplePaths(graph, edge.to, target, visited, path, allPaths)

        path.pop()
        visited.delete(edge.to)
      }
    }
  } else {
    // Graphe non orienté
    for (const edge of graph.edges) {
      let neighbor: NodeId | null = null

      if (edge.from === current && !visited.has(edge.to)) {
        neighbor = edge.to
      } else if (edge.to === current && !visited.has(edge.from)) {
        neighbor = edge.from
      }

      if (neighbor !== null && !visited.has(neighbor)) {
        visited.add(neighbor)
        path.push(neighbor)

        dfsAllSimplePaths(graph, neighbor, target, visited, path, allPaths)

        path.pop()
        visited.delete(neighbor)
      }
    }
  }
}

/**
 * Vérifie si un chemin est simple (sans nœuds répétés)
 */
export function isSimplePath(path: NodeId[]): boolean {
  const seen = new Set<NodeId>()

  for (const node of path) {
    if (seen.has(node)) {
      return false
    }
    seen.add(node)
  }

  return true
}

/**
 * Compte le nombre de chemins simples entre deux sommets
 */
export function countSimplePaths(graph: GraphState, startNode: NodeId, endNode: NodeId): number {
  return findAllSimplePaths(graph, startNode, endNode).length
}
