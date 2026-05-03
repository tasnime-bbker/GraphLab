import type { NodeId } from '../../graph/model/types'
import type { CinemaAlgorithm } from '../utils/algorithmCinema'
import { useI18n } from '../../../shared/context/I18nContext'
import { AlgorithmEducationalCard } from './AlgorithmEducationalCard'

interface AlgorithmCinemaPanelProps {
  nodes: NodeId[]
  algorithm: CinemaAlgorithm
  sourceNode: NodeId | null
  targetNode: NodeId | null
  speed: number
  playing: boolean
  stepCount: number
  currentIndex: number
  narration: string
  currentStep?: CinemaStep | null
  onAlgorithmChange: (value: CinemaAlgorithm) => void
  onSourceChange: (value: NodeId) => void
  onTargetChange: (value: NodeId | null) => void
  onSpeedChange: (value: number) => void
  onRun: () => void
  onPlayPause: () => void
  onStepBack: () => void
  onStepForward: () => void
  onRewind: () => void
  onFastForward: () => void
  onScrub: (index: number) => void
}

const SPEED_OPTIONS = [0.5, 1, 2, 4]
const MST_ALGORITHMS: CinemaAlgorithm[] = ['Prims', 'Kruskals']

/** Derive a human-readable step type badge from a CinemaStep */
function getStepBadge(step: CinemaStep | null | undefined, algorithm: CinemaAlgorithm): {
  label: string
  color: string
  bg: string
} {
  if (!step) return { label: 'Prêt', color: '#64748b', bg: 'rgba(100,116,139,0.12)' }

  if (step.mstNewEdgeId)
    return { label: '✅ Ajouté', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' }
  if (step.rejectedEdgeId)
    return { label: '❌ Rejeté', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
  if (MST_ALGORITHMS.includes(algorithm) && (step.mstEdges?.length ?? 0) > 0 && !step.currentEdgeId)
    return { label: '🏁 Terminé', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' }
  if (step.currentEdgeId)
    return { label: '🔍 Explore', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  if ((step.visited?.length ?? 0) <= 1)
    return { label: '🚀 Init', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' }

  return { label: '↩ Avance', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' }
}

export function AlgorithmCinemaPanel({
  nodes,
  algorithm,
  sourceNode,
  targetNode,
  speed,
  playing,
  stepCount,
  currentIndex,
  narration,
  currentStep,
  onAlgorithmChange,
  onSourceChange,
  onTargetChange,
  onSpeedChange,
  onRun,
  onPlayPause,
  onStepBack,
  onStepForward,
  onRewind,
  onFastForward,
  onScrub,
}: AlgorithmCinemaPanelProps) {
  const { t } = useI18n()
  const requiresTarget = algorithm === 'MaxFlow' || algorithm === 'RechercheChaine'
  const disabled = stepCount === 0
  const isMst = MST_ALGORITHMS.includes(algorithm)
  const badge = getStepBadge(currentStep, algorithm)
  const progress = stepCount > 1 ? (currentIndex / (stepCount - 1)) * 100 : 0
  const mstWeight = currentStep?.mstWeight

  return (
    <div
      className="rounded-2xl border shadow-lg overflow-hidden glass-panel w-full max-w-[420px] mx-auto md:max-w-none md:w-auto"
      style={{ backgroundColor: 'var(--app-surface)' }}
    >
      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div className="h-1.5 w-full relative bg-blue-200/30 dark:bg-slate-400/20 overflow-hidden">
        <div
          className={`h-full transition-all duration-400 ease-out ${!disabled && progress > 0 ? 'progress-bar-shimmer' : ''}`}
          style={{
            width: `${disabled ? 0 : progress}%`,
            background: disabled || progress === 0 ? 'transparent' : 'var(--app-accent)',
            opacity: 0.8
          }}
        />
      </div>

      <div className="p-4 space-y-4">
        {/* ── Top row: controls + config ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Algorithm select */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">{t('cinema.algorithm')}</span>
            <select
              className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface-strong)', color: 'var(--app-text)' }}
              value={algorithm}
              onChange={(e) => onAlgorithmChange(e.currentTarget.value as CinemaAlgorithm)}
            >
              <option value="BFS">BFS</option>
              <option value="DFS">DFS</option>
              <option value="Dijkstra">Dijkstra</option>
              <option value="Prims">Prim&apos;s MST</option>
              <option value="Kruskals">Kruskal&apos;s MST</option>
              <option value="MaxFlow">MaxFlow</option>
              <option value="ConnectedComponents">Components</option>
              <option value="SpanningForest">Spanning Forest</option>
              <option value="StronglyConnectedComponents">SCC</option>
              <option value="Bellman">Bellman</option>
              <option value="BellmanFord">Bellman-Ford</option>
              <option value="WelshPowell">Welsh-Powell</option>
              <option value="EulerienPath">Euler</option>
              <option value="RechercheChaine">Chain Search</option>
              
            </select>
          </div>

          {/* Source node */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">{t('cinema.source')}</span>
            <select
              className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
              style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface-strong)', color: 'var(--app-text)' }}
              value={sourceNode ?? ''}
              onChange={(e) => onSourceChange(Number(e.currentTarget.value))}
              disabled={nodes.length === 0}
            >
              {nodes.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Target node */}
          {requiresTarget && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">{t('cinema.target')}</span>
              <select
                className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface-strong)', color: 'var(--app-text)' }}
                value={targetNode ?? ''}
                onChange={(e) => onTargetChange(Number(e.currentTarget.value))}
                disabled={nodes.length === 0}
              >
                {nodes.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}

          {/* Run button */}
          <button 
            type="button" 
            className="btn-premium !px-5 !py-2.5 text-xs shadow-lg mt-auto flex items-center gap-2 group" 
            onClick={onRun}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('cinema.build')}
          </button>
        </div>

        {/* ── Playback controls + Scrubber ──────────────────────────────── */}
        <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-blue-100/30 dark:bg-slate-300/20 p-1.5 rounded-xl border border-blue-200/20 dark:border-slate-400/10 shadow-inner">
          <button className="btn-icon p-1.5 hover:text-blue-600 transition-colors" onClick={onRewind} disabled={disabled} title="Rewind">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          </button>
          <button className="btn-icon p-1.5 hover:text-blue-600 transition-colors" onClick={onStepBack} disabled={disabled} title="Prev">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm14 0-8.5 6 8.5 6V6z"/></svg>
          </button>
          <button 
            className={`btn-icon p-2 rounded-full transition-all ${playing ? 'bg-blue-600/20 text-blue-700 shadow-sm' : 'hover:bg-slate-300/30'}`} 
            onClick={onPlayPause} 
            disabled={disabled}
          >
            {playing ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button className="btn-icon p-1.5 hover:text-blue-600 transition-colors" onClick={onStepForward} disabled={disabled} title="Next">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="m6 18 8.5-6L6 6v12zm2.5-6L16 6v12z"/></svg>
          </button>
          <button className="btn-icon p-1.5 hover:text-blue-600 transition-colors" onClick={onFastForward} disabled={disabled} title="Fast Forward">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="m4 18 8.5-6L4 6v12zm9 0 8.5-6L13 6v12z"/></svg>
          </button>
        </div>

          <input
            type="range"
            className="flex-1 accent-blue-500"
            min={0}
            max={Math.max(stepCount - 1, 0)}
            value={Math.min(currentIndex, Math.max(stepCount - 1, 0))}
            onChange={(e) => onScrub(Number(e.currentTarget.value))}
            disabled={disabled}
          />

          <div className="flex flex-col items-end min-w-[70px]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Step</span>
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--app-text)' }}>
              {disabled ? 0 : currentIndex + 1} / {stepCount}
            </span>
          </div>
        </div>

        {/* ── Footer: Speed + Status ──────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex rounded-lg overflow-hidden border border-blue-200/40 dark:border-slate-400/30 text-[10px] font-bold shadow-sm">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className={`px-3 py-1 transition-all ${speed === s ? 'bg-blue-600 text-white dark:bg-slate-600 dark:text-slate-100 shadow-inner' : 'bg-blue-100/30 hover:bg-blue-200/50 dark:bg-slate-200/50 dark:hover:bg-slate-300/50'}`}
                style={{
                  color: speed === s ? undefined : 'var(--app-muted)',
                }}
              >
                {s}×
              </button>
            ))}
          </div>

          {!disabled && (
            <div className="flex items-center gap-2">
              {isMst && typeof mstWeight === 'number' && (
                <span className="rounded-full px-2.5 py-1 text-[10px] font-black bg-emerald-500/10 text-emerald-500 uppercase tracking-wider border border-emerald-500/20">
                  Σ = {mstWeight}
                </span>
              )}
              <span 
                className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider badge-pop"
                style={{ color: badge.color, backgroundColor: badge.bg, border: `1px solid ${badge.color}33` }}
              >
                {badge.label}
              </span>
            </div>
          )}
        </div>

        {/* ── Narration Card ────────────────────────────────────────────── */}
        <div 
          className="rounded-xl px-4 py-3 text-sm font-medium leading-relaxed transition-all duration-300 narration-animate" 
          style={{ 
            backgroundColor: 'var(--app-surface-strong)', 
            borderLeft: `4px solid ${disabled ? 'var(--app-border)' : badge.color}`,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <p style={{ color: 'var(--app-text)' }}>
            {narration || t('cinema.narration')}
          </p>
        </div>

        {/* ── Educational Section ─────────────────────────────────────────── */}
        <AlgorithmEducationalCard algorithm={algorithm} />
      </div>
    </div>
  )
}

