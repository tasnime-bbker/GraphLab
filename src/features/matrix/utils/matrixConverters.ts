import type { GraphState } from '../../graph/model/types'
import { buildAdjacencyMatrix } from '../../graph/state/selectors'

export function graphToMatrixDraft(graph: GraphState): string[][] {
  const matrix = buildAdjacencyMatrix(graph)
  return matrix.map((row) => row.map((value) => String(value)))
}

export function matrixDraftToNumeric(matrixDraft: string[][]): number[][] {
  return matrixDraft.map((row) =>
    row.map((cell) => {
      const value = Number(cell)
      return Number.isFinite(value) ? value : 0
    }),
  )
}

