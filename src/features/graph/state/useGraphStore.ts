import { type Dispatch, useContext, useMemo } from 'react'
import { toGraphUI } from '../model/defaults'
import type { GraphDocument, GraphUI } from '../model/types'
import {
  GraphDispatchContext,
  GraphHistoryContext,
  GraphStateContext,
} from './GraphContext'
import type { GraphAction } from './graphReducer'
import type { HistoryState } from './historyReducer'

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

export function useGraphHistory(): HistoryState {
  const context = useContext(GraphHistoryContext)
  if (context === null) {
    throw new Error('useGraphHistory must be used inside GraphProvider')
  }

  return context
}

export function useGraphContract(): GraphUI {
  const state = useGraphState()

  return useMemo(() => toGraphUI(state), [state])
}

