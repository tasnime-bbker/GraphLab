import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { CinemaAlgorithm } from '../utils/algorithmCinema'

const ALGORITHM_DOCS: Record<CinemaAlgorithm, { title: string, description: string, complexity: string, useCase: string, steps: string[], videoUrl: string }> = {
  BFS: {
    title: "Parcours en Largeur (BFS)",
    description: "Explore le graphe niveau par niveau, comme une onde de choc. Il visite d'abord tous les voisins immédiats avant de passer aux voisins des voisins.",
    complexity: "Temps: O(V + E) | Espace: O(V)",
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
    complexity: "Temps: O(V + E) | Espace: O(V)",
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
    complexity: "Temps: O(E log V) | Espace: O(V)",
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
    complexity: "Temps: O(E log V) | Espace: O(V)",
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
    complexity: "Temps: O(E log E) | Espace: O(V)",
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
    title: "Flot Maximum (Ford-Fulkerson / Edmonds-Karp)",
    description: "Trouve la quantité maximale de 'matière' (eau, données, trafic) qui peut transiter d'une source vers un puits sans dépasser les capacités des tuyaux (arêtes).",
    complexity: "Temps: O(V × E²) | Espace: O(V + E)",
    useCase: "Optimisation de trafic routier, distribution d'eau, et planification d'horaires.",
    steps: [
      "Initialisation : Commencez avec un flot de 0 sur toutes les arêtes du graphe.",
      "Graphe résiduel : Construisez un graphe résiduel montrant les capacités restantes. C'est ici que l'on peut annuler du flot si on s'est trompé de chemin.",
      "Recherche de chemin : Cherchez un 'chemin augmentant' de la source au puits dans ce graphe résiduel (ex: via BFS pour la méthode Edmonds-Karp).",
      "Goulot d'étranglement : Identifiez la capacité minimale le long de ce chemin. C'est votre goulot d'étranglement qui limite le flot.",
      "Augmentation : Ajoutez ce flot au chemin dans le graphe original, mettez à jour le graphe résiduel, et répétez jusqu'à ce qu'aucun chemin augmentant n'existe."
    ],
    videoUrl: "https://www.youtube.com/embed/Tl90tNtKvxs"
  },
  ConnectedComponents: {
    title: "Composantes Connexes",
    description: "Regroupe les nœuds qui sont connectés entre eux. Si vous pouvez aller du nœud A au nœud B, ils sont dans la même composante.",
    complexity: "Temps: O(V + E) | Espace: O(V)",
    useCase: "Analyse de réseaux sociaux (trouver des groupes d'amis fermés), segmentation d'images.",
    steps: [
      "Initialisation : Marquez tous les nœuds du graphe comme 'non visités'.",
      "Balayage : Parcourez tous les nœuds un par un dans l'ordre.",
      "Détection : Si vous trouvez un nœud non visité, créez un nouvel identifiant de composante (ex: un nouveau groupe ou une nouvelle couleur).",
      "Parcours : Lancez un parcours en largeur (BFS) ou en profondeur (DFS) depuis ce nœud. Tous les nœuds atteints reçoivent ce même identifiant de composante.",
      "Répétition : Continuez le balayage global jusqu'à ce que tous les nœuds aient été visités et assignés à un groupe."
    ],
    videoUrl: "https://www.youtube.com/embed/09_LlHjoEiY"
  },
  SpanningForest: {
    title: "Forêt Couvrante",
    description: "Génère un arbre couvrant pour chaque composante connexe du graphe. C'est l'équivalent du MST mais pour un graphe qui n'est pas entièrement connecté.",
    complexity: "Temps: O(V + E) | Espace: O(V)",
    useCase: "Création de sous-réseaux isolés ou analyse topologique de graphes déconnectés.",
    steps: [
      "Initialisation : Identifiez toutes les composantes connexes (les îles isolées) du graphe.",
      "Application locale : Pour chaque composante, choisissez un nœud de départ de manière arbitraire.",
      "Génération d'arbre : Appliquez un algorithme de parcours classique (comme BFS ou DFS) uniquement sur cette composante pour en extraire un arbre couvrant.",
      "Assemblage : La collection finale de tous ces arbres forme ce qu'on appelle une 'Forêt Couvrante'."
    ],
    videoUrl: "https://www.youtube.com/embed/Yldkh0aOEcg"
  },
  StronglyConnectedComponents: {
    title: "Composantes Fortement Connexes (Kosaraju / Tarjan)",
    description: "Dans un graphe orienté, identifie les groupes de nœuds où il est possible d'aller de n'importe quel nœud vers n'importe quel autre nœud du même groupe.",
    complexity: "Temps: O(V + E) | Espace: O(V)",
    useCase: "Analyse de la structure du Web (pages qui se lient mutuellement), écologie spatiale.",
    steps: [
      "Étape 1 (Parcours initial) : Lancez un parcours DFS sur tout le graphe et placez les nœuds dans une pile en fonction de leur heure de fin (le moment où tous leurs voisins ont été explorés).",
      "Étape 2 (Transposition) : Inversez la direction de toutes les arêtes du graphe pour créer un graphe 'transposé'.",
      "Étape 3 (Parcours final) : Dépilez les nœuds un par un. S'ils ne sont pas visités, lancez un nouveau DFS sur le graphe transposé depuis ce nœud.",
      "Résultat : Chaque ensemble de nœuds découvert lors d'un DFS à l'étape 3 constitue une Composante Fortement Connexe distincte."
    ],
    videoUrl: "https://www.youtube.com/embed/ohObUJ9Q6wQ"
  },
  Bellman: {
    title: "Algorithme de Bellman",
    description: "Calcule les plus courts chemins depuis une source. Contrairement à Dijkstra, il peut gérer les arêtes de poids négatif en 'relâchant' itérativement les distances.",
    complexity: "Temps: O(V × E) | Espace: O(V)",
    useCase: "Arbitrage financier (détection de cycles de taux de change profitables).",
    steps: [
      "Initialisation : Attribuez une distance de 0 à la source et l'infini aux autres nœuds. Préparez un tableau pour tracer les parents.",
      "Boucle principale : Vous allez effectuer exactement (V - 1) itérations, où V est le nombre de nœuds.",
      "Relâchement global : À chaque itération, parcourez TOUTES les arêtes du graphe. Pour chaque arête (u → v) de poids w, vérifiez si distance(u) + w < distance(v).",
      "Mise à jour : Si c'est le cas, mettez à jour distance(v) et définissez 'u' comme parent de 'v'.",
      "Terminaison : Après (V - 1) passages, le chemin le plus court est garanti pour tous les nœuds (sauf en cas de cycle négatif)."
    ],
    videoUrl: "https://www.youtube.com/embed/lyw4FaxrwHg"
  },
  BellmanFord: {
    title: "Algorithme de Bellman-Ford",
    description: "Similaire à Bellman, mais intègre une vérification finale pour détecter les cycles absorbants (cycles de poids négatif) qui rendent le chemin minimum impossible à calculer.",
    complexity: "Temps: O(V × E) | Espace: O(V)",
    useCase: "Routage réseau (protocole RIP) et détection de fraudes ou anomalies.",
    steps: [
      "Exécution classique : Exécutez l'algorithme de Bellman classique avec ses (V - 1) itérations de relâchement sur toutes les arêtes.",
      "La vérification (Étape cruciale) : Effectuez une itération supplémentaire (la V-ième itération) sur toutes les arêtes.",
      "Détection de cycle : Si lors de cette V-ième itération, vous parvenez ENCORE à réduire la distance d'un nœud, cela signifie qu'il existe un cycle de poids négatif.",
      "Alerte : Dans ce cas, l'algorithme s'arrête et signale qu'aucun chemin minimum n'existe (car on pourrait tourner dans le cycle à l'infini pour réduire le coût)."
    ],
    videoUrl: "https://www.youtube.com/embed/obWXjtg0L64"
  },
  WelshPowell: {
    title: "Coloration de Welsh-Powell",
    description: "Assigne des couleurs aux nœuds de sorte que deux nœuds reliés n'aient jamais la même couleur, en essayant d'utiliser le minimum de couleurs possibles. Trie les nœuds par degré décroissant.",
    complexity: "Temps: O(V log V + E) | Espace: O(V)",
    useCase: "Allocation de fréquences radio, planification d'examens (éviter que des étudiants aient deux examens en même temps), allocation de registres.",
    steps: [
      "Tri : Calculez le degré (nombre de connexions) de chaque nœud et triez-les par ordre décroissant.",
      "Première couleur : Prenez la première couleur disponible (ex: Rouge) et attribuez-la au premier nœud de la liste (celui avec le plus de connexions).",
      "Balayage : Parcourez le reste de la liste et attribuez cette même couleur à chaque nœud qui n'est PAS connecté directement à un nœud ayant déjà cette couleur.",
      "Nouvelle couleur : S'il reste des nœuds non colorés, prenez une nouvelle couleur (ex: Bleu) et répétez le balayage pour les nœuds restants.",
      "Terminaison : L'algorithme s'arrête lorsque 100% des nœuds possèdent une couleur."
    ],
    videoUrl: "https://www.youtube.com/embed/-4_F5OTFoyk"
  },
  EulerienPath: {
    title: "Chemin/Cycle Eulérien",
    description: "Trouve un chemin qui emprunte chaque arête du graphe exactement une fois. S'il revient au point de départ, c'est un Cycle Eulérien.",
    complexity: "Temps: O(V + E) | Espace: O(E)",
    useCase: "Problème du postier chinois, tracé de circuits, ramassage des ordures ménagères.",
    steps: [
      "Vérification : Vérifiez si le graphe possède 0 ou exactement 2 nœuds de degré impair. Sinon, aucun chemin eulérien n'est mathématiquement possible.",
      "Point de départ : Si 2 nœuds ont un degré impair, commencez par l'un d'eux. Sinon, commencez par n'importe quel nœud.",
      "Parcours : Parcourez les arêtes en évitant d'emprunter des 'ponts' (des arêtes dont la suppression diviserait le graphe en deux morceaux isolés), sauf si vous n'avez pas le choix.",
      "Suppression : Une fois une arête traversée, supprimez-la virtuellement pour ne pas la repasser.",
      "Terminaison : Continuez jusqu'à ce que toutes les arêtes aient été effacées du graphe."
    ],
    videoUrl: "https://www.youtube.com/embed/DH0Hxes2nOo"
  },
  RechercheChaine: {
    title: "Recherche de Chaîne / Chemin",
    description: "Un parcours basique guidé pour identifier s'il existe une séquence d'arêtes reliant spécifiquement un nœud source à un nœud cible de manière simple.",
    complexity: "Temps: O(V + E) | Espace: O(V)",
    useCase: "Vérification de connectivité basique, tests de routage.",
    steps: [
      "Vérification initiale : Assurez-vous que le graphe contient bien le nœud source et le nœud cible.",
      "Exploration guidée : Suivez les arêtes disponibles en partant de la source, en avançant nœud par nœud.",
      "Marquage : Marquez les arêtes et nœuds empruntés pour éviter de tourner en rond dans un cycle infini.",
      "Validation : Confirmez immédiatement le succès dès que le nœud cible est physiquement atteint."
    ],
    videoUrl: "https://www.youtube.com/embed/09_LlHjoEiY"
  },
  AllCycles: {
    title: "Recherche de Tous les Cycles/Circuits",
    description: "Détecte et affiche TOUS les cycles (graphe orienté) ou circuits (graphe non orienté) existants dans le graphe. Contrairement aux recherches basiques, cet algorithme explore exhaustivement pour trouver chaque boucle fermée.",
    complexity: "Temps: O(N(V + E)) | Espace: O(V²)",
    useCase: "Analyse de dépendances circulaires, détection de deadlocks dans les systèmes concurrents, analyse de boucles infinies possibles.",
    steps: [
      "Initialisation : Préparez une structure pour mémoriser tous les cycles découverts et un ensemble de cycles déjà vu pour éviter les doublons.",
      "Parcours itératif : Pour chaque nœud du graphe, initiez une recherche en profondeur (DFS) depuis ce nœud.",
      "Exploration complète : À chaque itération DFS, explorez tous les chemins possibles en gardant en mémoire le nœud de départ.",
      "Détection de boucle : Dès qu'un arête revient vers le nœud de départ et que le chemin a une longueur ≥ 2, enregistrez le cycle trouvé.",
      "Normalisation : Appliquez une fonction de normalisation pour éliminer les doublons (ex: 1→2→3→1 et 2→3→1→2 sont identiques).",
      "Résultat final : Retournez la liste complète et dédupliquée de tous les cycles/circuits trouvés."
    ],
    videoUrl: "https://www.youtube.com/embed/wqGv_kii6Vk"
  }
}

interface Props {
  algorithm: CinemaAlgorithm
}

export function AlgorithmEducationalCard({ algorithm }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary')
  const [showVideoModal, setShowVideoModal] = useState(false)
  const info = ALGORITHM_DOCS[algorithm]

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
            Learn : {info.title}
          </span>
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
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 space-y-4">
          
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-200 dark:bg-slate-900/50 rounded-lg overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className={`flex-1 min-w-[100px] text-xs font-bold uppercase tracking-wider py-2 rounded-md transition-all ${
                viewMode === 'summary' 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Résumé
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
              Étapes
            </button>
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="flex-1 min-w-[100px] text-xs font-bold uppercase tracking-wider py-2 rounded-md transition-all flex justify-center items-center gap-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Vidéo
            </button>
          </div>

          {viewMode === 'summary' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div>
                <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-1.5">Comment ça marche ?</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {info.description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700/30 shadow-sm dark:shadow-none">
                  <h4 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Complexité
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-mono font-semibold">
                    {info.complexity}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700/30 shadow-sm dark:shadow-none">
                  <h4 className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Cas d'usage
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
              <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest mb-3 flex items-center gap-1.5 sticky top-0 bg-slate-50/90 dark:bg-slate-800/90 py-1.5 backdrop-blur-sm z-10">
                Explication Pas-à-Pas
              </h4>
              <div className="relative border-l-2 border-slate-300 dark:border-slate-700/50 ml-3 pl-5 pb-3 space-y-6">
                {info.steps.map((step, idx) => {
                  const parts = step.split(' : ')
                  const title = parts.length > 1 ? parts[0] : `Étape ${idx + 1}`
                  const content = parts.length > 1 ? parts.slice(1).join(' : ') : step

                  return (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-white dark:bg-slate-900 border-2 border-purple-400 dark:border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)] dark:shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{content}</p>
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
              title="Fermer la vidéo"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Header Gradient Overlay (Optional) */}
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
              title={`Tutoriel ${info.title}`}
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
