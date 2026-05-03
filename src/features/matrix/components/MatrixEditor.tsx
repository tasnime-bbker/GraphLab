import { useMemo, useState } from 'react'
import { weightPolicyHint } from '../../graph/model/weightPolicy'
import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'
import { sortedNodes } from '../../graph/state/selectors'
import { graphToMatrixDraft, matrixDraftToNumeric } from '../utils/matrixConverters'
import { useI18n } from '../../../shared/context/I18nContext'

export function MatrixEditor() {
  const dispatch = useGraphDispatch()
  const { graph } = useGraphState()
  const { t } = useI18n()
  const orderedNodes = useMemo(() => sortedNodes(graph.nodes), [graph.nodes])
  const baseDraft = useMemo(() => graphToMatrixDraft(graph), [graph])
  const [draftOverride, setDraftOverride] = useState<string[][] | null>(null)
  const matrixDraft = draftOverride ?? baseDraft
  const n = orderedNodes.length

  // Dynamic scaling logic for responsiveness
  const isLarge = n > 10
  const isXLarge = n > 20
  const isXXLarge = n > 35

  const cellPadding = isXXLarge ? 'p-0.5' : isXLarge ? 'p-1' : isLarge ? 'p-1.5' : 'p-2'
  const inputWidth = isXXLarge ? 'w-7' : isXLarge ? 'w-8' : isLarge ? 'w-10' : 'w-14'
  const inputHeight = isXXLarge ? 'h-6' : isXLarge ? 'h-7' : isLarge ? 'h-8' : 'h-10'
  const headerSize = isXXLarge ? 'w-4 h-4' : isXLarge ? 'w-5 h-5' : isLarge ? 'w-6 h-6' : 'w-8 h-8'
  const fontSize = isXXLarge ? 'text-[8px]' : isXLarge ? 'text-[10px]' : isLarge ? 'text-xs' : 'text-sm'
  const headerFontSize = isXXLarge ? 'text-[7px]' : isXLarge ? 'text-[9px]' : isLarge ? 'text-[11px]' : 'text-xs'

  return (
    <section className="flex flex-col h-full rounded-2xl relative overflow-hidden" style={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-border)' }}>
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'linear-gradient(140deg, rgba(99,102,241,0.03) 0%, rgba(168,85,247,0.02) 60%)' }} />

      <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-t-2xl" style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--app-text)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--app-accent)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('matrix.title')}
          </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--app-muted)' }}>
            {t('matrix.subtitle')} {graph.weighted && weightPolicyHint(graph.weightPolicy)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--app-muted)' }}>
            {t('matrix.nodes')}:
            <input
              type="number"
              min={0}
              value={graph.nodes.length}
              className="glass-input w-20 px-3 py-1.5 text-center font-semibold"
              style={{ backgroundColor: 'var(--app-surface-strong)', color: 'var(--app-text)', borderColor: 'var(--app-border)' }}
              onChange={(event) => {
                const count = Number(event.currentTarget.value)
                if (!Number.isFinite(count)) {
                  return
                }

                dispatch({ type: 'RESIZE_NODE_COUNT', payload: { count } })
                setDraftOverride(null)
              }}
            />
          </label>
          <button
            type="button"
            className="glass-button-primary px-5 py-1.5 flex items-center gap-2"
            onClick={() => {
              dispatch({
                type: 'APPLY_ADJACENCY_MATRIX',
                payload: { matrix: matrixDraftToNumeric(matrixDraft) },
              })
              setDraftOverride(null)
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('matrix.apply')}
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 overflow-auto flex-grow relative scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
            <div className="inline-block min-w-full rounded-xl border overflow-hidden shadow-2xl" style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface-strong)' }}>
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                    <th className={`sticky top-0 left-0 z-20 ${cellPadding} shadow-[2px_2px_4px_rgba(0,0,0,0.2)]`} style={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-border)' }}>
                      <div className={`${headerSize} rounded-full flex items-center justify-center mx-auto`} style={{ backgroundColor: 'rgba(99,102,241,0.06)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                </th>
                  {orderedNodes.map((nodeId) => (
                  <th
                    key={`head-${nodeId}`}
                    className={`sticky top-0 z-10 ${cellPadding} text-center shadow-[0_2px_4px_rgba(0,0,0,0.2)]`}
                    style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}
                  >
                    <span className={`inline-flex items-center justify-center ${headerSize} rounded-full font-bold ${headerFontSize}`} style={{ backgroundColor: 'var(--app-surface-strong)', color: 'var(--app-text)', border: '1px solid var(--app-border)' }}>
                      {nodeId}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedNodes.map((rowNodeId, rowIndex) => (
                <tr key={`row-${rowNodeId}`} className="hover:bg-indigo-500/5 transition-colors group">
                  <th className={`sticky left-0 z-10 ${cellPadding} text-center shadow-[2px_0_4px_rgba(0,0,0,0.2)] transition-colors`} style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
                    <span className={`inline-flex items-center justify-center ${headerSize} rounded-full font-bold ${headerFontSize}`} style={{ backgroundColor: 'var(--app-surface-strong)', color: 'var(--app-text)', border: '1px solid var(--app-border)' }}>
                      {rowNodeId}
                    </span>
                  </th>
                  {orderedNodes.map((columnNodeId, colIndex) => {
                    const value = matrixDraft[rowIndex]?.[colIndex] ?? '0'
                    const isZero = value === '0' || value === ''
                    return (
                      <td key={`${rowNodeId}-${columnNodeId}`} className={`border ${cellPadding} text-center transition-colors`} style={{ borderColor: 'var(--app-border)' }}>
                        <input
                          inputMode="numeric"
                          className={`${inputWidth} ${inputHeight} rounded-md px-1 text-center font-medium transition-all focus:outline-none focus:ring-1 focus:z-10 shadow-inner ${fontSize}`}
                          style={
                            isZero
                              ? { backgroundColor: 'var(--app-surface-strong)', borderColor: 'var(--app-border)', color: 'var(--app-muted)' }
                              : { backgroundColor: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.18)', color: 'var(--app-accent)' }
                          }
                          value={value}
                          onFocus={(e) => {
                            if (e.target.value === '0') {
                              e.target.select()
                            }
                          }}
                          onChange={(event) => {
                            const next = matrixDraft.map((row) => [...row])
                            if (!next[rowIndex]) {
                              next[rowIndex] = []
                            }
                            next[rowIndex][colIndex] = event.currentTarget.value
                            setDraftOverride(next)
                          }}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
