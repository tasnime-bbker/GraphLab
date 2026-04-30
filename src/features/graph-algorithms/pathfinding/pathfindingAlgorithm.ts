import type { GraphState, NodeId } from '../../graph/model/types'

export interface PathResult {
  found: boolean
  path: NodeId[]           // Chemin trouvé (graphe orienté)
  chain: NodeId[]          // Chaîne trouvée (graphe non orienté)
  distance: number         // Distance totale
  directed: boolean        // Type de graphe
  message: string          // Message descriptif
  isEulerian: boolean      // Chemin/Chaîne eulérien (visite chaque arête exactement une fois) ?
}

/**
 * Fonction principale pour trouver un chemin/chaîne entre deux nœuds
 * @param graph - L'état du graphe
 * @param startNode - Nœud de départ
 * @param endNode - Nœud d'arrivée
 * @returns Résultat du pathfinding
 */
export function findPath(
  graph: GraphState,
  startNode: NodeId,
  endNode: NodeId,
): PathResult {
  // Valider que les nœuds existent
  if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
    return {
      found: false,
      path: [],
      chain: [],
      distance: 0,
      directed: graph.directed,
      message: '❌ Nœud invalide - les nœuds doivent exister dans le graphe',
      isEulerian: false,
    }
  }

  if (startNode === endNode) {
    return {
      found: true,
      path: [startNode],
      chain: [startNode],
      distance: 0,
      directed: graph.directed,
      message: '✓ Nœud source et destination identiques',
      isEulerian: graph.edges.length === 0,
    }
  }

  if (graph.directed) {
    return findDirectedPath(graph, startNode, endNode)
  } else {
    return findUndirectedChain(graph, startNode, endNode)
  }
}

/**
 * Trouve un chemin dans un graphe orienté avec Dijkstra (pour graphes pondérés)
 */
function findDirectedPath(graph: GraphState, start: NodeId, end: NodeId): PathResult {
  if (graph.weighted) {
    return dijkstraDirected(graph, start, end)
  } else {
    return bfsDirected(graph, start, end)
  }
}

/**
 * Trouve une chaîne dans un graphe non orienté avec Dijkstra
 */
function findUndirectedChain(graph: GraphState, start: NodeId, end: NodeId): PathResult {
  if (graph.weighted) {
    return dijkstraUndirected(graph, start, end)
  } else {
    return bfsUndirected(graph, start, end)
  }
}

/**
 * BFS pour graphe orienté non pondéré
 */
function bfsDirected(graph: GraphState, start: NodeId, end: NodeId): PathResult {
  const queue: NodeId[] = [start]
  const visited = new Set<NodeId>([start])
  const parent = new Map<NodeId, NodeId>()

  while (queue.length > 0) {
    const current = queue.shift()!

    if (current === end) {
      const path = reconstructPath(parent, start, end)
      return {
        found: true,
        path,
        chain: path,
        distance: path.length - 1,
        directed: true,
        message: `✓ Chemin trouvé: ${path.join(' → ')}`,
        isEulerian: isPathEulerian(graph, path),
      }
    }

    // Parcourir les voisins sortants (graphe orienté)
    for (const edge of graph.edges) {
      if (edge.from === current && !visited.has(edge.to)) {
        visited.add(edge.to)
        parent.set(edge.to, current)
        queue.push(edge.to)
      }
    }
  }

  return {
    found: false,
    path: [],
    chain: [],
    distance: 0,
    directed: true,
    message: `❌ Aucun chemin trouvé de ${start} vers ${end}`,
    isEulerian: false,
  }
}

/**
 * BFS pour graphe non orienté non pondéré
 */
function bfsUndirected(graph: GraphState, start: NodeId, end: NodeId): PathResult {
  const queue: NodeId[] = [start]
  const visited = new Set<NodeId>([start])
  const parent = new Map<NodeId, NodeId>()

  while (queue.length > 0) {
    const current = queue.shift()!

    if (current === end) {
      const chain = reconstructPath(parent, start, end)
      return {
        found: true,
        path: chain,
        chain,
        distance: chain.length - 1,
        directed: false,
        message: `✓ Chaîne trouvée: ${chain.join(' - ')}`,
        isEulerian: isPathEulerian(graph, chain),
      }
    }

    // Parcourir les voisins bidirectionnels
    for (const edge of graph.edges) {
      let neighbor: NodeId | null = null

      if (edge.from === current) {
        neighbor = edge.to
      } else if (edge.to === current) {
        neighbor = edge.from
      }

      if (neighbor !== null && !visited.has(neighbor)) {
        visited.add(neighbor)
        parent.set(neighbor, current)
        queue.push(neighbor)
      }
    }
  }

  return {
    found: false,
    path: [],
    chain: [],
    distance: 0,
    directed: false,
    message: `❌ Aucune chaîne trouvée entre ${start} et ${end}`,
    isEulerian: false,
  }
}

/**
 * Dijkstra pour graphe orienté pondéré
 */
function dijkstraDirected(graph: GraphState, start: NodeId, end: NodeId): PathResult {
  const distances = new Map<NodeId, number>()
  const parent = new Map<NodeId, NodeId>()
  const unvisited = new Set<NodeId>(graph.nodes)

  // Initialiser les distances
  for (const node of graph.nodes) {
    distances.set(node, Infinity)
  }
  distances.set(start, 0)

  while (unvisited.size > 0) {
    // Trouver le nœud non visité avec la plus petite distance
    let current: NodeId | null = null
    let minDistance = Infinity

    for (const node of unvisited) {
      const dist = distances.get(node) ?? Infinity
      if (dist < minDistance) {
        minDistance = dist
        current = node
      }
    }

    if (current === null || minDistance === Infinity) break

    unvisited.delete(current)

    if (current === end) break

    // Relaxer les arêtes sortantes
    for (const edge of graph.edges) {
      if (edge.from === current && unvisited.has(edge.to)) {
        const newDistance = (distances.get(current) ?? 0) + edge.weight
        const currentDist = distances.get(edge.to) ?? Infinity

        if (newDistance < currentDist) {
          distances.set(edge.to, newDistance)
          parent.set(edge.to, current)
        }
      }
    }
  }

  const finalDistance = distances.get(end) ?? Infinity

  if (finalDistance === Infinity) {
    return {
      found: false,
      path: [],
      chain: [],
      distance: 0,
      directed: true,
      message: `❌ Aucun chemin trouvé de ${start} vers ${end}`,
      isEulerian: false,
    }
  }

  const path = reconstructPath(parent, start, end)

  return {
    found: true,
    path,
    chain: path,
    distance: finalDistance,
    directed: true,
    message: `✓ Chemin trouvé: ${path.join(' → ')} (distance: ${finalDistance})`,
    isEulerian: isPathEulerian(graph, path),
  }
}

/**
 * Dijkstra pour graphe non orienté pondéré
 */
function dijkstraUndirected(graph: GraphState, start: NodeId, end: NodeId): PathResult {
  const distances = new Map<NodeId, number>()
  const parent = new Map<NodeId, NodeId>()
  const unvisited = new Set<NodeId>(graph.nodes)

  // Initialiser les distances
  for (const node of graph.nodes) {
    distances.set(node, Infinity)
  }
  distances.set(start, 0)

  while (unvisited.size > 0) {
    // Trouver le nœud non visité avec la plus petite distance
    let current: NodeId | null = null
    let minDistance = Infinity

    for (const node of unvisited) {
      const dist = distances.get(node) ?? Infinity
      if (dist < minDistance) {
        minDistance = dist
        current = node
      }
    }

    if (current === null || minDistance === Infinity) break

    unvisited.delete(current)

    if (current === end) break

    // Relaxer les arêtes bidirectionnelles
    for (const edge of graph.edges) {
      let neighbor: NodeId | null = null

      if (edge.from === current && unvisited.has(edge.to)) {
        neighbor = edge.to
      } else if (edge.to === current && unvisited.has(edge.from)) {
        neighbor = edge.from
      }

      if (neighbor !== null) {
        const newDistance = (distances.get(current) ?? 0) + edge.weight
        const currentDist = distances.get(neighbor) ?? Infinity

        if (newDistance < currentDist) {
          distances.set(neighbor, newDistance)
          parent.set(neighbor, current)
        }
      }
    }
  }

  const finalDistance = distances.get(end) ?? Infinity

  if (finalDistance === Infinity) {
    return {
      found: false,
      path: [],
      chain: [],
      distance: 0,
      directed: false,
      message: `❌ Aucune chaîne trouvée entre ${start} et ${end}`,
      isEulerian: false,
    }
  }

  const chain = reconstructPath(parent, start, end)

  return {
    found: true,
    path: chain,
    chain,
    distance: finalDistance,
    directed: false,
    message: `✓ Chaîne trouvée: ${chain.join(' - ')} (distance: ${finalDistance})`,
    isEulerian: isPathEulerian(graph, chain),
  }
}

/**
 * Reconstruit le chemin à partir de la map des parents
 */
function reconstructPath(
  parent: Map<NodeId, NodeId>,
  start: NodeId,
  end: NodeId,
): NodeId[] {
  const path: NodeId[] = []
  let current: NodeId | undefined = end

  while (current !== undefined) {
    path.unshift(current)
    if (current === start) break
    current = parent.get(current)
  }

  return path
}

/**
 * Vérifie si un chemin/chaîne est eulérien
 * Un chemin est eulérien s'il visite chaque arête du graphe exactement une fois
 */
function isPathEulerian(graph: GraphState, path: NodeId[]): boolean {
  if (path.length <= 1) return graph.edges.length === 0
  
  // Compter les arêtes utilisées dans le chemin
  const usedEdges = new Map<string, number>()
  
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]
    const to = path[i + 1]
    
    // Créer une clé unique pour l'arête
    const key = graph.directed ? `${from}→${to}` : [from, to].sort().join('-')
    usedEdges.set(key, (usedEdges.get(key) ?? 0) + 1)
  }
  
  // Compter les arêtes du graphe
  const graphEdges = new Map<string, number>()
  
  for (const edge of graph.edges) {
    const key = graph.directed ? `${edge.from}→${edge.to}` : [edge.from, edge.to].sort().join('-')
    graphEdges.set(key, (graphEdges.get(key) ?? 0) + 1)
  }
  
  // Vérifier que toutes les arêtes du graphe sont utilisées exactement une fois
  if (usedEdges.size !== graphEdges.size) {
    return false
  }
  
  for (const [key, count] of graphEdges) {
    if ((usedEdges.get(key) ?? 0) !== count) {
      return false
    }
  }
  
  return true
}
