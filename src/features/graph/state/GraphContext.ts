import { createContext, type Dispatch } from 'react'
import type { GraphDocument } from '../model/types'
import type { GraphAction } from './graphReducer'
import type { HistoryState } from './historyReducer'

export const GraphStateContext = createContext<GraphDocument | null>(null)
export const GraphHistoryContext = createContext<HistoryState | null>(null)
export const GraphDispatchContext = createContext<Dispatch<GraphAction> | null>(
  null,
)

