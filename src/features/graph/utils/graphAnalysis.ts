import { NodeId, GraphEdge } from '../model/types';

/**
 * Construit une liste d'adjacence à partir des noeuds et des arêtes.
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes
 * @param directed Si true, respecte l'orientation des arêtes
 */
function buildAdjacencyList(nodes: NodeId[], edges: GraphEdge[], directed: boolean): Map<NodeId, NodeId[]> {
  const adj = new Map<NodeId, NodeId[]>();
  nodes.forEach(n => adj.set(n, []));

  edges.forEach(e => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);

    adj.get(e.from)!.push(e.to);
    if (!directed) {
      adj.get(e.to)!.push(e.from);
    }
  });

  return adj;
}

/**
 * 1. Rechercher une chaîne entre deux sommets p et s (Utilisation de BFS)
 * Note: En théorie des graphes, une "chaîne" ignore généralement l'orientation des arêtes.
 * Nous forçons directed = false pour rechercher une chaîne.
 */
export function findChainBFS(nodes: NodeId[], edges: GraphEdge[], start: NodeId, end: NodeId): NodeId[] | null {
  const adj = buildAdjacencyList(nodes, edges, false);
  
  const queue: NodeId[] = [start];
  const visited = new Set<NodeId>([start]);
  const parent = new Map<NodeId, NodeId>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === end) {
        // Reconstruire la chaîne
      const path: NodeId[] = [];
      let curr: NodeId | undefined = end;
      while (curr !== undefined) {
        path.unshift(curr);
        curr = parent.get(curr);
      }
      return path;
    }

    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }
  return null;
}

/**
 * 2. Rechercher un chemin simple entre p et s (sans répétition de sommets) (Utilisation de DFS)
 * Note: Un "chemin" respecte l'orientation si le graphe est orienté.
 */
export function findSimplePathDFS(nodes: NodeId[], edges: GraphEdge[], start: NodeId, end: NodeId, directed: boolean): NodeId[] | null {
  const adj = buildAdjacencyList(nodes, edges, directed);
  
  const visited = new Set<NodeId>();
  const path: NodeId[] = [];

  function dfs(current: NodeId): boolean {
    visited.add(current);
    path.push(current);

    if (current === end) {
      return true;
    }

    for (const neighbor of (adj.get(current) || [])) {
      // Pour s'assurer qu'il s'agit d'un chemin *simple*, 
      // on vérifie qu'on n'a pas déjà visité ce sommet.
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      }
    }

    // Retrait (backtrack) si on ne trouve pas la destination via ce sommet
    path.pop();
    visited.delete(current);
    return false;
  }

  if (dfs(start)) {
    return path;
  }
  return null;
}

/**
 * Vérifie s'il existe une chaîne abstraite (non orientée) entre p et s.
 * @returns true si la chaîne existe, sinon false.
 */
export function hasChain(nodes: NodeId[], edges: GraphEdge[], start: NodeId, end: NodeId): boolean {
  if (start === end) return true;
  // Une chaîne correspond à vérifier si un chemin existe dans le graphe non orienté
  const adj = buildAdjacencyList(nodes, edges, false);
  const queue: NodeId[] = [start];
  const visited = new Set<NodeId>([start]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === end) return true;

    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return false;
}

/**
 * Vérifie s'il existe un chemin orienté entre p et s.
 * @returns true si le chemin orienté existe, sinon false.
 */
export function hasPath(nodes: NodeId[], edges: GraphEdge[], start: NodeId, end: NodeId): boolean {
  if (start === end) return true;
  // Un chemin correspond à vérifier si on peut atteindre la destination en respectant l'orientation
  const adj = buildAdjacencyList(nodes, edges, true);
  const queue: NodeId[] = [start];
  const visited = new Set<NodeId>([start]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === end) return true;

    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return false;
}

/**
 * 4. Calculer le degré de chaque sommet

 * Pour les propriétés eulériennes de base, on s'intéresse au degré global non orienté.
 */
export function calculateDegrees(nodes: NodeId[], edges: GraphEdge[]): Record<NodeId, number> {
  const degrees: Record<NodeId, number> = {};
  nodes.forEach(n => degrees[n] = 0);
  
  edges.forEach(e => {
    degrees[e.from] = (degrees[e.from] || 0) + 1;
    degrees[e.to] = (degrees[e.to] || 0) + 1;
  });
  
  return degrees;
}

/**
 * 5. Tester la connexité du graphe
 * Vérifie si tous les sommets appartiennent à la même composante connexe globale.
 */
export function isConnected(nodes: NodeId[], edges: GraphEdge[]): boolean {
  if (nodes.length === 0) return true;

  // On ignore l'orientation pour tester la connexité globale (faible).
  const adj = buildAdjacencyList(nodes, edges, false);
  
  const visited = new Set<NodeId>();
  const queue: NodeId[] = [nodes[0]];
  visited.add(nodes[0]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === nodes.length;
}

export interface EulerianAnalysisResult {
  isConnexe: boolean;
  oddDegreeCount: number;
  oddNodes: NodeId[];
  isEulerianGraph: boolean;
  hasEulerianCircuitOrCycle: boolean;
  hasEulerianPathOrChain: boolean;
  ruleMatched: string;
}

/**
 * 3. Vérifier les propriétés Eulériennes :
 * - chaîne/chemin eulérien
 * - circuit/cycle eulérien
 * - graphe eulérien
 * 
 * Basé sur les règles strictes de l'énoncé :
 * - Connexe + 0 sommets impairs = graphe eulérien
 * - Connexe + 2 sommets impairs = chemin eulérien
 * - Plus de 2 impairs = non eulérien
 */
export function analyzeEulerianProperties(nodes: NodeId[], edges: GraphEdge[]): EulerianAnalysisResult {
  const degrees = calculateDegrees(nodes, edges);
  
  // Test de la connexité (Condition requise)
  const isConnexe = isConnected(nodes, edges);
  
  // Comptage des sommets ayant un degré impair
  const oddNodes = Object.entries(degrees)
    .filter(([_, deg]) => (deg as number) % 2 !== 0)
    .map(([node, _]) => Number(node));
    
  const oddDegreeCount = oddNodes.length;
  
  let isEulerianGraph = false;
  let hasEulerianPathOrChain = false;
  let ruleMatched = '';

  if (!isConnexe) {
    ruleMatched = "Non connexe = non eulérien";
  } else if (oddDegreeCount === 0) {
    isEulerianGraph = true;
    hasEulerianPathOrChain = true; 
    ruleMatched = "Connexe + 0 sommets impairs = graphe eulérien";
  } else if (oddDegreeCount === 2) {
    hasEulerianPathOrChain = true;
    ruleMatched = "Connexe + 2 sommets impairs = chemin eulérien";
  } else {
    ruleMatched = "Plus de 2 impairs = non eulérien";
  }
  
  return {
    isConnexe,
    oddDegreeCount,
    oddNodes,
    isEulerianGraph,
    // Dans ce contexte métier strict, si c'est un graphe eulérien, c'est aussi un circuit/cycle
    hasEulerianCircuitOrCycle: isEulerianGraph, 
    // Chemin s'il correspond aux mêmes règles
    hasEulerianPathOrChain,                     
    ruleMatched
  };
}