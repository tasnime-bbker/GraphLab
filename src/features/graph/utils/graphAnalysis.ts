import type { NodeId, GraphEdge } from '../model/types';

/**
 * ============================================================================
 * GRAPH ANALYSIS UTILITIES
 * ============================================================================
 * Ensemble de fonctions pour analyser les propriétés d'un graphe :
 * - Recherche de chemins et chaînes (BFS, DFS)
 * - Analyse de connexité
 * - Propriétés eulériennes
 * - Détection de cycles
 * - Analyse de régularité
 * ============================================================================
 */

/**
 * Construit une liste d'adjacence à partir des noeuds et des arêtes.
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes
 * @param directed Si true, respecte l'orientation des arêtes; sinon traite comme non orienté
 * @returns Map contenant pour chaque noeud la liste de ses voisins
 */
function buildAdjacencyList(nodes: NodeId[], edges: GraphEdge[], directed: boolean): Map<NodeId, NodeId[]> {
  const adj = new Map<NodeId, NodeId[]>();
  nodes.forEach(n => adj.set(n, []));

  const seenEdges = new Set<string>();

  edges.forEach(e => {
    const edgeKey = directed
      ? e.id
      : (e.symmetryKey ?? `${Math.min(e.from, e.to)}:${Math.max(e.from, e.to)}:${e.weight}`);

    if (!directed && seenEdges.has(edgeKey)) {
      return;
    }
    seenEdges.add(edgeKey);

    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);

    adj.get(e.from)!.push(e.to);
    if (!directed) {
      adj.get(e.to)!.push(e.from);
    }
  });

  return adj;
}

// ============================================================================
// SECTION 1: RECHERCHE DE CHEMINS ET CHAÎNES
// ============================================================================

/**
 * Recherche une chaîne entre deux sommets en utilisant BFS (Breadth-First Search).
 * 
 * Note: Une "chaîne" en théorie des graphes ignore l'orientation des arêtes.
 * Cette fonction force directed=false pour la recherche.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @param start Sommet de départ
 * @param end Sommet d'arrivée
 * @returns La chaîne (chemin) de départ à arrivée, ou null si aucune chaîne existe
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
 * Recherche un chemin simple entre deux sommets en utilisant DFS (Depth-First Search).
 * 
 * Un chemin simple n'a pas de répétition de sommets.
 * Cette fonction respecte l'orientation si le graphe est orienté.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @param start Sommet de départ
 * @param end Sommet d'arrivée
 * @param directed Si true, respecte l'orientation des arêtes
 * @returns Le chemin simple de départ à arrivée, ou null si aucun chemin simple existe
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
 * Vérifie s'il existe une chaîne (chemin non orienté) entre deux sommets.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @param start Sommet de départ
 * @param end Sommet d'arrivée
 * @returns true si une chaîne existe entre start et end, false sinon
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
 * Vérifie s'il existe un chemin orienté entre deux sommets.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @param start Sommet de départ
 * @param end Sommet d'arrivée
 * @returns true si un chemin orienté existe entre start et end, false sinon
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

// ============================================================================
// SECTION 2: PROPRIÉTÉS BASIQUES DU GRAPHE
// ============================================================================

/**
 * Calcule le degré de chaque sommet dans un graphe.
 * 
 * Pour les propriétés eulériennes, on s'intéresse au degré global non orienté:
 * chaque arête contribue 1 au degré de chaque extrémité (même pour les graphes orientés).
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns Objet Record contenant le degré de chaque sommet
 */
export function calculateDegrees(nodes: NodeId[], edges: GraphEdge[]): Record<NodeId, number> {
  const degrees: Record<NodeId, number> = {};
  nodes.forEach(n => degrees[n] = 0);
  
  const seenEdges = new Set<string>();

  edges.forEach(e => {
    const edgeKey = e.symmetryKey ?? `${Math.min(e.from, e.to)}:${Math.max(e.from, e.to)}:${e.weight}`;
    if (e.directed === false && seenEdges.has(edgeKey)) {
      return;
    }
    seenEdges.add(edgeKey);

    degrees[e.from] = (degrees[e.from] || 0) + 1;
    degrees[e.to] = (degrees[e.to] || 0) + 1;
  });
  
  return degrees;
}

/**
 * Teste la connexité du graphe.
 * 
 * Vérifie si tous les sommets appartiennent à la même composante connexe globale
 * (ignorant l'orientation des arêtes pour tester la connexité faible).
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns true si le graphe est connexe, false sinon
 */
export function isConnected(nodes: NodeId[], edges: GraphEdge[], requireAllNodes = false): boolean {
  if (nodes.length === 0) return true;

  const degrees = calculateDegrees(nodes, edges);

  // Si requireAllNodes=false (comportement historique), on ignore les sommets isolés
  const toCheck = requireAllNodes ? nodes : nodes.filter(n => (degrees[n] || 0) > 0);
  if (toCheck.length === 0) return true; // aucune arête dans le graphe (ou aucun sommet à vérifier)

  const adj = buildAdjacencyList(nodes, edges, false);
  const visited = new Set<NodeId>();
  const queue: NodeId[] = [toCheck[0]];
  visited.add(toCheck[0]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // Le graphe est considéré connexe si tous les sommets à vérifier sont atteignables
  return toCheck.every(n => visited.has(n));
}

// ============================================================================
// SECTION 3: PROPRIÉTÉS EULÉRIENNES
// ============================================================================

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
 * Analyse les propriétés eulériennes d'un graphe.
 * 
 * Détermine si le graphe admet:
 * - Un circuit eulérien (graphe eulérien)
 * - Un chemin/chaîne eulérien
 * 
 * Règles strictes appliquées :
 * - Non connexe → pas d'Eulérien
 * - Connexe + 0 sommets impairs → graphe eulérien
 * - Connexe + 2 sommets impairs → chemin eulérien uniquement
 * - Plus de 2 sommets impairs → pas d'Eulérien
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns Objet contenant les propriétés eulériennes analysées
 */
export function analyzeEulerianProperties(
  nodes: NodeId[],
  edges: GraphEdge[],
  directed: boolean = edges.some(e => e.directed === true),
): EulerianAnalysisResult {

  // Pour l'analyse eulérienne, exiger la connexité sur tous les sommets
  let isConnexe = isConnected(nodes, edges, true);
  let oddNodes: NodeId[] = [];
  let oddDegreeCount = 0;
  let isEulerianGraph = false;
  let hasEulerianPathOrChain = false;
  let ruleMatched = '';

  if (!directed) {
    // Cas non orienté (déjà implémenté)
    const degrees = calculateDegrees(nodes, edges);
    oddNodes = Object.entries(degrees)
      .filter(([_, deg]) => (deg as number) % 2 !== 0)
      .map(([node, _]) => Number(node));
    oddDegreeCount = oddNodes.length;

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
  } else {
    // Graphe orienté : règles différentes
    // Calculer degrés entrants/sortants
    const inDegrees: Record<NodeId, number> = {};
    const outDegrees: Record<NodeId, number> = {};
    nodes.forEach(n => { inDegrees[n] = 0; outDegrees[n] = 0; });
    edges.forEach(e => {
      outDegrees[e.from] = (outDegrees[e.from] || 0) + 1;
      inDegrees[e.to] = (inDegrees[e.to] || 0) + 1;
    });

    // Comptage des sommets où in != out
    const diffNodes = Object.keys(nodes.reduce((acc: Record<string, number>, n) => { acc[n as any] = 0; return acc; }, {})).map(Number).filter(n => (inDegrees[n] || 0) !== (outDegrees[n] || 0));
    oddNodes = diffNodes as NodeId[];
    oddDegreeCount = oddNodes.length;

    // Pour un circuit eulérien orienté : chaque sommet a in == out et tous les sommets
    // avec degré non nul font partie d'une même composante fortement connexe.
    // Pour un chemin eulérien orienté : au maximum un sommet a out-in = 1 (start),
    // un sommet a in-out = 1 (end), les autres ont in == out, et le graphe est faiblement connexe.

    // Vérifier la connexité faible (déjà faite via isConnected)
    const weaklyConnected = isConnexe;

    // Vérifier la connexité forte sur les sommets non isolés
    function isStronglyConnectedDirected(): boolean {
      // Kosaraju simplifié
      const degrees = nodes.reduce((acc: Record<NodeId, number>, n) => { acc[n] = 0; return acc; }, {} as Record<NodeId, number>);
      edges.forEach(e => { degrees[e.from]++; degrees[e.to]++; });
      const nonIsolated = nodes.filter(n => (degrees[n] || 0) > 0);
      if (nonIsolated.length === 0) return true;

      const adj = new Map<NodeId, NodeId[]>();
      const rev = new Map<NodeId, NodeId[]>();
      nodes.forEach(n => { adj.set(n, []); rev.set(n, []); });
      edges.forEach(e => {
        if (!adj.has(e.from)) adj.set(e.from, []);
        if (!adj.has(e.to)) adj.set(e.to, []);
        adj.get(e.from)!.push(e.to);
        rev.get(e.to)!.push(e.from);
      });

      const start = nonIsolated[0];
      const visited1 = new Set<NodeId>();
      const stack: NodeId[] = [start];
      visited1.add(start);
      while (stack.length) {
        const u = stack.pop()!;
        for (const v of (adj.get(u) || [])) {
          if (!visited1.has(v)) { visited1.add(v); stack.push(v); }
        }
      }
      if (nonIsolated.some(n => !visited1.has(n))) return false;

      const visited2 = new Set<NodeId>();
      const stack2: NodeId[] = [start];
      visited2.add(start);
      while (stack2.length) {
        const u = stack2.pop()!;
        for (const v of (rev.get(u) || [])) {
          if (!visited2.has(v)) { visited2.add(v); stack2.push(v); }
        }
      }
      if (nonIsolated.some(n => !visited2.has(n))) return false;

      return true;
    }

    const stronglyConnected = isStronglyConnectedDirected();

    // Conditions
    const allEqual = nodes.every(n => (inDegrees[n] || 0) === (outDegrees[n] || 0));

    if (!weaklyConnected) {
      ruleMatched = 'Non faiblement connexe = pas d\'eulérien orienté';
    } else if (allEqual && stronglyConnected) {
      isEulerianGraph = true;
      hasEulerianPathOrChain = true;
      ruleMatched = 'Connexe forte + in==out pour tous = circuit eulérien orienté';
    } else {
      // vérifier condition de chemin eulérien orienté
      let startCount = 0;
      let endCount = 0;
      for (const n of nodes) {
        const diff = (outDegrees[n] || 0) - (inDegrees[n] || 0);
        if (diff === 1) startCount++;
        else if (diff === -1) endCount++;
        else if (diff !== 0) {
          startCount = 99; // invalide
          break;
        }
      }
      if (startCount === 1 && endCount === 1 && weaklyConnected) {
        hasEulerianPathOrChain = true;
        ruleMatched = 'Faiblement connexe + exactement un start(out-in=1) et un end(in-out=1) = chemin eulérien orienté';
      } else {
        ruleMatched = 'Conditions orientées non satisfaites = non eulérien orienté';
      }
    }
  }

  return {
    isConnexe,
    oddDegreeCount,
    oddNodes,
    isEulerianGraph,
    hasEulerianCircuitOrCycle: isEulerianGraph,
    hasEulerianPathOrChain,
    ruleMatched
  };
}

// ============================================================================
// SECTION 4: DÉTECTION DE CYCLES
// ============================================================================

/**
 * Cherche et retourne un cycle dans un graphe orienté.
 * 
 * Utilise DFS (Depth-First Search) avec détection de back-edge
 * pour identifier un cycle.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns La liste des sommets formant le cycle, ou null si aucun cycle n'existe
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
 * Cherche et retourne un cycle (circuit) dans un graphe non orienté.
 * 
 * Utilise DFS avec suivi du parent pour identifier un circuit.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns La liste des sommets formant le circuit, ou null si aucun ne existe
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
 * Trouve et retourne le tracé exact d'un chemin ou circuit eulérien.
 * 
 * Utilise l'algorithme de Hierholzer (valable pour graphes non orientés).
 * Retourne null si aucun chemin eulérien n'existe.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns La liste séquentielle des sommets parcourus, ou null s'il n'y a pas de parcours eulérien
 */
export function findEulerianPathOrCircuit(
  nodes: NodeId[],
  edges: GraphEdge[],
  directed: boolean = edges.some(e => e.directed === true),
): NodeId[] | null {
  const properties = analyzeEulerianProperties(nodes, edges, directed);
  
  if (!properties.hasEulerianPathOrChain) {
    return null; // Pas de chemin ni de circuit eulérien possible
  }
  // Construire une liste d'adjacence contenant les arêtes (id) afin de gérer
  // correctement les multigraphes et pouvoir consommer chaque arête.
  const adj = new Map<NodeId, { to: NodeId; id: string }[]>();
  nodes.forEach(n => adj.set(n, []));

  if (!directed) {
    const seenEdges = new Set<string>();
    edges.forEach(e => {
      const edgeKey = e.symmetryKey ?? `${Math.min(e.from, e.to)}:${Math.max(e.from, e.to)}:${e.weight}`;
      if (seenEdges.has(edgeKey)) return;
      seenEdges.add(edgeKey);

      if (!adj.has(e.from)) adj.set(e.from, []);
      if (!adj.has(e.to)) adj.set(e.to, []);
      adj.get(e.from)!.push({ to: e.to, id: e.id });
      adj.get(e.to)!.push({ to: e.from, id: e.id });
    });
  } else {
    // orienté : ne pas ajouter l'arête inverse
    edges.forEach(e => {
      if (!adj.has(e.from)) adj.set(e.from, []);
      if (!adj.has(e.to)) adj.set(e.to, []);
      adj.get(e.from)!.push({ to: e.to, id: e.id });
    });
  }

  // Choix du point de départ
  let startNode = nodes[0];
  if (!directed) {
    if (properties.oddDegreeCount === 2 && properties.oddNodes.length > 0) {
      startNode = properties.oddNodes[0];
    }
  } else {
    // pour orienté, préférer le sommet avec out-in == 1 s'il existe
    const inDeg: Record<NodeId, number> = {};
    const outDeg: Record<NodeId, number> = {};
    nodes.forEach(n => { inDeg[n] = 0; outDeg[n] = 0; });
    edges.forEach(e => { outDeg[e.from] = (outDeg[e.from] || 0) + 1; inDeg[e.to] = (inDeg[e.to] || 0) + 1; });
    const startCandidates = nodes.filter(n => (outDeg[n] || 0) - (inDeg[n] || 0) === 1);
    if (startCandidates.length > 0) startNode = startCandidates[0];
    else {
      const anyWithOut = nodes.find(n => (outDeg[n] || 0) > 0);
      if (anyWithOut) startNode = anyWithOut;
    }
  }

  const stack: NodeId[] = [startNode];
  const parcours: NodeId[] = [];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = adj.get(current) || [];

    if (neighbors.length > 0) {
      const nextEdge = neighbors.pop()!;
      if (!directed) {
        // Retirer l'arête inverse correspondant (même id) dans la liste du voisin
        const revList = adj.get(nextEdge.to)!;
        const revIndex = revList.findIndex(x => x.id === nextEdge.id && x.to === current);
        if (revIndex !== -1) revList.splice(revIndex, 1);
      }
      stack.push(nextEdge.to);
    } else {
      parcours.push(stack.pop()!);
    }
  }

  return parcours.reverse();
}

export interface EulerianTraceReport {
  properties: EulerianAnalysisResult;
  chainTrace: NodeId[] | null;
  cycleTrace: NodeId[] | null;
  chainMessage: string;
  cycleMessage: string;
  verdictMessage: string;
}

/**
 * Construit un rapport eulérien prêt à afficher.
 *
 * Le rapport expose:
 * - la chaîne eulérienne et sa trace si elle existe
 * - le cycle eulérien et sa trace si elle existe
 * - le verdict final sur le graphe eulérien
 */
export function buildEulerianTraceReport(
  nodes: NodeId[],
  edges: GraphEdge[],
  directed: boolean = edges.some(e => e.directed === true),
): EulerianTraceReport {
  const properties = analyzeEulerianProperties(nodes, edges, directed);
  const eulerianTrace = properties.hasEulerianPathOrChain ? findEulerianPathOrCircuit(nodes, edges, directed) : null;
  const chainTrace = eulerianTrace;
  const cycleTrace = properties.isEulerianGraph ? eulerianTrace : null;
  // Libellés selon orientation
  const pathLabel = directed ? 'Chemin' : 'Chaîne';
  const pathLabelLower = directed ? 'chemin' : 'chaîne';
  const circuitLabel = directed ? 'Circuit' : 'Cycle';
  const circuitLabelLower = directed ? 'circuit' : 'cycle';

  const chainMessage = properties.hasEulerianPathOrChain
    ? `${pathLabel} eulérien: oui. Trace du ${pathLabelLower}: ${chainTrace ? chainTrace.join(' → ') : 'trace indisponible'}.`
    : `${pathLabel} eulérien: non.`;

  const cycleMessage = properties.isEulerianGraph
    ? `${circuitLabel} eulérien: oui. Trace du ${circuitLabelLower}: ${cycleTrace ? cycleTrace.join(' → ') : 'trace indisponible'}.`
    : `${circuitLabel} eulérien: non. Aucun ${circuitLabelLower} eulérien n'existe dans ce graphe.`;

  const verdictMessage = properties.isEulerianGraph
    ? 'Graphe eulérien: oui.'
    : 'Graphe eulérien: non.';

  return {
    properties,
    chainTrace,
    cycleTrace,
    chainMessage,
    cycleMessage,
    verdictMessage,
  };
}

// ============================================================================
// SECTION 5: PROPRIÉTÉS DE RÉGULARITÉ
// ============================================================================

export interface RegularGraphResult {
  isRegular: boolean;
  k: number | null;
}

/**
 * Vérifie si un graphe est k-régulier.
 * 
 * Un graphe est k-régulier si tous ses sommets ont exactement le même degré k.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns Objet contenant un booléen `isRegular` et la valeur `k` (ou null si non régulier)
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
// ============================================================================
// SECTION 3: PROPRIÉTÉS EULÉRIENNES
// ============================================================================

// ... (tout le code existant reste intact) ...

// ↓ AJOUTER ICI, après analyzeEulerianProperties

/**
 * Vérifie si un graphe est eulérien.
 *
 * Un graphe est eulérien s'il est connexe ET que tous ses sommets
 * ont un degré pair (existence garantie d'un circuit eulérien).
 *
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns true si le graphe est eulérien, false sinon
 */
export function isEulerian(nodes: NodeId[], edges: GraphEdge[]): boolean {
  if (nodes.length === 0 || edges.length === 0) return false;

  // Exiger la connexité complète pour décider si le graphe est eulérien
  if (!isConnected(nodes, edges, true)) return false;

  const degrees = calculateDegrees(nodes, edges);
  const hasOddDegree = Object.values(degrees).some(deg => (deg as number) % 2 !== 0);

  return !hasOddDegree;
}

// ============================================================================
// SECTION 6: RECHERCHE DE TOUS LES CYCLES/CIRCUITS
// ============================================================================

/**
 * Trouve TOUS les cycles dans un graphe orienté.
 * 
 * Utilise une approche DFS modifiée pour explorer tous les chemins possibles
 * à partir de chaque nœud et détecter les cycles sans doublons.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns Tableau de tous les cycles trouvés (chaque cycle est un tableau de nœuds)
 */
export function findAllDirectedCycles(nodes: NodeId[], edges: GraphEdge[]): NodeId[][] {
  if (nodes.length === 0 || edges.length === 0) return [];

  const adj = buildAdjacencyList(nodes, edges, true);
  const allCycles: NodeId[][] = [];
  const seenCycles = new Set<string>();

  /**
   * Normalise un cycle pour éviter les doublons
   * Exemple: [1,2,3,1] et [2,3,1,2] représentent le même cycle
   */
  function normalizeCycle(cycle: NodeId[]): string {
    // Trouver le minimum
    const min = Math.min(...cycle.slice(0, -1));
    const minIdx = cycle.slice(0, -1).indexOf(min);
    // Créer la représentation canonique en commençant par le minimum
    const rotated = cycle.slice(minIdx, -1).concat(cycle.slice(0, minIdx));
    return rotated.join(',');
  }

  /**
   * DFS récursif pour trouver les cycles
   */
  function dfsForAllCycles(startNode: NodeId, currentNode: NodeId, path: NodeId[], visited: Set<NodeId>): void {
    visited.add(currentNode);
    path.push(currentNode);

    const neighbors = adj.get(currentNode) || [];
    for (const neighbor of neighbors) {
      if (neighbor === startNode && path.length > 1) {
        // Cycle détecté
        const cycle = [...path, startNode];
        const cycleKey = normalizeCycle(cycle);
        if (!seenCycles.has(cycleKey)) {
          seenCycles.add(cycleKey);
          allCycles.push([...path]);
        }
      } else if (!visited.has(neighbor)) {
        dfsForAllCycles(startNode, neighbor, path, visited);
      }
    }

    path.pop();
    visited.delete(currentNode);
  }

  // Lancer DFS depuis chaque nœud
  for (const startNode of nodes) {
    const visited = new Set<NodeId>();
    dfsForAllCycles(startNode, startNode, [], visited);
  }

  return allCycles;
}

/**
 * Trouve TOUS les circuits (cycles) dans un graphe non orienté.
 * 
 * Utilise une approche DFS modifiée pour explorer tous les chemins possibles
 * à partir de chaque nœud et détecter les circuits sans doublons.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns Tableau de tous les circuits trouvés (chaque circuit est un tableau de nœuds)
 */
export function findAllUndirectedCycles(nodes: NodeId[], edges: GraphEdge[]): NodeId[][] {
  if (nodes.length === 0 || edges.length === 0) return [];

  const adj = buildAdjacencyList(nodes, edges, false);
  const allCycles: NodeId[][] = [];
  const seenCycles = new Set<string>();

  /**
   * Normalise un cycle pour éviter les doublons
   * Pour les graphes non orientés, deux cycles sont identiques même
   * s'ils sont parcourus en sens opposé
   */
  function normalizeCycle(cycle: NodeId[]): string {
    const min = Math.min(...cycle.slice(0, -1));
    const minIdx = cycle.slice(0, -1).indexOf(min);
    const rotated = cycle.slice(minIdx, -1).concat(cycle.slice(0, minIdx));
    // Vérifier aussi la version inverse
    const reversed = [rotated[0], ...rotated.slice(1).reverse()];
    const rotatedKey = rotated.join(',');
    const reversedKey = reversed.join(',');
    return rotatedKey < reversedKey ? rotatedKey : reversedKey;
  }

  /**
   * DFS récursif pour trouver les circuits
   * parent est utilisé pour éviter de revenir immédiatement au parent
   */
  function dfsForAllCycles(
    startNode: NodeId,
    currentNode: NodeId,
    path: NodeId[],
    visited: Set<NodeId>,
    parentNode: NodeId | undefined
  ): void {
    visited.add(currentNode);
    path.push(currentNode);

    const neighbors = adj.get(currentNode) || [];
    for (const neighbor of neighbors) {
      // Éviter de revenir au parent immédiat
      if (neighbor === parentNode) continue;

      if (neighbor === startNode && path.length > 2) {
        // Circuit détecté (longueur >= 3)
        const circuit = [...path, startNode];
        const circuitKey = normalizeCycle(circuit);
        if (!seenCycles.has(circuitKey)) {
          seenCycles.add(circuitKey);
          allCycles.push([...path]);
        }
      } else if (!visited.has(neighbor)) {
        dfsForAllCycles(startNode, neighbor, path, visited, currentNode);
      }
    }

    path.pop();
    visited.delete(currentNode);
  }

  // Lancer DFS depuis chaque nœud
  for (const startNode of nodes) {
    const visited = new Set<NodeId>();
    dfsForAllCycles(startNode, startNode, [], visited, undefined);
  }

  return allCycles;
}