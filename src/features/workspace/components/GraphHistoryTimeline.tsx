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
    <div className="glass-panel p-3 md:p-4">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
        <span className="uppercase tracking-wider text-slate-400">{t('history.title')}</span>
        <span>
          {t('history.step')} {currentIndex + 1}/{total}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className="glass-button px-2 py-1 text-xs"
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={past.length === 0}
          title={t('history.undo')}
        >
          {t('history.undo')}
        </button>
        <button
          type="button"
          className="glass-button px-2 py-1 text-xs"
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={future.length === 0}
          title={t('history.redo')}
        >
          {t('history.redo')}
        </button>

        <input
          className="flex-1 accent-indigo-400"
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

      <div className="mt-2 flex flex-wrap gap-1">
        {markers.map((index) => (
          <button
            key={index}
            type="button"
            className={`h-2 w-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.85)]' : 'bg-slate-600 hover:bg-slate-500'
            }`}
            onClick={() => dispatch({ type: 'JUMP_TO', payload: { index } })}
            title={`${t('history.jump')} ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

