import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'

export function ModeSwitch() {
  const dispatch = useGraphDispatch()
  const { mode } = useGraphState()

  return (
    <div
      className="inline-flex w-fit rounded-xl bg-slate-900/60 p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-md border border-slate-700/50 relative"
      role="tablist"
      aria-label="Graph input mode"
    >
      <div 
        className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-indigo-600 rounded-lg shadow-md transition-all duration-300 ease-out z-0 ${mode === 'visual' ? 'left-1.5' : 'left-[calc(50%+1.5px)]'}`}
      ></div>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'visual'}
        className={`relative z-10 flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors duration-300 ${
          mode === 'visual'
            ? 'text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        onClick={() => dispatch({ type: 'SET_MODE', payload: { mode: 'visual' } })}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Visual Editor
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'matrix'}
        className={`relative z-10 flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors duration-300 ${
          mode === 'matrix'
            ? 'text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        onClick={() => dispatch({ type: 'SET_MODE', payload: { mode: 'matrix' } })}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Matrix Input
      </button>
    </div>
  )
}
