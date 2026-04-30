import type { GraphState, NodeId } from '../../graph/model/types'

/**
 * Service pour trouver des chaînes entre deux sommets
 * Une chaîne = suite d'arêtes reliant deux sommets (graphe non orienté)
 */

export interface ChainResult {
  found: boolean
  chain: NodeId[]           // La chaîne trouvée (sequence de nœuds)
  edges: number             // Nombre d'arêtes dans la chaîne
  message: string
}

/**
 * Trouve une chaîne entre deux sommets en utilisant BFS
 * Préfère les chaînes plus courtes
 */
export function findChain(graph: GraphState, startNode: NodeId, endNode: NodeId): ChainResult {
  // Validation
  if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
    return {
      found: false,
      chain: [],
      edges: 0,
      message: '❌ Nœud invalide',
    }
  }

  if (startNode === endNode) {
    return {
      found: true,
      chain: [startNode],
      edges: 0,
      message: '✓ Même nœud',
    }
  }

  // BFS pour trouver la chaîne
  const queue: NodeId[] = [startNode]
  const visited = new Set<NodeId>([startNode])
  const parent = new Map<NodeId, NodeId>()

  while (queue.length > 0) {
    const current = queue.shift()!

    if (current === endNode) {
      const chain = reconstructChain(parent, startNode, endNode)
      return {
        found: true,
        chain,
        edges: chain.length - 1,
        message: `✓ Chaîne trouvée: ${chain.join(' - ')}`,
      }
    }

    // Parcourir les voisins bidirectionnels
    for (const edge of graph.edges) {
      let neighbor: NodeId | null = null

      if (edge.from === current && !visited.has(edge.to)) {
        neighbor = edge.to
      } else if (edge.to === current && !visited.has(edge.from)) {
        neighbor = edge.from
      }

      if (neighbor !== null) {
        visited.add(neighbor)
        parent.set(neighbor, current)
        queue.push(neighbor)
      }
    }
  }

  return {
    found: false,
    chain: [],
    edges: 0,
    message: `❌ Aucune chaîne trouvée entre ${startNode} et ${endNode}`,
  }
}

/**
 * Trouve toutes les chaînes simples entre deux sommets (optionnel)
 * Une chaîne simple n'a pas d'arêtes répétées
 */
export function findAllSimpleChains(graph: GraphState, startNode: NodeId, endNode: NodeId): ChainResult[] {
  const chains: ChainResult[] = []
  const allChains: NodeId[][] = []

  // DFS pour trouver toutes les chaînes
  const visited = new Set<NodeId>()
  const path: NodeId[] = [startNode]

  dfsChains(graph, startNode, endNode, visited, path, allChains)

  // Convertir en ChainResult
  for (const chain of allChains) {
    chains.push({
      found: true,
      chain,
      edges: chain.length - 1,
      message: `Chaîne: ${chain.join(' - ')}`,
    })
  }

  // Trier par longueur
  chains.sort((a, b) => a.chain.length - b.chain.length)

  return chains
}

/**
 * DFS helper pour trouver toutes les chaînes
 */
function dfsChains(
  graph: GraphState,
  current: NodeId,
  target: NodeId,
  visited: Set<NodeId>,
  path: NodeId[],
  allChains: NodeId[][],
): void {
  if (current === target) {
    allChains.push([...path])
    return
  }

  visited.add(current)

  for (const edge of graph.edges) {
    let neighbor: NodeId | null = null

    if (edge.from === current && !visited.has(edge.to)) {
      neighbor = edge.to
    } else if (edge.to === current && !visited.has(edge.from)) {
      neighbor = edge.from
    }

    if (neighbor !== null) {
      path.push(neighbor)
      dfsChains(graph, neighbor, target, visited, path, allChains)
      path.pop()
    }
  }

  visited.delete(current)
}

/**
 * Reconstruit une chaîne à partir de la map des parents (BFS)
 */
function reconstructChain(parent: Map<NodeId, NodeId>, start: NodeId, end: NodeId): NodeId[] {
  const chain: NodeId[] = []
  let current: NodeId | undefined = end

  while (current !== undefined) {
    chain.unshift(current)
    if (current === start) break
    current = parent.get(current)
  }

  return chain
}

/**
 * Vérifie si deux nœuds sont connectés par une chaîne
 */
export function areConnectedByChain(graph: GraphState, node1: NodeId, node2: NodeId): boolean {
  const result = findChain(graph, node1, node2)
  return result.found
}
