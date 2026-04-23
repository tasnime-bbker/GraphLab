import {
  type PropsWithChildren,
  useReducer,
} from 'react'
import { initialDocument } from '../model/defaults'
import { GraphDispatchContext, GraphStateContext } from './GraphContext'
import { graphReducer } from './graphReducer'

export function GraphProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(graphReducer, initialDocument)

  return (
    <GraphStateContext.Provider value={state}>
      <GraphDispatchContext.Provider value={dispatch}>
        {children}
      </GraphDispatchContext.Provider>
    </GraphStateContext.Provider>
  )
}


