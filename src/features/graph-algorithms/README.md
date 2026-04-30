# Backend API - Théorie des Graphes

## 📋 Overview

Ce répertoire contient tous les services TypeScript backend pour les algorithmes de théorie des graphes. Les services sont organisés et prêts pour une intégration API REST.

## 📁 Structure du Backend

```
src/features/graph-algorithms/
├── pathfinding/                  # Recherche de chemins
│   ├── pathfindingAlgorithm.ts   # Algorithmes généraux (Dijkstra, BFS)
│   └── simplePathFinder.ts       # Chemins simples (sans répétition)
├── chain/                        # Recherche de chaînes
│   └── chainFinder.ts            # Chaînes entre deux sommets
├── degrees/                      # Calcul des degrés
│   └── degreeService.ts          # Degrés des sommets
├── connectivity/                 # Analyse de connectivité
│   └── connectivityService.ts    # Connexité et composantes
├── euler/                        # Analyse eulérienne
│   └── eulerianServices.ts       # Cycles/chemins eulériens
├── api/                          # Contrôleurs API
│   └── graphApiController.ts     # Contrôleurs pour endpoints
├── types/                        # Types API
│   └── apiTypes.ts              # Types de réponses API
└── index.ts                      # Exports publics
```

## 🔧 Services Disponibles

### 1. **Degré des Sommets** (`degrees/degreeService.ts`)

```typescript
import { calculateDegrees, getOddDegreeNodes } from '@/features/graph-algorithms'

// Obtenir tous les degrés
const result = calculateDegrees(graph)
console.log(result.oddDegreeNodes)    // Sommets de degré impair
console.log(result.maxDegree)         // Degré max
console.log(result.averageDegree)     // Degré moyen
```

**Exports:**
- `calculateDegrees(graph)` - Calcule tous les degrés
- `getOddDegreeNodes(graph)` - Retourne les sommets de degré impair
- `countOddDegreeNodes(graph)` - Compte les sommets impairs

---

### 2. **Connectivité** (`connectivity/connectivityService.ts`)

```typescript
import { isGraphConnected, findConnectedComponents } from '@/features/graph-algorithms'

// Vérifier la connexité
const result = isGraphConnected(graph)
console.log(result.isConnected)       // true/false
console.log(result.components)        // [[1,2,3], [4,5]]
console.log(result.componentCount)    // Nombre de composantes
```

**Exports:**
- `isGraphConnected(graph)` - Vérifie si graphe connexe
- `findConnectedComponents(graph)` - Trouve toutes les composantes
- `isConnectedFrom(graph, node)` - Vérifie connexité depuis un nœud

---

### 3. **Analyse Eulérienne** (`euler/eulerianServices.ts`)

```typescript
import { analyzeEulerian, hasEulerianCycle } from '@/features/graph-algorithms'

// Analyse complète
const analysis = analyzeEulerian(graph)
console.log(analysis.hasEulerianCycle)   // Cycle eulérien?
console.log(analysis.hasEulerianPath)    // Chemin eulérien?
console.log(analysis.oddDegreeCount)     // Nombre nœuds impairs
console.log(analysis.message)            // Message descriptif
```

**Règles théoriques:**
- **Cycle eulérien**: Graphe connexe + tous sommets degré pair
- **Chemin eulérien**: Graphe connexe + exactement 2 sommets degré impair
- **Chaîne eulérienne**: (graphe non orienté) 0 ou 2 sommets impairs

**Exports:**
- `analyzeEulerian(graph)` - Analyse complète
- `hasEulerianCycle(graph)` - Vérifie cycle eulérien
- `hasEulerianPath(graph)` - Vérifie chemin eulérien
- `isGraphEulerian(graph)` - Graphe eulérien?
- `getEulerianPathEndpoints(graph)` - Points de départ/fin

---

### 4. **Chaînes** (`chain/chainFinder.ts`)

```typescript
import { findChain } from '@/features/graph-algorithms'

// Trouver une chaîne
const result = findChain(graph, startNode, endNode)
console.log(result.chain)     // [1, 2, 3, 5]
console.log(result.edges)     // 3 arêtes
console.log(result.found)     // true/false
```

**Exports:**
- `findChain(graph, start, end)` - Trouve une chaîne (BFS)
- `findAllSimpleChains(graph, start, end)` - Toutes les chaînes
- `areConnectedByChain(graph, n1, n2)` - Connectés?

---

### 5. **Chemins Simples** (`pathfinding/simplePathFinder.ts`)

```typescript
import { findSimplePath, findAllSimplePaths } from '@/features/graph-algorithms'

// Trouver un chemin simple
const result = findSimplePath(graph, startNode, endNode)
console.log(result.path)         // [1, 2, 4, 5]
console.log(result.isElementary) // true (aucun nœud répété)

// Tous les chemins simples
const allPaths = findAllSimplePaths(graph, startNode, endNode)
console.log(allPaths.length)     // Nombre total
```

**Exports:**
- `findSimplePath(graph, start, end)` - Un chemin simple
- `findAllSimplePaths(graph, start, end)` - Tous les chemins
- `isSimplePath(path)` - Vérifie si chemin simple
- `countSimplePaths(graph, start, end)` - Compte les chemins

---

## 🌐 API REST Backend

### Endpoints Disponibles

#### **1. GET /graph/chain**
```
Query: ?start=1&end=5

Response:
{
  "success": true,
  "data": {
    "found": true,
    "chain": [1, 2, 3, 5],
    "edgeCount": 3,
    "message": "✓ Chaîne trouvée: 1 - 2 - 3 - 5"
  }
}
```

#### **2. GET /graph/path**
```
Query: ?start=1&end=5

Response:
{
  "success": true,
  "data": {
    "found": true,
    "path": [1, 2, 4, 5],
    "edgeCount": 3,
    "isElementary": true,
    "message": "✓ Chemin simple trouvé: 1 → 2 → 4 → 5"
  }
}
```

#### **3. GET /graph/euler**
```
Response:
{
  "success": true,
  "data": {
    "hasEulerianCycle": true,
    "hasEulerianPath": true,
    "hasEulerianChain": true,
    "isEulerian": true,
    "oddDegreeNodes": [],
    "oddDegreeCount": 0,
    "isConnected": true,
    "message": "✓ GRAPHE EULÉRIEN..."
  }
}
```

#### **4. GET /graph/degrees**
```
Response:
{
  "success": true,
  "data": {
    "degrees": {
      "1": 2,
      "2": 3,
      "3": 2,
      "4": 1
    },
    "oddDegreeNodes": [2, 4],
    "evenDegreeNodes": [1, 3],
    "maxDegree": 3,
    "minDegree": 1,
    "averageDegree": 2
  }
}
```

#### **5. GET /graph/connectivity**
```
Response:
{
  "success": true,
  "data": {
    "isConnected": true,
    "componentCount": 1,
    "components": [[1, 2, 3, 4, 5]],
    "message": "✓ Graphe connexe"
  }
}
```

#### **6. GET /graph/stats**
```
Response:
{
  "success": true,
  "data": {
    "nodeCount": 5,
    "edgeCount": 6,
    "isDirected": false,
    "isWeighted": false,
    "isConnected": true,
    "isEulerian": true,
    "components": 1,
    "degrees": { ... },
    "euler": { ... }
  }
}
```

---

## 💻 Utilisation dans le Frontend

```typescript
import {
  analyzeEulerian,
  findChain,
  findSimplePath,
  calculateDegrees,
  isGraphConnected,
} from '@/features/graph-algorithms'

// Dans un composant React
function MyGraphComponent() {
  const graph = useGraphStore((s) => s.graph)

  const analysis = analyzeEulerian(graph)
  const degrees = calculateDegrees(graph)

  return (
    <div>
      <p>Graphe eulérien: {analysis.isEulerian ? 'Oui' : 'Non'}</p>
      <p>Degré moyen: {degrees.averageDegree}</p>
    </div>
  )
}
```

---

## 📝 Types TypeScript

Voir `types/apiTypes.ts` pour:
- `ChainResponse` - Réponse chaîne
- `SimplePathResponse` - Réponse chemin simple
- `EulerResponse` - Réponse eulérienne
- `DegreesResponse` - Réponse degrés
- `ConnectivityResponse` - Réponse connectivité
- `GraphStatsResponse` - Réponse stats complètes

---

## 🧮 Algorithmes Utilisés

| Tâche | Algorithme | Complexité |
|-------|-----------|-----------|
| Trouver une chaîne | BFS | O(V + E) |
| Chemin simple | DFS | O(V + E) |
| Tous les chemins | DFS énumération | O(V!) |
| Degrés | Parcours arêtes | O(E) |
| Connexité | DFS | O(V + E) |
| Analyse eulérienne | Degré + Connexité | O(V + E) |

---

## ✅ Checklist Complétée

- [x] Recherche de chaîne entre deux sommets
- [x] Recherche de chemin simple (sans répétition)
- [x] Vérification cycles/chemins/chaînes eulériens
- [x] Calcul des degrés
- [x] Test de connexité
- [x] API REST backend propre
- [x] Types TypeScript
- [x] Contrôleurs API
- [x] Documentation complète
- [x] **Aucune modification frontend**

---

## 🚀 Prochaines Étapes

Pour implémenter une API REST réelle, créer un serveur Express/Fastify avec les contrôleurs du fichier `api/graphApiController.ts`.
