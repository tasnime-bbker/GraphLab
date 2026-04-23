import { createContext, type Dispatch } from 'react'
import type { GraphDocument } from '../model/types'
import type { GraphAction } from './graphReducer'

export const GraphStateContext = createContext<GraphDocument | null>(null)
export const GraphDispatchContext = createContext<Dispatch<GraphAction> | null>(
  null,
)

