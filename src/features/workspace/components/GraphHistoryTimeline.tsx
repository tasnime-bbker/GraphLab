import { useMemo } from 'react'
import { useGraphDispatch, useGraphHistory } from '../../graph/state/useGraphStore'
import { useI18n } from '../../../shared/context/I18nContext'

export function GraphHistoryTimeline() {
  const dispatch = useGraphDispatch()
  const { past, future } = useGraphHistory()
  const { t } = useI18n()

  const total = past.length + 1 + future.length
  const currentIndex = past.length

  const markers = useMemo(() => {
    return Array.from({ length: total }, (_, index) => index)
  }, [total])

  if (total <= 1) {
    return null
  }

  return (
    <div className="glass-panel p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          <span className="uppercase tracking-[0.15em] text-[10px] font-black text-slate-400 dark:text-blue-400/70">
            {t('history.title')}
          </span>
        </div>
        <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            {currentIndex + 1} <span className="opacity-50 mx-0.5">/</span> {total}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="btn-premium !p-1.5"
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={past.length === 0}
            title={t('history.undo')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            className="btn-premium !p-1.5"
            onClick={() => dispatch({ type: 'REDO' })}
            disabled={future.length === 0}
            title={t('history.redo')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex-1 w-full flex flex-col gap-3">
          <div className="relative group">
            <input
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
              type="range"
              min={0}
              max={total - 1}
              value={currentIndex}
              onChange={(event) => {
                dispatch({
                  type: 'JUMP_TO',
                  payload: { index: Number(event.currentTarget.value) },
                })
              }}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {markers.map((index) => (
              <button
                key={index}
                type="button"
                className={`group relative h-2.5 transition-all duration-300 rounded-full ${
                  index === currentIndex 
                    ? 'w-6 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]' 
                    : index < currentIndex
                    ? 'w-2.5 bg-blue-500/40 hover:bg-blue-500/60'
                    : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                }`}
                onClick={() => dispatch({ type: 'JUMP_TO', payload: { index } })}
                title={`${t('history.jump')} ${index + 1}`}
              >
                {index === currentIndex && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-bold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {t('history.current')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

