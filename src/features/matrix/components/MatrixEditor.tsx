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
    <section className="flex flex-col h-full rounded-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl pointer-events-none"></div>
      
      <div className="p-4 md:p-6 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 rounded-t-2xl">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Adjacency Matrix
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Edit connections. {graph.weighted && weightPolicyHint(graph.weightPolicy)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            Nodes:
            <input
              type="number"
              min={0}
              value={graph.nodes.length}
              className="glass-input w-20 px-3 py-1.5 text-center font-semibold text-white bg-slate-800/80"
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
            className="glass-button-primary px-5 py-1.5 flex items-center gap-2"
            onClick={() => {
              dispatch({
                type: 'APPLY_ADJACENCY_MATRIX',
                payload: { matrix: matrixDraftToNumeric(matrixDraft) },
              })
              setDraftOverride(null)
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Apply Changes
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 overflow-auto flex-grow relative">
        <div className="inline-block min-w-full rounded-xl border border-slate-700/50 overflow-hidden shadow-2xl bg-slate-950/80">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 bg-slate-900 border-b border-r border-slate-700/50 px-4 py-3 shadow-[2px_2px_4px_rgba(0,0,0,0.2)]">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                </th>
                {orderedNodes.map((nodeId) => (
                  <th
                    key={`head-${nodeId}`}
                    className="sticky top-0 z-10 border-b border-slate-700/50 bg-slate-900 px-4 py-3 text-center shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-bold border border-slate-700/50">
                      {nodeId}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedNodes.map((rowNodeId, rowIndex) => (
                <tr key={`row-${rowNodeId}`} className="hover:bg-indigo-500/5 transition-colors group">
                  <th className="sticky left-0 z-10 border-r border-slate-700/50 bg-slate-900 px-4 py-3 text-center shadow-[2px_0_4px_rgba(0,0,0,0.2)] group-hover:bg-slate-800 transition-colors">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-bold border border-slate-700/50">
                      {rowNodeId}
                    </span>
                  </th>
                  {orderedNodes.map((columnNodeId, colIndex) => {
                    const value = matrixDraft[rowIndex]?.[colIndex] ?? '0'
                    const isZero = value === '0' || value === ''
                    return (
                      <td key={`${rowNodeId}-${columnNodeId}`} className="border border-slate-800/50 p-2 text-center transition-colors">
                        <input
                          inputMode="numeric"
                          className={`w-16 rounded-md px-2 py-1.5 text-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:scale-110 shadow-inner ${
                            isZero 
                              ? 'bg-slate-900/50 border border-slate-800 text-slate-600 hover:bg-slate-800/80 hover:text-slate-400' 
                              : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                          }`}
                          value={value}
                          onFocus={(e) => {
                            if (e.target.value === '0') {
                              e.target.select()
                            }
                          }}
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
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
