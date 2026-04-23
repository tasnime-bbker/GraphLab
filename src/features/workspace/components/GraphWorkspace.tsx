import { GraphCanvas } from '../../graph-editor/components/GraphCanvas'
import { useGraphState } from '../../graph/state/useGraphStore'
import { MatrixEditor } from '../../matrix/components/MatrixEditor'
import { GraphContractPanel } from './GraphContractPanel'
import { GraphToolbar } from './GraphToolbar'
import { ModeSwitch } from './ModeSwitch'

export function GraphWorkspace() {
  const { mode } = useGraphState()

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Graph Lab UI</h1>
          <p className="mt-1 text-sm text-slate-600">
            Build graphs visually or with a matrix, then export the `GraphUI` contract.
          </p>
        </div>
      <GraphToolbar />
      <ModeSwitch />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          {mode === 'visual' ? <GraphCanvas /> : <MatrixEditor />}
          <GraphContractPanel />
        </div>
      </div>
    </main>
  )
}


