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

## 🔌 API REST Backend

### Endpoints disponibles

#### 1. **GET /graph/chain**
Trouver une chaîne entre deux sommets dans un graphe non orienté

**Paramètres** :
```
GET /graph/chain?start=0&end=3
```

**Réponse réussie** :
```json
{
  "success": true,
  "data": {
    "found": true,
    "chain": [0, 1, 2, 3],
    "edgeCount": 3,
    "distance": 3,
    "message": "✓ Chaîne trouvée: 0 - 1 - 2 - 3"
  }
}
```

---

#### 2. **GET /graph/path**
Trouver un chemin sans répétition de sommets (chemin élémentaire)

**Paramètres** :
```
GET /graph/path?start=0&end=3
```

**Réponse réussie** :
```json
{
  "success": true,
  "data": {
    "found": true,
    "path": [0, 1, 2, 3],
    "edgeCount": 3,
    "isElementary": true,
    "distance": 3,
    "message": "✓ Chemin élémentaire trouvé"
  }
}
```

---

#### 3. **GET /graph/euler**
Analyser complètement si le graphe contient des cycles/chemins eulériens

**Paramètres** :
```
GET /graph/euler
```

**Réponse réussie** :
```json
{
  "success": true,
  "data": {
    "hasEulerianCycle": true,
    "hasEulerianPath": false,
    "hasEulerianChain": true,
    "oddDegreeNodes": [],
    "isConnected": true,
    "message": "✓ Le graphe contient un cycle eulérien (tous les degrés sont pairs et connexe)"
  }
}
```

---

#### 4. **GET /graph/degrees**
Calculer les degrés de tous les sommets

**Paramètres** :
```
GET /graph/degrees
```

**Réponse réussie** :
```json
{
  "success": true,
  "data": {
    "degrees": {
      "0": 2,
      "1": 3,
      "2": 2,
      "3": 1
    },
    "oddDegreeNodes": [1, 3],
    "evenDegreeNodes": [0, 2],
    "oddCount": 2,
    "maxDegree": 3,
    "minDegree": 1,
    "averageDegree": 2.0,
    "message": "✓ Degrés calculés: 2 nœuds impairs, 2 nœuds pairs"
  }
}
```

---

#### 5. **GET /graph/connectivity**
Tester la connexité et trouver les composantes connexes

**Paramètres** :
```
GET /graph/connectivity
```

**Réponse réussie** :
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "components": [[0, 1, 2, 3]],
    "componentCount": 1,
    "largestComponent": [0, 1, 2, 3],
    "message": "✓ Graphe connexe: 1 composante"
  }
}
```

---

#### 6. **GET /graph/stats**
Obtenir les statistiques complètes du graphe

**Paramètres** :
```
GET /graph/stats
```

**Réponse réussie** :
```json
{
  "success": true,
  "data": {
    "vertexCount": 4,
    "edgeCount": 5,
    "isDirected": true,
    "isWeighted": false,
    "isConnected": true,
    "hasEulerianCycle": true,
    "averageDegree": 2.5,
    "message": "✓ Graphe orienté: 4 sommets, 5 arêtes"
  }
}
```

---

## 📊 Flux de données complet

### Exemple: Analyse eulérienne complète

```
┌─ ÉTAT INITIAL ────────────────────────────────┐
│ GraphState (Frontend Context):                │
│ - nodes: [0, 1, 2, 3]                         │
│ - edges: [{from:0,to:1}, {from:1,to:2}, ...]  │
│ - directed: false                             │
│ - weighted: false                             │
└───────────────────────────────────────────────┘
              ↓
┌─ APPEL API ───────────────────────────────────┐
│ const response = await fetch(                 │
│   '/graph/euler',                             │
│   { method: 'GET' }                           │
│ )                                             │
└───────────────────────────────────────────────┘
              ↓
┌─ BACKEND: analyzeEulerian() ──────────────────┐
│ 1. calculateDegrees(graph)                    │
│    → degrees: {0:2, 1:2, 2:2, 3:2}            │
│    → oddCount: 0                              │
│                                               │
│ 2. isGraphConnected(graph)                    │
│    → isConnected: true                        │
│                                               │
│ 3. Conditions de théorie:                     │
│    - Cycle eulérien? connexe + tous pairs     │
│    - Chemin eulérien? connexe + 2 impairs     │
│    - Chaîne eulérienne? (variant)             │
└───────────────────────────────────────────────┘
              ↓
┌─ RÉSULTAT API ────────────────────────────────┐
│ {                                             │
│   success: true,                              │
│   data: {                                     │
│     hasEulerianCycle: true,                   │
│     hasEulerianPath: false,                   │
│     hasEulerianChain: true,                   │
│     oddDegreeNodes: [],                       │
│     isConnected: true,                        │
│     message: "✓ Cycle eulérien"               │
│   }                                           │
│ }                                             │
└───────────────────────────────────────────────┘
              ↓
┌─ FRONTEND: Mettre à jour UI ──────────────────┐
│ const result = await response.json()          │
│ setState({ eulerAnalysis: result.data })      │
│ → Affiche: "✓ Cycle eulérien"                 │
└───────────────────────────────────────────────┘
```

---

## 🔗 Intégration Frontend

### Comment utiliser les services backend dans React

**Option 1: Appels HTTP directs (Recommandé)**

```typescript
import { useGraphState } from '@/features/graph/state/useGraphStore'

function MyComponent() {
  const { graph } = useGraphState()
  const [result, setResult] = useState(null)

  const analyzeEulerian = async () => {
    const response = await fetch('/graph/euler')
    const data = await response.json()
    setResult(data)
  }

  return (
    <div>
      <button onClick={analyzeEulerian}>Analyser Graphe</button>
      {result && <p>{result.data.message}</p>}
    </div>
  )
}
```

**Option 2: Importer les services directement**

```typescript
import {
  analyzeEulerian,
  calculateDegrees,
  findPath,
  isGraphConnected
} from '@/features/graph-algorithms'

function MyComponent() {
  const { graph } = useGraphState()

  const handleAnalysis = () => {
    const analysis = analyzeEulerian(graph)
    console.log(analysis.message)
    
    const degrees = calculateDegrees(graph)
    console.log(`Max degree: ${degrees.maxDegree}`)
  }

  return <button onClick={handleAnalysis}>Analyser</button>
}
```

---

## 📂 Structure dossiers mise à jour

```
src/features/
├── graph/
│   └── model/
│       ├── types.ts                 # Types GraphState, NodeId, etc.
│       ├── defaults.ts
│       ├── algorithmContract.ts
│       └── weightPolicy.ts
│
├── graph-algorithms/                ✨ NOUVEAU DOSSIER COMPLET
│   ├── degrees/
│   │   └── degreeService.ts         # Calcul des degrés
│   ├── connectivity/
│   │   └── connectivityService.ts   # Test de connexité
│   ├── euler/
│   │   └── eulerianServices.ts      # Analyse eulérienne
│   ├── chain/
│   │   └── chainFinder.ts           # Recherche de chaînes
│   ├── pathfinding/
│   │   ├── pathfindingAlgorithm.ts  # Dispatcher BFS/Dijkstra
│   │   └── simplePathFinder.ts      # Chemins simples (DFS)
│   ├── api/
│   │   └── graphApiController.ts    # Contrôleurs API
│   ├── types/
│   │   └── apiTypes.ts              # Interfaces API
│   ├── index.ts                     # Exports centralisés
│   └── README.md                    # Documentation détaillée
│
├── graph-editor/
│   └── components/
│       ├── GraphCanvas.tsx
│       ├── PathResultPanel.tsx
│       └── ... autres composants
│
└── workspace/
    └── components/
        ├── GraphWorkspace.tsx
        ├── GraphToolbar.tsx
        ├── GraphHistoryTimeline.tsx
        └── ... autres composants
```

---

## 🧪 Tests et validation

### Résumé des tests réussis ✅

**Test 1: Cycle simple**
- ✓ Calcul des degrés
- ✓ Test de connexité
- ✓ Recherche de chaîne
- ✓ Recherche de chemin simple
- ✓ Analyse eulérienne

**Test 2: Graphe eulérien**
- ✓ Détection correcte des cycles eulériens
- ✓ Connexité vérifiée
- ✓ Tous les degrés pairs

**Test 3: Graphe orienté**
- ✓ 2 chemins simples trouvés
- ✓ 1 composante connexe
- ✓ Degrés calculés correctement

**Test 4: Endpoints API**
- ✓ `/graph/chain` - Chaînes
- ✓ `/graph/path` - Chemins simples
- ✓ `/graph/euler` - Analyse eulérienne
- ✓ `/graph/degrees` - Degrés
- ✓ `/graph/connectivity` - Connexité
- ✓ `/graph/stats` - Statistiques

---

## 💡 Points clés pour les contributeurs

✅ **À retenir** :
- Tous les services sont dans `src/features/graph-algorithms/`
- Les types sont définis dans `src/features/graph/model/types.ts`
- Le contexte du graphe est accessible via `useGraphState()`
- Les services retournent toujours des interfaces TypeScript typées
- Support automatique orienté/non-orienté via `graph.directed`
- Utiliser l'export centralisé depuis `src/features/graph-algorithms/index.ts`

❌ **À éviter** :
- Modifier directement les types du graphe sans discussion
- Créer des états globaux en dehors du GraphContext
- Hardcoder les valeurs au lieu de les récupérer du graphe
- Oublier d'exporter les fonctions publiques
- Mélanger la logique métier et les composants React

---

## 🔄 Comment ajouter une nouvelle fonctionnalité

### Exemple: Ajouter une recherche de chemin avec exclusion de nœuds

1. **Créer la fonction dans le bon service** :
```typescript
// Dans src/features/graph-algorithms/pathfinding/pathfindingAlgorithm.ts
export function findPathExcluding(
  graph: GraphState,
  start: NodeId,
  end: NodeId,
  excludeNodes: Set<NodeId>
): PathResult {
  // Modifier BFS/Dijkstra pour ignorer les nœuds exclus
}
```

2. **Ajouter le type d'interface si nécessaire** :
```typescript
// Dans src/features/graph-algorithms/types/apiTypes.ts
interface PathWithExclusionResponse extends SimplePathResponse {
  excludedNodes: NodeId[]
}
```

3. **Exporter et utiliser** :
```typescript
import { findPathExcluding } from '@/features/graph-algorithms'

const result = findPathExcluding(graph, 0, 3, new Set([1, 2]))
```

---

## 📞 Support et questions

Pour des questions sur l'implémentation :
1. ✅ Consultez d'abord la documentation complète
2. ✅ Vérifiez les commentaires dans le code source
3. ✅ Référez-vous aux cas de test
4. ✅ Contactez Amen Allah pour clarifications

---

## 📋 Résumé des fichiers créés

| Fichier | Lignes | Description |
|---------|--------|-------------|
| degreeService.ts | ~119 | Calcul des degrés |
| connectivityService.ts | ~126 | Test de connexité |
| eulerianServices.ts | ~165 | Analyse eulérienne |
| chainFinder.ts | ~145 | Recherche de chaînes |
| simplePathFinder.ts | ~180 | Chemins élémentaires |
| pathfindingAlgorithm.ts | ~340 | Dispatcher BFS/Dijkstra |
| graphApiController.ts | ~165 | Contrôleurs API |
| apiTypes.ts | ~96 | Interfaces TypeScript |
| index.ts | ~35 | Exports centralisés |
| **TOTAL** | **~1,271** | **Code backend production** |

---

**Dernière mise à jour** : 30 avril 2026  
**Version** : 2.0 - Backend Complet  
**Statut** : ✅ Implémenté, testé et documenté  
**Prêt pour** : Push et déploiement
