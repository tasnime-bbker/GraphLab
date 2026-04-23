import { GraphProvider } from './features/graph/state/GraphProvider'
import { GraphWorkspace } from './features/workspace/components/GraphWorkspace'

function App() {
  return (
    <GraphProvider>
      <GraphWorkspace />
    </GraphProvider>
  )
}

export default App
