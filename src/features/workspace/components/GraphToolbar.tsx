import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'
import { weightPolicyHint } from '../../graph/model/weightPolicy'

export function GraphToolbar() {
  const dispatch = useGraphDispatch()
  const { graph } = useGraphState()

  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={graph.directed}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          onChange={(event) =>
            dispatch({
              type: 'SET_DIRECTED',
              payload: { directed: event.currentTarget.checked },
            })
          }
        />
        Directed
      </label>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={graph.weighted}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          onChange={(event) =>
            dispatch({
              type: 'SET_WEIGHTED',
              payload: { weighted: event.currentTarget.checked },
            })
          }
        />
        Weighted
      </label>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          Weight policy
          <select
            value={graph.weightPolicy}
            disabled={!graph.weighted}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
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

        <button
          type="button"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => dispatch({ type: 'RESET' })}
        >
          Reset
        </button>

        <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">Nodes: {graph.nodes.length}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">Edges: {graph.edges.length}</span>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {graph.weighted
          ? `${weightPolicyHint(graph.weightPolicy)}. Right-click a node or double-click an edge to delete.`
          : 'Unweighted mode keeps all edge weights at 1.'}
      </p>
    </header>
  )
}


