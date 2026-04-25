import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'
import { weightPolicyHint } from '../../graph/model/weightPolicy'

export function GraphToolbar() {
  const dispatch = useGraphDispatch()
  const { graph } = useGraphState()

  return (
    <div className="glass-panel p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={graph.directed}
                className="sr-only"
                onChange={(event) =>
                  dispatch({
                    type: 'SET_DIRECTED',
                    payload: { directed: event.currentTarget.checked },
                  })
                }
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${graph.directed ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${graph.directed ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Directed</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={graph.weighted}
                className="sr-only"
                onChange={(event) =>
                  dispatch({
                    type: 'SET_WEIGHTED',
                    payload: { weighted: event.currentTarget.checked },
                  })
                }
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${graph.weighted ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${graph.weighted ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Weighted</span>
          </label>

          <div className="h-6 w-px bg-slate-700/50 hidden md:block"></div>

          <label className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="text-slate-400">Policy:</span>
            <select
              value={graph.weightPolicy}
              disabled={!graph.weighted}
              className="glass-input px-3 py-1.5 min-w-[140px] appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-slate-900/80"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              onChange={(event) =>
                dispatch({
                  type: 'SET_WEIGHT_POLICY',
                  payload: {
                    policy: event.currentTarget.value as typeof graph.weightPolicy,
                  },
                })
              }
            >
              <option value="positive">Positive (&gt; 0)</option>
              <option value="nonNegative">Non-negative (&gt;= 0)</option>
              <option value="any">Any number</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-1.5 shadow-inner">
              <span className="text-slate-400">Nodes</span>
              <span className="font-semibold text-indigo-400">{graph.nodes.length}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-1.5 shadow-inner">
              <span className="text-slate-400">Edges</span>
              <span className="font-semibold text-indigo-400">{graph.edges.length}</span>
            </div>
          </div>

          <button
            type="button"
            className="glass-button px-4 py-1.5 text-sm flex items-center gap-2 hover:text-red-400 hover:border-red-500/30"
            onClick={() => dispatch({ type: 'RESET' })}
            title="Reset Graph"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
        
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-slate-400 font-light">
          {graph.weighted
            ? `${weightPolicyHint(graph.weightPolicy)}. Right-click a node or double-click an edge to delete.`
            : 'Unweighted mode keeps all edge weights at 1. Right-click node or double-click edge to delete.'}
        </p>
      </div>
    </div>
  )
}
