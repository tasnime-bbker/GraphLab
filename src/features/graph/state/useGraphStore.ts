import { type Dispatch, useContext, useMemo } from 'react'
import { toGraphUI } from '../model/defaults'
import type { GraphDocument, GraphUI } from '../model/types'
import { GraphDispatchContext, GraphStateContext } from './GraphContext'
import type { GraphAction } from './graphReducer'

export function useGraphState(): GraphDocument {
  const context = useContext(GraphStateContext)
  if (context === null) {
    throw new Error('useGraphState must be used inside GraphProvider')
  }

  return context
}

export function useGraphDispatch(): Dispatch<GraphAction> {
  const context = useContext(GraphDispatchContext)
  if (context === null) {
    throw new Error('useGraphDispatch must be used inside GraphProvider')
  }

  return context
}

export function useGraphContract(): GraphUI {
  const state = useGraphState()

  return useMemo(() => toGraphUI(state), [state])
}

