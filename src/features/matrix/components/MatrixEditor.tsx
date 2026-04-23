import { useMemo, useState } from 'react'
import { weightPolicyHint } from '../../graph/model/weightPolicy'
import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'
import { sortedNodes } from '../../graph/state/selectors'
import { graphToMatrixDraft, matrixDraftToNumeric } from '../utils/matrixConverters'

export function MatrixEditor() {
  const dispatch = useGraphDispatch()
  const { graph } = useGraphState()
  const orderedNodes = useMemo(() => sortedNodes(graph.nodes), [graph.nodes])
  const baseDraft = useMemo(() => graphToMatrixDraft(graph), [graph])
  const [draftOverride, setDraftOverride] = useState<string[][] | null>(null)
  const matrixDraft = draftOverride ?? baseDraft

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Matrix Input</h2>
      <p className="mt-1 text-sm text-slate-600">
        Edit adjacency matrix values then click Apply to update GraphUI.
      </p>
      {graph.weighted && (
        <p className="mt-1 text-xs text-slate-500">{weightPolicyHint(graph.weightPolicy)}</p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Node count
          <input
            type="number"
            min={0}
            value={graph.nodes.length}
            className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            onChange={(event) => {
              const count = Number(event.currentTarget.value)
              if (!Number.isFinite(count)) {
                return
              }

              dispatch({ type: 'RESIZE_NODE_COUNT', payload: { count } })
              setDraftOverride(null)
            }}
          />
        </label>
        <button
          type="button"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          onClick={() => {
            dispatch({
              type: 'APPLY_ADJACENCY_MATRIX',
              payload: { matrix: matrixDraftToNumeric(matrixDraft) },
            })
            setDraftOverride(null)
          }}
        >
          Apply Matrix
        </button>
      </div>

      <div className="mt-4 overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-slate-100 px-3 py-2 text-slate-600"></th>
              {orderedNodes.map((nodeId) => (
                <th
                  key={`head-${nodeId}`}
                  className="border border-slate-200 bg-slate-100 px-3 py-2 text-slate-700"
                >
                  {nodeId}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedNodes.map((rowNodeId, rowIndex) => (
              <tr key={`row-${rowNodeId}`}>
                <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-slate-700">
                  {rowNodeId}
                </th>
                {orderedNodes.map((columnNodeId, colIndex) => (
                  <td key={`${rowNodeId}-${columnNodeId}`} className="border border-slate-200 p-1">
                    <input
                      inputMode="numeric"
                      className="w-16 rounded-md border border-slate-300 px-1.5 py-1 text-center text-slate-800 focus:border-indigo-500 focus:outline-none"
                      value={matrixDraft[rowIndex]?.[colIndex] ?? '0'}
                      onChange={(event) => {
                        const next = matrixDraft.map((row) => [...row])
                        if (!next[rowIndex]) {
                          next[rowIndex] = []
                        }
                        next[rowIndex][colIndex] = event.currentTarget.value
                        setDraftOverride(next)
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}



