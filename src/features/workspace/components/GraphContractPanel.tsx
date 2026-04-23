import { useGraphContract } from '../../graph/state/useGraphStore'

export function GraphContractPanel() {
  const graphUI = useGraphContract()

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">GraphUI Output</h2>
      <p className="mt-1 text-xs text-slate-500">Backend contract payload preview.</p>
      <pre className="mt-3 max-h-[580px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
        {JSON.stringify(graphUI, null, 2)}
      </pre>
    </aside>
  )
}


