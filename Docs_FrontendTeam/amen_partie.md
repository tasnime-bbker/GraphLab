# 📚 Documentation - Partie Backend Théorie des Graphes (Amen Allah)

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Backend](#architecture-backend)
3. [Services créés](#services-créés)
4. [Rôle de chaque service](#rôle-de-chaque-service)
5. [API REST Backend](#api-rest-backend)
6. [Intégration Frontend](#intégration-frontend)
7. [Guide pour les contributeurs](#guide-pour-les-contributeurs)

---

## 🎯 Vue d'ensemble

### Objectif Principal
Implémenter une **suite complète de services backend** pour la théorie des graphes :
- ✅ **Recherche de chemins et chaînes** entre deux sommets
- ✅ **Analyse eulérienne** (cycles, chemins, chaînes eulériens)
- ✅ **Calcul des degrés** de chaque sommet
- ✅ **Test de connexité** et composantes connexes
- ✅ **API REST** pour tous les services

### Cas supportés
✅ Graphes orientés et non orientés  
✅ Graphes pondérés et non pondérés  
✅ Algorithmes optimisés (BFS, DFS, Dijkstra)  
✅ Analyse théorique complète eulérienne  
✅ API backend production-ready

---

## 🏗️ Architecture Backend

### Vue globale

```
┌──────────────────────────────────────────────────────────────┐
│                    GraphWorkspace (Frontend)                  │
│                    Composant React Principal                  │
└──────────────────────────────────────────────────────────────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
        ┌──────────┐ ┌─────────┐ ┌─────────────────┐
        │GraphCanvas│ │Timeline │ │UI Panels (Props)│
        │ (visuel)  │ │ (histoire│ │- PathResultPanel│
        └──────────┘ └─────────┘ │- MetricsPanel   │
                                  └─────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
        ┌──────────────────┐ ┌──────────────────┐
        │  GraphContext    │ │  GraphState      │
        │  (État Global)   │ │  (Redux-like)    │
        └──────────────────┘ └──────────────────┘
                │
                │ Appels HTTP / Intégration
                ▼
    ┌───────────────────────────────────────────────┐
    │         BACKEND SERVICES (TypeScript)          │
    ├───────────────────────────────────────────────┤
    │                                               │
    │  📊 degreeService.ts                          │
    │  ├─ calculateDegrees(graph)                   │
    │  ├─ getOddDegreeNodes(graph)                  │
    │  └─ countOddDegreeNodes(graph)                │
    │                                               │
    │  🔗 connectivityService.ts                    │
    │  ├─ isGraphConnected(graph)                   │
    │  ├─ findConnectedComponents(graph)            │
    │  └─ getComponentCount(graph)                  │
    │                                               │
    │  🌀 eulerianServices.ts                       │
    │  ├─ analyzeEulerian(graph)                    │
    │  ├─ hasEulerianCycle(graph)                   │
    │  ├─ hasEulerianPath(graph)                    │
    │  └─ getEulerianPathEndpoints(graph)           │
    │                                               │
    │  ⛓️  chainFinder.ts                            │
    │  ├─ findChain(graph, start, end)              │
    │  ├─ findAllSimpleChains(graph)                │
    │  └─ areConnectedByChain(graph, s, e)          │
    │                                               │
    │  🛤️  simplePathFinder.ts                       │
    │  ├─ findSimplePath(graph, start, end)         │
    │  ├─ findAllSimplePaths(graph)                 │
    │  └─ countSimplePaths(graph)                   │
    │                                               │
    │  🗺️  pathfindingAlgorithm.ts                   │
    │  ├─ findPath(graph, start, end)               │
    │  ├─ BFS (non-pondéré)                         │
    │  └─ Dijkstra (pondéré)                        │
    │                                               │
    │  🔌 graphApiController.ts                     │
    │  └─ Contrôleurs pour 6 endpoints              │
    │                                               │
    └───────────────────────────────────────────────┘
                │
    ┌───────────┴────────────────────────────────┐
    │         API REST ENDPOINTS                 │
    ├────────────────────────────────────────────┤
    │ GET /graph/chain?start=X&end=Y             │
    │ GET /graph/path?start=X&end=Y              │
    │ GET /graph/euler                           │
    │ GET /graph/degrees                         │
    │ GET /graph/connectivity                    │
    │ GET /graph/stats                           │
    └────────────────────────────────────────────┘
```

---

## 📦 Services créés

---

## 🔍 Rôle de chaque service

### 1️⃣ **degreeService.ts**
**Localisation** : `src/features/graph-algorithms/degrees/`  
**Type** : Service backend (~119 lignes)

**Responsabilité** : Calculer et analyser les degrés de chaque sommet

**Fonctions principales** :
```typescript
calculateDegrees(graph: GraphState): DegreesResult
getOddDegreeNodes(graph: GraphState): NodeId[]
countOddDegreeNodes(graph: GraphState): number
getNodeDegree(graph: GraphState, nodeId: NodeId): number
```

**Résultat retourné** :
```typescript
interface DegreesResult {
  degrees: Map<NodeId, number>              // Degré de chaque nœud
  oddDegreeNodes: NodeId[]                  // Nœuds avec degré impair
  evenDegreeNodes: NodeId[]                 // Nœuds avec degré pair
  oddCount: number                          // Nombre de nœuds impairs
  maxDegree: number                         // Degré maximal
  minDegree: number                         // Degré minimal
  averageDegree: number                     // Degré moyen
  message: string                           // Description du résultat
}
```

---

### 2️⃣ **connectivityService.ts**
**Localisation** : `src/features/graph-algorithms/connectivity/`  
**Type** : Service backend (~126 lignes)

**Responsabilité** : Tester la connexité et trouver les composantes connexes

**Fonctions principales** :
```typescript
isGraphConnected(graph: GraphState): boolean
findConnectedComponents(graph: GraphState): NodeId[][]
isConnectedFrom(graph: GraphState, startNode: NodeId): boolean
getComponentCount(graph: GraphState): number
```

**Résultat retourné** :
```typescript
interface ConnectivityResult {
  isConnected: boolean                      // Le graphe est-il connexe?
  components: NodeId[][]                    // Liste des composantes
  componentCount: number                    // Nombre de composantes
  largestComponent: NodeId[]                // Composante la plus grande
  message: string                           // Description
}
```

---

### 3️⃣ **eulerianServices.ts**
**Localisation** : `src/features/graph-algorithms/euler/`  
**Type** : Service backend (~165 lignes)

**Responsabilité** : Analyse complète des cycles et chemins eulériens

**Théorie** :
- **Cycle eulérien** : graphe connexe + tous les degrés pairs
- **Chemin eulérien** : graphe connexe + exactement 2 nœuds de degré impair
- **Chaîne eulérienne** : alternative pour graphes non orientés

**Fonctions principales** :
```typescript
analyzeEulerian(graph: GraphState): EulerianAnalysis
hasEulerianCycle(graph: GraphState): boolean
hasEulerianPath(graph: GraphState): boolean
hasEulerianChain(graph: GraphState): boolean
getEulerianPathEndpoints(graph: GraphState): {start: NodeId, end: NodeId} | null
```

**Résultat retourné** :
```typescript
interface EulerianAnalysis {
  hasEulerianCycle: boolean                 // Existe-t-il un cycle eulérien?
  hasEulerianPath: boolean                  // Existe-t-il un chemin eulérien?
  hasEulerianChain: boolean                 // Existe-t-il une chaîne eulérienne?
  oddDegreeNodes: NodeId[]                  // Nœuds de degré impair
  pathStartNode?: NodeId                    // Point de départ du chemin
  pathEndNode?: NodeId                      // Point d'arrivée du chemin
  isConnected: boolean                      // Le graphe est-il connexe?
  message: string                           // Description complète
}
```

---

### 4️⃣ **chainFinder.ts**
**Localisation** : `src/features/graph-algorithms/chain/`  
**Type** : Service backend (~145 lignes)

**Responsabilité** : Trouver les chaînes (séquences d'arêtes) entre deux sommets

**Note** : Chaîne = suite d'arêtes dans un graphe non orienté

**Fonctions principales** :
```typescript
findChain(graph: GraphState, start: NodeId, end: NodeId): ChainResult
findAllSimpleChains(graph: GraphState, start: NodeId, end: NodeId): ChainResult[]
areConnectedByChain(graph: GraphState, s: NodeId, e: NodeId): boolean
```

**Résultat retourné** :
```typescript
interface ChainResult {
  found: boolean                            // Chaîne trouvée?
  chain: NodeId[]                           // Suite de nœuds
  edgeCount: number                         // Nombre d'arêtes
  distance: number                          // Distance totale
  message: string                           // Description
}
```

---

### 5️⃣ **simplePathFinder.ts**
**Localisation** : `src/features/graph-algorithms/pathfinding/`  
**Type** : Service backend (~180 lignes)

**Responsabilité** : Trouver les chemins sans répétition de sommets (chemins élémentaires)

**Algorithme** : DFS + backtracking pour énumération exhaustive

**Fonctions principales** :
```typescript
findSimplePath(graph: GraphState, start: NodeId, end: NodeId): SimplePathResult
findAllSimplePaths(graph: GraphState, start: NodeId, end: NodeId): SimplePathResult[]
isSimplePath(graph: GraphState, path: NodeId[]): boolean
countSimplePaths(graph: GraphState, start: NodeId, end: NodeId): number
```

**Résultat retourné** :
```typescript
interface SimplePathResult {
  found: boolean                            // Chemin trouvé?
  path: NodeId[]                            // Suite de nœuds
  edgeCount: number                         // Nombre d'arêtes
  isElementary: boolean                     // Aucune répétition?
  distance: number                          // Distance totale
  message: string                           // Description
}
```

---

### 6️⃣ **pathfindingAlgorithm.ts**
**Localisation** : `src/features/graph-algorithms/pathfinding/`  
**Type** : Service backend principal (~340 lignes)

**Responsabilité** : Dispatcher vers l'algorithme optimal (BFS ou Dijkstra)

**Algorithmes implémentés** :
| Cas | Algorithme |
|-----|-----------|
| Orienté + Non pondéré | **BFS** - O(V+E) |
| Orienté + Pondéré | **Dijkstra** - O((V+E)log V) |
| Non orienté + Non pondéré | **BFS** - O(V+E) |
| Non orienté + Pondéré | **Dijkstra** - O((V+E)log V) |

**Fonctions principales** :
```typescript
findPath(graph: GraphState, start: NodeId, end: NodeId): PathResult
findDirectedPath(graph: GraphState, start: NodeId, end: NodeId): PathResult
findUndirectedChain(graph: GraphState, start: NodeId, end: NodeId): PathResult
bfsDirected(graph, start, end): PathResult
dijkstraDirected(graph, start, end): PathResult
isPathEulerian(graph: GraphState, path: NodeId[]): boolean
```

**Résultat retourné** :
```typescript
interface PathResult {
  found: boolean                            // Chemin/chaîne trouvé(e)?
  path: NodeId[]                            // Chemin (graphe orienté)
  chain: NodeId[]                           // Chaîne (graphe non orienté)
  distance: number                          // Distance/coût total
  directed: boolean                         // Type de graphe
  isEulerian: boolean                       // Est-ce un chemin eulérien?
  message: string                           // Description complète
}
```

---

### 7️⃣ **graphApiController.ts**
**Localisation** : `src/features/graph-algorithms/api/`  
**Type** : Contrôleurs API (~165 lignes)

**Responsabilité** : Gérer les requêtes HTTP et dispatcher vers les services

**Contrôleurs implémentés** :
```typescript
handleChainRequest(queryParams): ApiResponse<ChainResponse>
handlePathRequest(queryParams): ApiResponse<SimplePathResponse>
handleEulerRequest(queryParams): ApiResponse<EulerResponse>
handleDegreesRequest(queryParams): ApiResponse<DegreesResponse>
handleConnectivityRequest(queryParams): ApiResponse<ConnectivityResponse>
handleStatsRequest(queryParams): ApiResponse<GraphStatsResponse>
```

---

### 8️⃣ **apiTypes.ts**
**Localisation** : `src/features/graph-algorithms/types/`  
**Type** : Définitions de types (~96 lignes)

**Responsabilité** : Typage TypeScript strict pour les réponses API

**Interfaces exposées** :
```typescript
interface ApiResponse<T>               // Wrapper standard
interface ChainResponse                // Réponse chaîne
interface SimplePathResponse           // Réponse chemin simple
interface EulerResponse                // Réponse analyse eulérienne
interface DegreesResponse              // Réponse degrés
interface ConnectivityResponse         // Réponse connexité
interface GraphStatsResponse           // Réponse statistiques complètes
```

---

### 9️⃣ **index.ts**
**Localisation** : `src/features/graph-algorithms/`  
**Type** : Export central (~35 lignes)

**Responsabilité** : Agrégation et ré-export de tous les services publics

```typescript
export * from './degrees/degreeService'
export * from './connectivity/connectivityService'
export * from './euler/eulerianServices'
export * from './chain/chainFinder'
export * from './pathfinding/simplePathFinder'
export * from './pathfinding/pathfindingAlgorithm'
export * from './api/graphApiController'
export * from './types/apiTypes'
```

---

## 📊 Flux de données

### Exemple : Recherche d'un chemin

```
┌─ ÉTAT INITIAL ─────────────────────────────────────┐
│ GraphState:                                        │
│ - nodes: [0, 1, 2, 3]                             │
│ - edges: [{from:0,to:1,weight:1}, ...]            │
│ - directed: true                                  │
│ - weighted: false                                 │
└────────────────────────────────────────────────────┘
              ↓
┌─ SAISIE UTILISATEUR ───────────────────────────────┐
│ startNode = 0                                      │
│ endNode = 3                                        │
└────────────────────────────────────────────────────┘
              ↓
┌─ APPEL findPath() ─────────────────────────────────┐
│ findPath(graph, 0, 3)                              │
│ → détecte : directed=true, weighted=false          │
│ → appelle bfsDirected(graph, 0, 3)                │
└────────────────────────────────────────────────────┘
              ↓
┌─ ALGORITHME BFS ───────────────────────────────────┐
│ Queue: [0]                                         │
│ Visited: {0}                                       │
│ Parent: {}                                         │
│                                                    │
│ Step 1: current=0 → explore neighbors [1]         │
│ Step 2: current=1 → explore neighbors [2]         │
│ Step 3: current=2 → explore neighbors [3]         │
│ Step 4: current=3 → FOUND! Reconstruct path       │
└────────────────────────────────────────────────────┘
              ↓
┌─ RÉSULTAT ─────────────────────────────────────────┐
│ PathResult:                                        │
│ {                                                  │
│   found: true,                                     │
│   path: [0, 1, 2, 3],                              │
│   chain: [0, 1, 2, 3],                             │
│   distance: 3,                                     │
│   directed: true,                                  │
│   message: "✓ Chemin trouvé: 0 → 1 → 2 → 3"      │
│ }                                                  │
└────────────────────────────────────────────────────┘
              ↓
┌─ AFFICHAGE ────────────────────────────────────────┐
│ Panel vert avec:                                   │
│ ✓ Chemin trouvé: 0 → 1 → 2 → 3                    │
│ Nœuds: 0 → 1 → 2 → 3                              │
│ Nombre d'étapes: 3                                │
│ Distance: 3                                        │
└────────────────────────────────────────────────────┘
```

---

## 🔌 Guide d'intégration pour d'autres membres

### Pour ajouter une nouvelle fonctionnalité au pathfinding

**Exemple : Ajouter "Find Shortest Path Excluding Nodes"**

1. **Ajouter la fonction dans `pathfindingAlgorithm.ts`** :
```typescript
export function findPathExcluding(
  graph: GraphState,
  startNode: NodeId,
  endNode: NodeId,
  excludeNodes: NodeId[]
): PathResult {
  // Logique: modifier BFS/Dijkstra pour ignorer certains nœuds
  // ...
}
```

2. **Ajouter UI dans `PathResultPanel.tsx`** :
```typescript
const [excludeNodes, setExcludeNodes] = useState<NodeId[]>([])

// Ajouter checkbox pour chaque nœud
// Appeler findPathExcluding() au lieu de findPath()
```

3. **Exporter et utiliser** :
```typescript
import { findPathExcluding } from '../../graph-algorithms/pathfinding/pathfindingAlgorithm'
```

---

### Pour ajouter un nouvel algorithme

**Structure à respecter** :

```typescript
// Dans pathfindingAlgorithm.ts

interface AlgorithmResult {
  // même interface PathResult
}

function myNewAlgorithm(
  graph: GraphState,
  startNode: NodeId,
  endNode: NodeId
): PathResult {
  // Implémentation
  return {
    found: boolean,
    path: NodeId[],
    chain: NodeId[],
    distance: number,
    directed: graph.directed,
    message: string
  }
}
```



---

## 📂 Structure de dossiers actuellement

```
src/features/
├── graph/
│   └── model/
│       ├── types.ts                 # Types GraphState, NodeId, etc.
│       ├── defaults.ts
│       ├── algorithmContract.ts
│       └── weightPolicy.ts
│
├── graph-algorithms/
│   ├── pathfinding/
│   │   └── pathfindingAlgorithm.ts  ✨ CRÉÉ (votre fichier)
│   └── utils/
│
├── graph-editor/
│   └── components/
│       ├── GraphCanvas.tsx
│       ├── PathResultPanel.tsx       ✨ CRÉÉ (votre fichier)
│       └── ... autres composants
│
└── workspace/
    └── components/
        ├── GraphWorkspace.tsx         ✨ MODIFIÉ
        ├── GraphToolbar.tsx
        ├── GraphHistoryTimeline.tsx
        └── ... autres composants
```

---

## 🧪 Cas de test complets

### Test 1 : Graphe orienté linéaire
```
Graph: 0→1→2→3
Test: findPath(graph, 0, 3)
Résultat attendu:
✓ found: true
✓ path: [0, 1, 2, 3]
✓ distance: 3
✓ message: "✓ Chemin trouvé: 0 → 1 → 2 → 3"
```

### Test 2 : Graphe non orienté
```
Graph: 0-1-2-3 (bidirectionnel)
Test: findPath(graph, 3, 0)
Résultat attendu:
✓ found: true
✓ chain: [3, 2, 1, 0]
✓ distance: 3
✓ message: "✓ Chaîne trouvée: 3 - 2 - 1 - 0"
```

### Test 3 : Pas de chemin
```
Graph: 0→1 | 2→3 (déconnecté)
Test: findPath(graph, 0, 3)
Résultat attendu:
✓ found: false
✓ path: []
✓ message: "❌ Aucun chemin trouvé de 0 vers 3"
```

### Test 4 : Nœud identique
```
Graph: 0→1→2
Test: findPath(graph, 1, 1)
Résultat attendu:
✓ found: true
✓ path: [1]
✓ distance: 0
✓ message: "✓ Nœud source et destination identiques"
```

---

## 💡 Points clés pour les contributeurs

✅ **À retenir** :
- Les types sont définis dans `src/features/graph/model/types.ts`
- Le contexte du graphe est accessible via `useGraphState()`
- Les algorithmes retournent toujours `PathResult` (interface standard)
- Le UI respece le design glassmorphism du projet
- Support automatique orienté/non-orienté via `graph.directed`

❌ **À éviter** :
- Modifier directement les types dans `types.ts` sans discussion
- Créer des états globaux en dehors du GraphContext
- Hardcoder les valeurs au lieu de les récupérer du graphe
- Oublier d'exporter les fonctions publiques

---

## 📞 Contact / Questions

Si vous avez des questions sur cette implémentation :
1. Consultez d'abord cette documentation
2. Cherchez dans les commentaires du code
3. Demandez à Amen Allah ou vérifiez les tests

---

**Dernière mise à jour** : 29 avril 2026  
**Statut** : ✅ Complété et testé  
**Version** : 1.0
