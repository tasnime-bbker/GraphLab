/**
 * Index principal pour tous les services d'algorithmes de graphes
 * Exporte les API publiques de tous les modules
 */

// Degree Service
export {
  calculateDegrees,
  getNodeDegree,
  getOddDegreeNodes,
  countOddDegreeNodes,
  type DegreeInfo,
  type DegreesResult,
} from './degrees/degreeService'

// Connectivity Service
export {
  isGraphConnected,
  findConnectedComponents,
  isConnectedFrom,
  getComponentCount,
  type ConnectivityResult,
} from './connectivity/connectivityService'

// Eulerian Service
export {
  analyzeEulerian,
  hasEulerianCycle,
  hasEulerianPath,
  hasEulerianChain,
  isGraphEulerian,
  getEulerianPathEndpoints,
  getEulerianSummary,
  type EulerianAnalysis,
} from './euler/eulerianServices'

// Chain Finder
export { findChain, findAllSimpleChains, areConnectedByChain, type ChainResult } from './chain/chainFinder'

// Simple Path Finder
export {
  findSimplePath,
  findAllSimplePaths,
  isSimplePath,
  countSimplePaths,
  type SimplePathResult,
} from './pathfinding/simplePathFinder'

// Pathfinding Algorithm (existing)
export { findPath, type PathResult } from './pathfinding/pathfindingAlgorithm'
