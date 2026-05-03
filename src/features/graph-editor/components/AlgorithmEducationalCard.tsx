import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import type { CinemaAlgorithm } from '../utils/algorithmCinema'
import { useI18n } from '../../../shared/context/I18nContext'
import { useGraphState } from '../../graph/state/useGraphStore'

interface AlgorithmInfo {
  title: string
  description: string
  complexity: string
  useCase: string
  steps: string[]
  videoUrl: string
}

const ALGORITHM_DOCS_FR: Record<CinemaAlgorithm, AlgorithmInfo> = {
  BFS: {
    title: "Parcours en Largeur (BFS)",
    description: "Explore le graphe niveau par niveau, comme une onde de choc. Il visite d'abord tous les voisins immédiats avant de passer aux voisins des voisins.",
    complexity: "Temps: O(N + E) | Espace: O(N)",
    useCase: "Trouver le chemin le plus court (en nombre d'arêtes) dans un labyrinthe ou un réseau non pondéré.",
    steps: [
      "Initialisation : Placez le nœud de départ dans une file d'attente (queue) et marquez-le comme 'visité'.",
      "Boucle principale : Tant que la file n'est pas vide, retirez le premier nœud de la file.",
      "Exploration : Pour chaque voisin non visité de ce nœud, marquez-le comme 'visité', mémorisez son parent, et ajoutez-le à la fin de la file.",
      "Terminaison : L'algorithme s'arrête quand la file est vide, garantissant que tous les nœuds accessibles ont été visités par le chemin le plus court."
    ],
    videoUrl: "https://www.youtube.com/embed/HZ5YTanv5QE"
  },
  DFS: {
    title: "Parcours en Profondeur (DFS)",
    description: "Explore le graphe en allant le plus loin possible dans une branche avant de revenir en arrière (backtracking). C'est comme explorer un labyrinthe en gardant une main sur le mur.",
    complexity: "Temps: O(N + E) | Espace: O(N)",
    useCase: "Détection de cycles, résolution de puzzles (Sudoku, labyrinthes), et tri topologique.",
    steps: [
      "Initialisation : Placez le nœud de départ dans une pile (stack) et marquez-le comme 'en cours'.",
      "Boucle principale : Tant que la pile n'est pas vide, examinez le nœud au sommet.",
      "Plongée : S'il possède des voisins non visités, choisissez-en un, marquez-le, et empilez-le. Répétez l'opération pour aller toujours plus profond.",
      "Remontée (Backtracking) : Si le nœud n'a plus de voisins non visités, retirez-le de la pile pour remonter au nœud précédent."
    ],
    videoUrl: "https://www.youtube.com/embed/Urx87-NMm6c"
  },
  Dijkstra: {
    title: "Algorithme de Dijkstra",
    description: "Trouve le chemin le plus court depuis une source vers tous les autres nœuds. Il agit comme une flaque d'eau qui s'étend en privilégiant toujours le chemin le moins coûteux.",
    complexity: "Temps: O(E log N) | Espace: O(N)",
    useCase: "Systèmes de navigation GPS (Google Maps) et routage réseau.",
    steps: [
      "Initialisation : Attribuez une distance de 0 au nœud de départ et une distance infinie (∞) à tous les autres. Placez les nœuds dans une file de priorité.",
      "Sélection : Extrayez le nœud ayant la plus petite distance actuelle connue.",
      "Relâchement (Relaxation) : Pour chaque voisin de ce nœud, calculez la distance totale depuis la source. Si cette distance est inférieure à celle actuellement mémorisée, mettez-la à jour.",
      "Mémorisation : Enregistrez le nœud actuel comme 'parent' du voisin pour pouvoir retracer le chemin le plus court à la fin.",
      "Terminaison : Répétez jusqu'à ce que la file de priorité soit vide."
    ],
    videoUrl: "https://www.youtube.com/embed/_lHSawdgXpI"
  },
  Prims: {
    title: "Algorithme de Prim (MST)",
    description: "Construit un Arbre Couvrant de Poids Minimum (MST) en partant d'un nœud et en ajoutant itérativement l'arête la moins chère qui connecte un nouveau nœud à l'arbre.",
    complexity: "Temps: O(E log N) | Espace: O(N)",
    useCase: "Câblage de réseaux électriques, conception de circuits imprimés (minimiser le coût du matériel).",
    steps: [
      "Initialisation : Choisissez un nœud de départ arbitraire. Marquez-le comme faisant partie de l'Arbre Couvrant Minimum (MST).",
      "Recherche : Identifiez toutes les arêtes qui connectent les nœuds déjà dans le MST aux nœuds qui n'y sont pas encore.",
      "Sélection : Choisissez l'arête ayant le poids le plus faible parmi toutes celles disponibles.",
      "Ajout : Ajoutez cette arête et le nouveau nœud cible au MST.",
      "Terminaison : Répétez les étapes 2 à 4 jusqu'à ce que tous les nœuds du graphe fassent partie du MST."
    ],
    videoUrl: "https://www.youtube.com/embed/cplfcGZmX7I"
  },
  Kruskals: {
    title: "Algorithme de Kruskal (MST)",
    description: "Trie toutes les arêtes par poids, puis les ajoute une par une à la solution finale tant qu'elles ne créent pas de cycle. Utilise une structure 'Union-Find'.",
    complexity: "Temps: O(E log E) | Espace: O(N)",
    useCase: "Réseaux de télécommunications et regroupement (clustering) de données.",
    steps: [
      "Initialisation : Considérez chaque nœud du graphe comme un arbre individuel (une forêt de N arbres isolés).",
      "Tri : Triez toutes les arêtes du graphe par ordre de poids croissant.",
      "Sélection itérative : Prenez l'arête avec le poids le plus faible disponible.",
      "Vérification de cycle : Vérifiez si les deux extrémités de l'arête appartiennent au même arbre. Si ce n'est pas le cas, ajoutez l'arête au MST et fusionnez les deux arbres.",
      "Terminaison : Arrêtez-vous lorsque le MST contient exactement (V - 1) arêtes."
    ],
    videoUrl: "https://www.youtube.com/embed/71UQH7Pr9kU"
  },
  MaxFlow: {
    title: "Flot Maximum (Ford-Fulkerson)",
    description: "Trouve la quantité maximale de 'matière' (eau, données, trafic) qui peut transiter d'une source vers un puits sans dépasser les capacités des tuyaux (arêtes).",
    complexity: "Temps: O(N × E²) | Espace: O(N + E)",
    useCase: "Optimisation de trafic routier, distribution d'eau, et planification d'horaires.",
    steps: [
      "Initialisation : Commencez avec un flot de 0 sur toutes les arêtes du graphe.",
      "Graphe résiduel : Construisez un graphe résiduel montrant les capacités restantes.",
      "Recherche de chemin : Cherchez un 'chemin augmentant' de la source au puits dans ce graphe résiduel.",
      "Goulot d'étranglement : Identifiez la capacité minimale le long de ce chemin.",
      "Augmentation : Ajoutez ce flot au chemin dans le graphe original et répétez jusqu'à ce qu'aucun chemin augmentant n'existe."
    ],
    videoUrl: "https://www.youtube.com/embed/Tl90tNtKvxs"
  },
  ConnectedComponents: {
    title: "Composantes Connexes",
    description: "Regroupe les nœuds qui sont connectés entre eux. Si vous pouvez aller du nœud A au nœud B, ils sont dans la même composante.",
    complexity: "Temps: O(N + E) | Espace: O(N)",
    useCase: "Analyse de réseaux sociaux (trouver des groupes d'amis fermés), segmentation d'images.",
    steps: [
      "Initialisation : Marquez tous les nœuds du graphe comme 'non visités'.",
      "Balayage : Parcourez tous les nœuds un par un.",
      "Détection : Si un nœud est non visité, créez un nouvel identifiant de composante.",
      "Parcours : Lancez un BFS/DFS pour marquer tous les nœuds accessibles avec cet identifiant.",
      "Répétition : Continuez jusqu'à ce que tous les nœuds aient été visités."
    ],
    videoUrl: "https://www.youtube.com/embed/09_LlHjoEiY"
  },
  SpanningForest: {
    title: "Forêt Couvrante",
    description: "Génère un arbre couvrant pour chaque composante connexe du graphe.",
    complexity: "Temps: O(N + E) | Espace: O(N)",
    useCase: "Création de sous-réseaux isolés ou analyse topologique de graphes déconnectés.",
    steps: [
      "Initialisation : Identifiez toutes les composantes connexes du graphe.",
      "Application locale : Pour chaque composante, choisissez un nœud de départ.",
      "Génération d'arbre : Appliquez BFS ou DFS pour en extraire un arbre couvrant.",
      "Assemblage : La collection finale forme une 'Forêt Couvrante'."
    ],
    videoUrl: "https://www.youtube.com/embed/Yldkh0aOEcg"
  },
  StronglyConnectedComponents: {
    title: "Composantes Fortement Connexes",
    description: "Dans un graphe orienté, identifie les groupes de nœuds où n'importe quel nœud peut atteindre n'importe quel autre nœud du même groupe.",
    complexity: "Temps: O(N + E) | Espace: O(N)",
    useCase: "Analyse de la structure du Web, écologie spatiale.",
    steps: [
      "Parcours initial : Lancez un DFS et placez les nœuds dans une pile selon leur heure de fin.",
      "Transposition : Inversez toutes les arêtes du graphe.",
      "Parcours final : Dépilez les nœuds et lancez un DFS sur le graphe transposé.",
      "Résultat : Chaque DFS constitue une Composante Fortement Connexe."
    ],
    videoUrl: "https://www.youtube.com/embed/ohObUJ9Q6wQ"
  },
  Bellman: {
    title: "Algorithme de Bellman",
    description: "Calcule les plus courts chemins depuis une source. Peut gérer les arêtes de poids négatif.",
    complexity: "Temps: O(N × E) | Espace: O(N)",
    useCase: "Arbitrage financier (taux de change).",
    steps: [
      "Initialisation : Distance 0 à la source, infini aux autres.",
      "Boucle : Effectuez (V - 1) itérations.",
      "Relâchement : À chaque itération, parcourez TOUTES les arêtes.",
      "Mise à jour : Si distance(u) + w < distance(v), mettez à jour distance(v).",
      "Terminaison : Le chemin le plus court est garanti après (V - 1) itérations."
    ],
    videoUrl: "https://www.youtube.com/embed/lyw4FaxrwHg"
  },
  BellmanFord: {
    title: "Algorithme de Bellman-Ford",
    description: "Similaire à Bellman, mais détecte les cycles de poids négatif.",
    complexity: "Temps: O(N × E) | Espace: O(N)",
    useCase: "Routage réseau et détection de fraudes.",
    steps: [
      "Exécution : Lancez Bellman pendant (V - 1) itérations.",
      "Vérification : Effectuez une V-ième itération sur toutes les arêtes.",
      "Détection : Si une distance est encore réduite, il existe un cycle négatif.",
      "Alerte : Signalez qu'aucun chemin minimum n'existe."
    ],
    videoUrl: "https://www.youtube.com/embed/obWXjtg0L64"
  },
  WelshPowell: {
    title: "Coloration de Welsh-Powell",
    description: "Assigne des couleurs aux nœuds de sorte que deux voisins n'aient jamais la même couleur.",
    complexity: "Temps: O(N log N + E) | Espace: O(N)",
    useCase: "Allocation de fréquences, planification d'examens.",
    steps: [
      "Tri : Triez les nœuds par degré décroissant.",
      "Coloration : Attribuez la première couleur au premier nœud.",
      "Balayage : Colorez tous les nœuds non adjacents avec la même couleur.",
      "Répétition : Prenez une nouvelle couleur pour les nœuds restants.",
      "Terminaison : Continuez jusqu'à ce que tous les nœuds soient colorés."
    ],
    videoUrl: "https://www.youtube.com/embed/-4_F5OTFoyk"
  },
  EulerienPath: {
    title: "Chemin/Cycle Eulérien",
    description: "Trouve un chemin qui emprunte chaque arête exactement une fois.",
    complexity: "Temps: O(N + E) | Espace: O(E)",
    useCase: "Problème du postier, tracé de circuits.",
    steps: [
      "Vérification : Vérifiez le nombre de nœuds de degré impair.",
      "Départ : Si 2 nœuds sont impairs, commencez par l'un d'eux.",
      "Parcours : Avancez sans emprunter de ponts prématurément.",
      "Suppression : Effacez chaque arête après l'avoir traversée.",
      "Terminaison : Continuez jusqu'à ce que toutes les arêtes soient effacées."
    ],
    videoUrl: "https://www.youtube.com/embed/DH0Hxes2nOo"
  },
  RechercheChaine: {
    title: "Recherche de Chaîne / Chemin",
    description: "Parcours guidé pour identifier un chemin entre une source et une cible.",
    complexity: "Temps: O(N + E) | Espace: O(N)",
    useCase: "Vérification de connectivité.",
    steps: [
      "Initialisation : Identifiez source et cible.",
      "Exploration : Suivez les arêtes en partant de la source.",
      "Marquage : Marquez les éléments visités.",
      "Validation : Succès si la cible est atteinte."
    ],
    videoUrl: "https://www.youtube.com/embed/09_LlHjoEiY"
  },
  EdgeColoring: {
    title: "Coloration des Arêtes",
    description: "Assigne une couleur à chaque arête pour que deux arêtes adjacentes aient des couleurs différentes.",
    complexity: "Temps: O(E × Δ) | Espace: O(E)",
    useCase: "Planification de tournois sportifs.",
    steps: [
      "Initialisation : Listez toutes les arêtes.",
      "Attribution : Pour chaque arête, vérifiez les couleurs des voisines.",
      "Sélection : Choisissez la plus petite couleur disponible.",
      "Répétition : Continuez pour toutes les arêtes."
    ],
    videoUrl: "https://www.youtube.com/embed/obWXjtg0L64"
  }
}

const ALGORITHM_DOCS_EN: Record<CinemaAlgorithm, AlgorithmInfo> = {
  BFS: {
    title: "Breadth-First Search (BFS)",
    description: "Explores the graph level by level, like a shockwave. It visits all immediate neighbors before moving to neighbors of neighbors.",
    complexity: "Time: O(N + E) | Space: O(N)",
    useCase: "Finding the shortest path in an unweighted labyrinth or network.",
    steps: [
      "Initialization: Place the starting node in a queue and mark it as 'visited'.",
      "Main Loop: While the queue is not empty, remove the first node.",
      "Exploration: For each unvisited neighbor, mark it as 'visited', store its parent, and add it to the queue.",
      "Termination: The algorithm stops when the queue is empty, ensuring all reachable nodes are visited."
    ],
    videoUrl: "https://www.youtube.com/embed/HZ5YTanv5QE"
  },
  DFS: {
    title: "Depth-First Search (DFS)",
    description: "Explores the graph by going as deep as possible into a branch before backtracking. It's like exploring a maze keeping a hand on the wall.",
    complexity: "Time: O(N + E) | Space: O(N)",
    useCase: "Cycle detection, solving puzzles (Sudoku, mazes), and topological sorting.",
    steps: [
      "Initialization: Place the starting node in a stack and mark it as 'active'.",
      "Main Loop: While the stack is not empty, examine the top node.",
      "Dive: If it has unvisited neighbors, pick one, mark it, and push it to the stack.",
      "Backtracking: If the node has no unvisited neighbors, pop it from the stack to go back."
    ],
    videoUrl: "https://www.youtube.com/embed/Urx87-NMm6c"
  },
  Dijkstra: {
    title: "Dijkstra's Algorithm",
    description: "Finds the shortest path from a source to all other nodes by always prioritizing the least expensive known path.",
    complexity: "Time: O(E log N) | Space: O(N)",
    useCase: "GPS navigation systems (Google Maps) and network routing.",
    steps: [
      "Initialization: Set distance 0 for the source and infinity (∞) for others. Place nodes in a priority queue.",
      "Selection: Extract the node with the smallest known distance.",
      "Relaxation: For each neighbor, calculate the total distance from the source. If smaller than known, update it.",
      "Memory: Save the current node as the neighbor's 'parent' to trace the path later.",
      "Termination: Repeat until the priority queue is empty."
    ],
    videoUrl: "https://www.youtube.com/embed/_lHSawdgXpI"
  },
  Prims: {
    title: "Prim's Algorithm (MST)",
    description: "Builds a Minimum Spanning Tree (MST) by starting from a node and adding the cheapest edge that connects a new node to the tree.",
    complexity: "Time: O(E log N) | Space: O(N)",
    useCase: "Electrical grid cabling, circuit board design (minimizing material cost).",
    steps: [
      "Initialization: Pick an arbitrary starting node and mark it as part of the MST.",
      "Search: Identify all edges connecting MST nodes to nodes not yet in the MST.",
      "Selection: Choose the edge with the lowest weight among available ones.",
      "Addition: Add this edge and the new target node to the MST.",
      "Termination: Repeat until all nodes are part of the MST."
    ],
    videoUrl: "https://www.youtube.com/embed/cplfcGZmX7I"
  },
  Kruskals: {
    title: "Kruskal's Algorithm (MST)",
    description: "Sorts all edges by weight, then adds them one by one to the final solution as long as they don't create a cycle.",
    complexity: "Time: O(E log E) | Space: O(N)",
    useCase: "Telecommunication networks and data clustering.",
    steps: [
      "Initialization: Consider each node as an individual tree (a forest of N isolated trees).",
      "Sorting: Sort all edges of the graph by increasing weight.",
      "Iterative Selection: Pick the edge with the lowest weight available.",
      "Cycle Check: Verify if both ends belong to the same tree. If not, add the edge and merge trees.",
      "Termination: Stop when the MST contains exactly (V - 1) edges."
    ],
    videoUrl: "https://www.youtube.com/embed/71UQH7Pr9kU"
  },
  MaxFlow: {
    title: "Maximum Flow (Ford-Fulkerson)",
    description: "Finds the maximum amount of traffic (water, data, etc.) that can travel from a source to a sink without exceeding edge capacities.",
    complexity: "Time: O(N × E²) | Space: O(N + E)",
    useCase: "Traffic optimization, water distribution, and scheduling.",
    steps: [
      "Initialization: Start with 0 flow on all edges.",
      "Residual Graph: Build a residual graph showing remaining capacities.",
      "Path Search: Find an 'augmenting path' from source to sink in the residual graph.",
      "Bottleneck: Identify the minimum capacity along this path.",
      "Augmentation: Add this flow to the path and update the residual graph until no more paths exist."
    ],
    videoUrl: "https://www.youtube.com/embed/Tl90tNtKvxs"
  },
  ConnectedComponents: {
    title: "Connected Components",
    description: "Groups nodes that are connected to each other. If you can go from A to B, they are in the same component.",
    complexity: "Time: O(N + E) | Space: O(N)",
    useCase: "Social network analysis (finding closed groups of friends), image segmentation.",
    steps: [
      "Initialization: Mark all nodes as 'unvisited'.",
      "Scanning: Go through all nodes one by one.",
      "Detection: If a node is unvisited, create a new component ID.",
      "Traversal: Run BFS/DFS to mark all reachable nodes with this ID.",
      "Repetition: Continue until all nodes are visited."
    ],
    videoUrl: "https://www.youtube.com/embed/09_LlHjoEiY"
  },
  SpanningForest: {
    title: "Spanning Forest",
    description: "Generates a spanning tree for each connected component of the graph.",
    complexity: "Time: O(N + E) | Space: O(N)",
    useCase: "Creating isolated subnets or topological analysis of disconnected graphs.",
    steps: [
      "Initialization: Identify all connected components of the graph.",
      "Local Application: For each component, pick a starting node.",
      "Tree Generation: Apply BFS or DFS to extract a spanning tree.",
      "Assembly: The final collection of trees forms a 'Spanning Forest'."
    ],
    videoUrl: "https://www.youtube.com/embed/Yldkh0aOEcg"
  },
  StronglyConnectedComponents: {
    title: "Strongly Connected Components",
    description: "In a directed graph, identifies groups of nodes where any node can reach any other node in the same group.",
    complexity: "Time: O(N + E) | Space: O(N)",
    useCase: "Web structure analysis, spatial ecology.",
    steps: [
      "Initial Pass: Run DFS and push nodes into a stack based on their finish time.",
      "Transposition: Reverse all edges in the graph.",
      "Final Pass: Pop nodes and run DFS on the transposed graph.",
      "Result: Each DFS discovery constitutes a separate Strongly Connected Component."
    ],
    videoUrl: "https://www.youtube.com/embed/ohObUJ9Q6wQ"
  },
  Bellman: {
    title: "Bellman Algorithm",
    description: "Calculates shortest paths from a source. Unlike Dijkstra, it can handle negative edge weights.",
    complexity: "Time: O(N × E) | Space: O(N)",
    useCase: "Financial arbitrage (exchange rates).",
    steps: [
      "Initialization: Distance 0 to source, infinity to others.",
      "Loop: Perform exactly (V - 1) iterations.",
      "Global Relaxation: In each iteration, scan ALL edges.",
      "Update: If distance(u) + w < distance(v), update distance(v).",
      "Termination: Shortest paths are guaranteed after (V - 1) passes."
    ],
    videoUrl: "https://www.youtube.com/embed/lyw4FaxrwHg"
  },
  BellmanFord: {
    title: "Bellman-Ford Algorithm",
    description: "Similar to Bellman, but includes a final check to detect negative weight cycles.",
    complexity: "Time: O(N × E) | Space: O(N)",
    useCase: "Network routing (RIP protocol) and fraud detection.",
    steps: [
      "Execution: Run standard Bellman for (V - 1) iterations.",
      "Verification: Perform one more iteration (the V-th pass) on all edges.",
      "Cycle Detection: If any distance is still reduced, a negative cycle exists.",
      "Alert: Signal that no minimum path exists due to the cycle."
    ],
    videoUrl: "https://www.youtube.com/embed/obWXjtg0L64"
  },
  WelshPowell: {
    title: "Welsh-Powell Coloring",
    description: "Assigns colors to nodes so that no two adjacent nodes share the same color, using minimal colors.",
    complexity: "Time: O(N log N + E) | Space: O(N)",
    useCase: "Radio frequency allocation, exam scheduling.",
    steps: [
      "Sorting: Sort nodes by descending degree.",
      "Coloring: Assign the first color to the first node in the list.",
      "Scanning: Color all non-adjacent nodes with the same color.",
      "New Color: Take a new color for remaining nodes and repeat.",
      "Termination: Stop when all nodes are colored."
    ],
    videoUrl: "https://www.youtube.com/embed/-4_F5OTFoyk"
  },
  EulerienPath: {
    title: "Eulerian Path/Cycle",
    description: "Finds a path that visits every edge in the graph exactly once.",
    complexity: "Time: O(N + E) | Space: O(E)",
    useCase: "Postman problem, circuit tracing.",
    steps: [
      "Verification: Check if the graph has 0 or 2 nodes of odd degree.",
      "Start: If 2 odd nodes exist, start at one. Otherwise, start anywhere.",
      "Traversal: Move through edges avoiding 'bridges' where possible.",
      "Removal: Remove each edge from the graph after crossing it.",
      "Termination: Continue until all edges are traversed."
    ],
    videoUrl: "https://www.youtube.com/embed/DH0Hxes2nOo"
  },
  RechercheChaine: {
    title: "Path Search",
    description: "Basic guided search to identify if a sequence of edges connects a source to a target.",
    complexity: "Time: O(N + E) | Space: O(N)",
    useCase: "Basic connectivity verification.",
    steps: [
      "Initial Check: Ensure source and target nodes exist.",
      "Guided Exploration: Follow available edges starting from source.",
      "Marking: Mark visited elements to avoid infinite cycles.",
      "Validation: Success if target node is physically reached."
    ],
    videoUrl: "https://www.youtube.com/embed/09_LlHjoEiY"
  },
  EdgeColoring: {
    title: "Edge Coloring",
    description: "Assigns a color to every edge so that no two edges sharing a common vertex have the same color.",
    complexity: "Time: O(E × Δ) | Space: O(E)",
    useCase: "Tournament scheduling, packet routing.",
    steps: [
      "Initialization: List all edges of the graph.",
      "Attribution: For each edge, check colors used by neighbors.",
      "Selection: Choose the smallest available color not used by neighbors.",
      "Répétition: Continue until all edges are colored."
    ],
    videoUrl: "https://www.youtube.com/embed/obWXjtg0L64"
  }
}

interface Props {
  algorithm: CinemaAlgorithm
}

export function AlgorithmEducationalCard({ algorithm }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary')
  const [showVideoModal, setShowVideoModal] = useState(false)
  const { t, locale } = useI18n()
  const { graph } = useGraphState()
  
  const info = locale === 'fr' ? ALGORITHM_DOCS_FR[algorithm] : ALGORITHM_DOCS_EN[algorithm]

  const getDynamicComplexity = (theo: string) => {
    const N = graph.nodes.length
    const E = graph.edges.length
    
    const parts = theo.split('|').map(p => {
      const sections = p.split(':')
      const label = sections[0]
      const formula = sections.slice(1).join(':')
      
      if (!formula) return p

      let math = formula
        .replace(/\bN\b/g, N.toString())
        .replace(/\bE\b/g, E.toString())
        .replace(/×/g, '*')
        .replace(/log/g, 'Math.log2')
        .replace(/²/g, '**2')
        .replace(/Δ/g, '3')
        .replace(/[O()]/g, '')
      
      try {
        // biome-ignore lint/security/noDirectEval: our strings only
        const value = new Function(`return ${math}`)()
        if (typeof value === 'number' && !isNaN(value)) {
          return `${label}: ~${Math.ceil(value)} op.`
        }
      } catch (e) {
        // fallback
      }
      return p
    })

    return parts.join(' | ')
  }

  const dynamicComplexity = info ? getDynamicComplexity(info.complexity) : ''

  if (!info) return null

  return (
    <div className="mt-4 border-t border-slate-200 dark:border-slate-700/50 pt-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {t('cinema.learn')}{info.title}
          </span>
          {info.complexity && (
            <span className="ml-auto mr-4 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20">
              {dynamicComplexity}
            </span>
          )}
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}
      >
        <div className="bg-blue-100/20 dark:bg-slate-800/40 rounded-xl p-4 border border-blue-200/40 dark:border-slate-700/50 space-y-4">
          
          {/* Tab Switcher */}
          <div className="flex p-1 bg-blue-100/50 dark:bg-slate-900/50 rounded-lg overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className={`flex-1 min-w-[100px] text-xs font-bold uppercase tracking-wider py-2 rounded-md transition-all ${
                viewMode === 'summary' 
                  ? 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 hover:text-blue-600 dark:hover:text-slate-300'
              }`}
            >
              {t('history.summary')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`flex-1 min-w-[100px] text-xs font-bold uppercase tracking-wider py-2 rounded-md transition-all flex justify-center items-center gap-1.5 ${
                viewMode === 'detailed' 
                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
              {t('cinema.stepByStep')}
            </button>
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="flex-1 min-w-[100px] text-xs font-bold uppercase tracking-wider py-2 rounded-md transition-all flex justify-center items-center gap-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              {t('cinema.video')}
            </button>
          </div>

          {viewMode === 'summary' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div>
                <h4 className="text-xs font-black uppercase text-blue-700 dark:text-blue-400 tracking-widest mb-1.5">{t('cinema.howItWorks')}</h4>
                <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                  {info.description}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-blue-100/40 dark:bg-slate-900/50 rounded-lg p-3 border border-blue-200/30 dark:border-slate-700/30 shadow-sm dark:shadow-none">
                  <h4 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {t('params.complexity')}
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-mono font-semibold">
                    {info.complexity}
                  </p>
                </div>

                <div className="bg-blue-100/40 dark:bg-slate-900/50 rounded-lg p-3 border border-blue-200/30 dark:border-slate-700/30 shadow-sm dark:shadow-none">
                  <h4 className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    {t('cinema.useCase')}
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-tight">
                    {info.useCase}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {viewMode === 'detailed' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              <h4 
                className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 sticky top-0 py-1.5 backdrop-blur-sm z-10"
                style={{ color: 'var(--app-accent)', backgroundColor: 'var(--app-surface-strong)' }}
              >
                {t('cinema.stepByStep')}
              </h4>
              <div 
                className="relative border-l-2 ml-3 pl-5 pb-3 space-y-6"
                style={{ borderColor: 'var(--app-border)' }}
              >
                {info.steps.map((step, idx) => {
                  const parts = step.split(' : ')
                  const title = parts.length > 1 ? parts[0] : `${t('cinema.step')} ${idx + 1}`
                  const content = parts.length > 1 ? parts.slice(1).join(' : ') : step

                  return (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <div 
                        className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 shadow-[0_0_10px_rgba(56,189,248,0.3)] dark:shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                        style={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-accent)' }}
                      ></div>
                      <h5 className="text-sm font-bold mb-1" style={{ color: 'var(--app-text)' }}>{title}</h5>
                      <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--app-muted)' }}>{content}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Modal Portal */}
      {showVideoModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 md:p-12 animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(225,29,72,0.15)] border border-slate-700/50 bg-black animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button 
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-slate-900/80 text-slate-300 hover:text-white hover:bg-rose-500 transition-colors cursor-pointer"
              title={locale === 'fr' ? 'Fermer la vidéo' : 'Close video'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Header Gradient Overlay */}
            <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
              <h3 className="text-rose-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2 drop-shadow-md">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Masterclass : {info.title}
              </h3>
            </div>

            <iframe 
              className="w-full aspect-video bg-black"
              src={`${info.videoUrl}?autoplay=1`} 
              title={`Tutorial ${info.title}`}
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
