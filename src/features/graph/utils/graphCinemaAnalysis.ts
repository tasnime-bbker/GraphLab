import type { NodeId, GraphEdge } from '../model/types';
import type {
  AlgorithmCinemaPayload,
  CinemaNodeState,
  CinemaEdgeState,
  BfsStep,
  EulerienPathStep,
  AlgorithmType,
  AlgorithmStep,
  CinemaHighlight
} from '../model/algorithmContract';
import { analyzeEulerianProperties } from './graphAnalysis';

class CinemaStateBuilder {
  private nodes: Record<number, CinemaNodeState> = {};
  private edges: Record<string, CinemaEdgeState> = {};
  private stepCount = 0;

  constructor(nodeIds: NodeId[], edges: GraphEdge[], private startNode?: NodeId, private targetNode?: NodeId) {
    nodeIds.forEach(id => {
      let state: CinemaNodeState['state'] = 'idle';
      if (id === startNode) state = 'source';
      else if (id === targetNode) state = 'target';
      this.nodes[id] = { id, state };
    });

    edges.forEach(e => {
      this.edges[e.id] = { id: e.id, state: 'idle' };
    });
  }

  setNodeState(id: NodeId, state: CinemaNodeState['state'], badge?: string) {
    if (this.nodes[id]) {
      this.nodes[id] = { ...this.nodes[id], state, badge: badge ?? this.nodes[id].badge };
    }
  }

  setEdgeState(id: string, state: CinemaEdgeState['state'], badge?: string) {
    if (this.edges[id]) {
      this.edges[id] = { ...this.edges[id], state, badge: badge ?? this.edges[id].badge };
    }
  }

  snapshot<T extends AlgorithmStep>(
    algorithm: AlgorithmType,
    narration: string,
    highlights: CinemaHighlight[] = []
  ): T {
    this.stepCount++;
    return {
      stepId: this.stepCount,
      algorithm,
      narration,
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      edges: JSON.parse(JSON.stringify(this.edges)),
      highlights
    } as unknown as T;
  }
}

/**
 * Recherche une chaîne/chemin BFS en générant un payload 100% compatible AlgorithmCinema (Frontend)
 */
export function generateBfsCinema(nodes: NodeId[], edges: GraphEdge[], start: NodeId, end: NodeId): AlgorithmCinemaPayload {
  const builder = new CinemaStateBuilder(nodes, edges, start, end);
  const steps: BfsStep[] = [];

  steps.push(builder.snapshot<BfsStep>('BFS', `Démarrage de l'algorithme BFS. On part du sommet source ${start} vers la cible ${end}.`));

  // Adjacency for BFS
  const adj = new Map<NodeId, { to: NodeId; edgeId: string }[]>();
  nodes.forEach(n => adj.set(n, []));
  edges.forEach(e => {
    adj.get(e.from)!.push({ to: e.to, edgeId: e.id });
    adj.get(e.to)!.push({ to: e.from, edgeId: e.id });
  });

  const queue: NodeId[] = [start];
  const visited = new Set<NodeId>([start]);
  const parent = new Map<NodeId, NodeId>();
  const parentEdge = new Map<NodeId, string>();

  builder.setNodeState(start, 'frontier', '0');
  steps.push(builder.snapshot<BfsStep>('BFS', `Le sommet ${start} est ajouté à la file (frontier). Distance: 0.`));

  let found = false;

  bfsLoop:
  while (queue.length > 0) {
    const current = queue.shift()!;
    builder.setNodeState(current, 'visiting');
    steps.push(builder.snapshot<BfsStep>('BFS', `On dépile et on analyse le sommet ${current}.`));

    if (current === end) {
      found = true;
      builder.setNodeState(current, 'target');
      steps.push(builder.snapshot<BfsStep>('BFS', `Destination ${current} atteinte ! On a trouvé le chemin le plus court (en nombre d'arêtes).`));
      break bfsLoop;
    }

    const currentDistance = parseInt(builder.snapshot<BfsStep>('BFS', '').nodes[current].badge || '0', 10);

    for (const neighbor of (adj.get(current) || [])) {
      builder.setEdgeState(neighbor.edgeId, 'examining');
      steps.push(builder.snapshot<BfsStep>('BFS', `Examen de l'arête reliant ${current} à son voisin ${neighbor.to}.`));

      if (!visited.has(neighbor.to)) {
        visited.add(neighbor.to);
        parent.set(neighbor.to, current);
        parentEdge.set(neighbor.to, neighbor.edgeId);
        queue.push(neighbor.to);

        builder.setNodeState(neighbor.to, 'frontier', (currentDistance + 1).toString());
        builder.setEdgeState(neighbor.edgeId, 'tree_edge');
        steps.push(builder.snapshot<BfsStep>('BFS', `Le sommet ${neighbor.to} est découvert. Il est ajouté à la file d'attente à une distance de ${currentDistance + 1} !`));
      } else {
        builder.setEdgeState(neighbor.edgeId, 'idle');
        steps.push(builder.snapshot<BfsStep>('BFS', `Le sommet ${neighbor.to} a déjà été exploré ou est déjà dans la file. On ignore cette arête.`));
      }
    }

    builder.setNodeState(current, current === start ? 'source' : 'visited');
    steps.push(builder.snapshot<BfsStep>('BFS', `Fin de l'exploration des voisins pour le sommet ${current}. On le marque comme visité.`));
  }

  const finalPath: NodeId[] = [];
  if (found) {
    let curr: NodeId | undefined = end;
    while (curr !== undefined) {
      finalPath.unshift(curr);
      if (curr !== start && curr !== end) {
        builder.setNodeState(curr, 'in_path');
      }
      const eId = parentEdge.get(curr);
      if (eId) {
        builder.setEdgeState(eId, 'mst_edge'); // Highlight path edge
      }
      curr = parent.get(curr);
    }
    steps.push(builder.snapshot<BfsStep>('BFS', `Reconstruction du chemin depuis l'arborescence des parents.`));
  } else {
    steps.push(builder.snapshot<BfsStep>('BFS', `La file est vide. Impossible de trouver un chemin vers ${end}.`));
  }

  return {
    metadata: { algorithm: 'BFS', sourceNode: start, targetNode: end, graphSignature: "BFS_" + Date.now() },
    steps,
    result: { type: 'path', pathNodes: finalPath, distance: finalPath.length > 0 ? finalPath.length - 1 : 0 }
  };
}

/**
 * Algo: Eulerian Path / Circuit - VERSION CINEMA VISUALISATION
 */
export function generateEulerianCinema(nodes: NodeId[], edges: GraphEdge[]): AlgorithmCinemaPayload {
  const builder = new CinemaStateBuilder(nodes, edges);
  const steps: EulerienPathStep[] = [];

  steps.push(builder.snapshot<EulerienPathStep>('EulerienPath', "Initialisation: Évaluation des propriétés Eulériennes du graphe complet en étudiant les degrés et la connexité."));

  const props = analyzeEulerianProperties(nodes, edges);
  
  if (!props.hasEulerianPathOrChain) {
    steps.push(builder.snapshot<EulerienPathStep>('EulerienPath', `Échec: ${props.ruleMatched}. Il n'y a pas de chemin ou circuit eulérien possible.`));
    return {
      metadata: { algorithm: 'EulerienPath', graphSignature: "Euler_" + Date.now() },
      steps,
      result: { type: 'cycle_detected', message: props.ruleMatched }
    };
  }

  // Hierholzer
  const adj = new Map<NodeId, { to: NodeId, id: string }[]>();
  nodes.forEach(n => adj.set(n, []));
  edges.forEach(e => {
    adj.get(e.from)!.push({ to: e.to, id: e.id });
    adj.get(e.to)!.push({ to: e.from, id: e.id });
  });

  let startNode = nodes[0];
  if (props.oddDegreeCount === 2) {
    startNode = props.oddNodes[0];
    steps.push(builder.snapshot<EulerienPathStep>('EulerienPath', `Il s'agit d'une CHAIne Eulérienne (2 sommets impairs). Nous commençons obligatoirement par le noeud impair: ${startNode}.`));
  } else {
    steps.push(builder.snapshot<EulerienPathStep>('EulerienPath', `Il s'agit d'un CIRCUIT Eulérien (0 sommet impair). Nous commençons arbitrairement par le noeud: ${startNode}.`));
  }

  builder.setNodeState(startNode, 'source');
  
  const stack: NodeId[] = [startNode];
  const parcoursObj: NodeId[] = [];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    
    // Refresh visual (no need to spam, just when we visit)
    builder.setNodeState(current, 'visiting');
    steps.push(builder.snapshot<EulerienPathStep>('EulerienPath', `(Hierholzer) On est sur le sommet ${current}.`));

    const neighbors = adj.get(current) || [];

    if (neighbors.length > 0) {
      // Pick next
      const nextEdge = neighbors.pop()!;
      // Remove return edge (Graph is undirected for Eulerian)
      const nextNeighbors = adj.get(nextEdge.to)!;
      const revIndex = nextNeighbors.findIndex(x => x.to === current && x.id === nextEdge.id);
      if (revIndex !== -1) {
        nextNeighbors.splice(revIndex, 1);
      }

      builder.setEdgeState(nextEdge.id, 'examining');
      steps.push(builder.snapshot<EulerienPathStep>('EulerienPath', `Traversée de l'arête vers ${nextEdge.to}. L'arête est consommée / désactivée.`));
      
      builder.setEdgeState(nextEdge.id, 'tree_edge'); // Leave a trace
      builder.setNodeState(current, 'in_path');
      stack.push(nextEdge.to);
      
    } else {
      // Impasse -> Add to final path
      const popped = stack.pop()!;
      parcoursObj.push(popped);
      builder.setNodeState(popped, 'visited');
      steps.push(builder.snapshot<EulerienPathStep>('EulerienPath', `Plus d'arêtes sortantes pour ${popped}. Ce sommet est "bloqué" et intégré dans notre parcours final. On recule (backtrack) dans la pile.`));
    }
  }

  const finalPathNodes = parcoursObj.reverse();
  steps.push(builder.snapshot<EulerienPathStep>('EulerienPath', `L'algorithme a terminé toutes les arêtes. En lisant la pile à l'envers, on obtient le parcours eulérien (chemin ou circuit) final !`));

  return {
    metadata: { algorithm: 'EulerienPath', graphSignature: "Euler_" + Date.now() },
    steps,
    result: { type: 'path', pathNodes: finalPathNodes, distance: finalPathNodes.length - 1 }
  };
}