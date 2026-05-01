import { GraphProvider } from './features/graph/state/GraphProvider'
import { GraphWorkspace } from './features/workspace/components/GraphWorkspace'
import { I18nProvider } from './shared/context/I18nContext'
import { AppThemeProvider } from './shared/context/AppThemeContext'
import { ShortcutProvider } from './shared/context/ShortcutContext'

function App() {
  return (
    <AppThemeProvider>
      <I18nProvider>
        <ShortcutProvider>
          <GraphProvider>
            <GraphWorkspace />
          </GraphProvider>
        </ShortcutProvider>
      </I18nProvider>
    </AppThemeProvider>
  )
}

export default App
