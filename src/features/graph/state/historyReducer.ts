import { graphReducer, type GraphAction } from './graphReducer'
import type { GraphDocument } from '../model/types'

export interface HistoryState {
  past: GraphDocument[]
  present: GraphDocument
  future: GraphDocument[]
}

export type HistoryAction = GraphAction

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  const { past, present, future } = state

  if (action.type === 'UNDO') {
    if (past.length === 0) return state
    const previous = past[past.length - 1]
    const newPast = past.slice(0, past.length - 1)
    return {
      past: newPast,
      present: previous,
      future: [present, ...future],
    }
  }

  if (action.type === 'REDO') {
    if (future.length === 0) return state
    const next = future[0]
    const newFuture = future.slice(1)
    return {
      past: [...past, present],
      present: next,
      future: newFuture,
    }
  }

  if (action.type === 'JUMP_TO') {
    const timeline = [...past, present, ...future]
    if (timeline.length === 0) {
      return state
    }

    const targetIndex = Math.max(0, Math.min(action.payload.index, timeline.length - 1))
    const nextPresent = timeline[targetIndex]

    return {
      past: timeline.slice(0, targetIndex),
      present: nextPresent,
      future: timeline.slice(targetIndex + 1),
    }
  }

  // Handle standard graph actions
  const nextPresent = graphReducer(present, action)
  
  // If the action didn't change the state (e.g. invalid action), don't record it
  if (nextPresent === present) return state

  // For selection or draft actions, we don't necessarily want to record history
  // unless the user explicitly wants selection history. Usually we only record data changes.
  const isDataChange = !['SET_SELECTED_NODE', 'SET_SELECTED_EDGE', 'START_EDGE_DRAFT', 'CLEAR_EDGE_DRAFT', 'JUMP_TO'].includes(action.type)

  if (!isDataChange) {
    return {
      ...state,
      present: nextPresent
    }
  }

  return {
    past: [...past, present].slice(-50), // Limit history to 50 steps
    present: nextPresent,
    future: [],
  }
}
