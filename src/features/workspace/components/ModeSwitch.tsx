import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'

export function ModeSwitch() {
  const dispatch = useGraphDispatch()
  const { mode } = useGraphState()

  return (
    <div
      className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
      role="tablist"
      aria-label="Graph input mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'visual'}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          mode === 'visual'
            ? 'bg-indigo-600 text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
        onClick={() => dispatch({ type: 'SET_MODE', payload: { mode: 'visual' } })}
      >
        Visual Editor
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'matrix'}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          mode === 'matrix'
            ? 'bg-indigo-600 text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
        onClick={() => dispatch({ type: 'SET_MODE', payload: { mode: 'matrix' } })}
      >
        Matrix Input
      </button>
    </div>
  )
}


