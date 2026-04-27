import {
  type PropsWithChildren,
  useReducer,
} from 'react'
import { initialDocument } from '../model/defaults'
import {
  GraphDispatchContext,
  GraphHistoryContext,
  GraphStateContext,
} from './GraphContext'
import { historyReducer } from './historyReducer'

export function GraphProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initialDocument,
    future: [],
  })

  return (
    <GraphHistoryContext.Provider value={state}>
      <GraphStateContext.Provider value={state.present}>
        <GraphDispatchContext.Provider value={dispatch}>
          {children}
        </GraphDispatchContext.Provider>
      </GraphStateContext.Provider>
    </GraphHistoryContext.Provider>
  )
}


