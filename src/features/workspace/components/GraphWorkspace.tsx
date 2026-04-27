import { GraphCanvas } from '../../graph-editor/components/GraphCanvas'
import { useGraphState } from '../../graph/state/useGraphStore'
import { MatrixEditor } from '../../matrix/components/MatrixEditor'
import { GraphContractPanel } from './GraphContractPanel'
import { GraphHistoryTimeline } from './GraphHistoryTimeline'
import { GraphToolbar } from './GraphToolbar'
import { ModeSwitch } from './ModeSwitch'

export function GraphWorkspace() {
  const { mode, isDevMode } = useGraphState()

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 z-10 relative">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        
        <header className="flex flex-col items-start gap-2 mb-2">
          <div className="inline-flex items-center gap-3 w-full justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                Graph <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Lab</span>
              </h1>
            </div>
          </div>
          <p className="text-slate-400 text-sm md:text-base font-light ml-1">
            Build and visualize graphs intuitively, export instantly.
          </p>
        </header>

        <GraphToolbar />
        
        <div className="flex justify-center md:justify-start">
          <ModeSwitch />
        </div>

        <GraphHistoryTimeline />

        <div className={`grid grid-cols-1 gap-6 transition-all duration-500 ${isDevMode ? 'xl:grid-cols-[1fr_400px]' : 'xl:grid-cols-1'}`}>
          <div className="glass-panel p-1 flex flex-col min-h-[600px] transition-all duration-500 overflow-hidden">
            {mode === 'visual' ? <GraphCanvas /> : <MatrixEditor />}
          </div>
          {isDevMode && (
            <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
              <GraphContractPanel />
            </div>
          )}
        </div>
        
      </div>
    </main>
  )
}
