import type { NodeId, GraphEdge } from '../model/types';

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

/**
 * 6. Cherche et retourne un cycle dans un graphe orienté (DFS).
 * @returns La liste des sommets formant le cycle, ou null si aucun cycle.
 */
export function findDirectedCycle(nodes: NodeId[], edges: GraphEdge[]): NodeId[] | null {
  const adj = buildAdjacencyList(nodes, edges, true);
  const visited = new Set<NodeId>();
  const inStack = new Set<NodeId>();
  const parent = new Map<NodeId, NodeId>();

  function dfsCycle(current: NodeId): NodeId[] | null {
    visited.add(current);
    inStack.add(current);

    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        parent.set(neighbor, current);
        const result = dfsCycle(neighbor);
        if (result) return result;
      } else if (inStack.has(neighbor)) {
        // Cycle détecté
        const cyclePath: NodeId[] = [neighbor];
        let curr: NodeId | undefined = current;
        while (curr !== undefined && curr !== neighbor) {
          cyclePath.unshift(curr);
          curr = parent.get(curr);
        }
        cyclePath.unshift(neighbor); // Fermer le cycle
        return cyclePath;
      }
    }

    inStack.delete(current);
    return null;
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      const cycle = dfsCycle(node);
      if (cycle) return cycle;
    }
  }

  return null;
}

/**
 * 7. Cherche et retourne un cycle (circuit) dans un graphe non orienté (DFS).
 * @returns La liste des sommets formant le circuit, ou null si aucun.
 */
export function findUndirectedCycle(nodes: NodeId[], edges: GraphEdge[]): NodeId[] | null {
  const adj = buildAdjacencyList(nodes, edges, false);
  const visited = new Set<NodeId>();
  const parent = new Map<NodeId, NodeId>();

  function dfsUndirectedCycle(current: NodeId, parentOfCurrent?: NodeId): NodeId[] | null {
    visited.add(current);

    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        parent.set(neighbor, current);
        const result = dfsUndirectedCycle(neighbor, current);
        if (result) return result;
      } else if (neighbor !== parentOfCurrent) {
        // Cycle détecté
        const cyclePath: NodeId[] = [neighbor];
        let curr: NodeId | undefined = current;
        while (curr !== undefined && curr !== neighbor) {
          cyclePath.unshift(curr);
          curr = parent.get(curr);
        }
        cyclePath.unshift(neighbor); // Fermer le cycle
        return cyclePath;
      }
    }
    return null;
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      const cycle = dfsUndirectedCycle(node);
      if (cycle) return cycle;
    }
  }
  return null;
}

/**
 * 8. Trouve et retourne le tracé exact d'un chemin ou circuit Eulérien 
 * en utilisant l'algorithme de Hierholzer (valable pour les graphes non orientés ici).
 * @returns La liste séquentielle des sommets parcourus, ou null s'il n'y a pas de parcours eulérien.
 */
export function findEulerianPathOrCircuit(nodes: NodeId[], edges: GraphEdge[]): NodeId[] | null {
  const properties = analyzeEulerianProperties(nodes, edges);
  
  if (!properties.hasEulerianPathOrChain) {
    return null; // Pas de chemin ni de circuit eulérien possible
  }

  // Création d'une liste d'adjacence mutable car nous allons consommer (supprimer) les arêtes
  const adj = buildAdjacencyList(nodes, edges, false);
  
  // Choix du point de départ : un noeud de degré impair s'il y en a, sinon n'importe lequel
  let startNode = nodes[0];
  if (properties.oddDegreeCount === 2) {
    startNode = properties.oddNodes[0];
  }

  const stack: NodeId[] = [startNode];
  const parcours: NodeId[] = [];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = adj.get(current) || [];

    if (neighbors.length > 0) {
      // On retire l'arête consommée
      const next = neighbors.pop()!;
      
      // On enlève aussi le chemin de retour (car graphe non-orienté)
      const nextNeighbors = adj.get(next)!;
      const reverseIndex = nextNeighbors.indexOf(current);
      if (reverseIndex !== -1) {
        nextNeighbors.splice(reverseIndex, 1);
      }

      stack.push(next);
    } else {
      // Plus de voisins, on intègre au parcours et on recule
      parcours.push(stack.pop()!);
    }
  }

  // L'algorithme de Hierholzer construit le parcours à l'envers
  return parcours.reverse();
}

export interface RegularGraphResult {
  isRegular: boolean;
  k: number | null;
}

/**
 * 9. Vérifie si un graphe est régulier.
 * Un graphe est régulier (k-régulier) si tous ses sommets ont le même degré k.
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes
 * @returns Un objet contenant un booléen `isRegular` et la valeur `k` si le graphe est régulier.
 */
export function checkRegularGraph(nodes: NodeId[], edges: GraphEdge[]): RegularGraphResult {
  if (nodes.length === 0) {
    return { isRegular: true, k: 0 }; // Un graphe vide peut être considéré 0-régulier
  }

  const degrees = calculateDegrees(nodes, edges);
  
  // Extraire toutes les valeurs de degré
  const degreeValues = Object.values(degrees);
  
  // Prendre le degré du premier sommet comme référence
  const firstDegree = degreeValues[0] as number;

  // Vérifier si tous les autres sommets ont exactement le même degré
  const isRegular = degreeValues.every(deg => deg === firstDegree);

  return {
    isRegular,
    k: isRegular ? firstDegree : null
  };
}