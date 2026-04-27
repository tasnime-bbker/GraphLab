import type { NodeId } from '../../graph/model/types'
import type { CinemaAlgorithm } from '../utils/algorithmCinema'

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
  const requiresTarget = algorithm === 'MaxFlow'
  const disabled = stepCount === 0

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3 shadow-inner">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-slate-300">
          Algorithm
          <select
            className="ml-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
            value={algorithm}
            onChange={(event) => onAlgorithmChange(event.currentTarget.value as CinemaAlgorithm)}
          >
            <option value="BFS">BFS</option>
            <option value="DFS">DFS</option>
            <option value="Dijkstra">Dijkstra</option>
            <option value="Prims">Prim&apos;s</option>
            <option value="Kruskals">Kruskal&apos;s</option>
            <option value="MaxFlow">MaxFlow</option>
          </select>
        </label>

        <label className="text-xs text-slate-300">
          Source
          <select
            className="ml-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
            value={sourceNode ?? ''}
            onChange={(event) => onSourceChange(Number(event.currentTarget.value))}
            disabled={nodes.length === 0}
          >
            {nodes.map((nodeId) => (
              <option key={nodeId} value={nodeId}>
                {nodeId}
              </option>
            ))}
          </select>
        </label>

        {requiresTarget && (
          <label className="text-xs text-slate-300">
            Target
            <select
              className="ml-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
              value={targetNode ?? ''}
              onChange={(event) => onTargetChange(Number(event.currentTarget.value))}
              disabled={nodes.length === 0}
            >
              {nodes.map((nodeId) => (
                <option key={nodeId} value={nodeId}>
                  {nodeId}
                </option>
              ))}
            </select>
          </label>
        )}

        <button type="button" className="glass-button px-3 py-1 text-xs" onClick={onRun}>
          Build Steps
        </button>

        <label className="text-xs text-slate-300">
          Speed
          <select
            className="ml-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.currentTarget.value))}
          >
            {SPEED_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}x
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <button type="button" className="glass-button px-2 py-1" onClick={onRewind} disabled={disabled}>
          {'<<'}
        </button>
        <button type="button" className="glass-button px-2 py-1" onClick={onStepBack} disabled={disabled}>
          {'<'}
        </button>
        <button type="button" className="glass-button px-2 py-1" onClick={onPlayPause} disabled={disabled}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="glass-button px-2 py-1" onClick={onStepForward} disabled={disabled}>
          {'>'}
        </button>
        <button type="button" className="glass-button px-2 py-1" onClick={onFastForward} disabled={disabled}>
          {'>>'}
        </button>

        <input
          type="range"
          className="ml-2 flex-1 accent-indigo-400"
          min={0}
          max={Math.max(stepCount - 1, 0)}
          value={Math.min(currentIndex, Math.max(stepCount - 1, 0))}
          onChange={(event) => onScrub(Number(event.currentTarget.value))}
          disabled={disabled}
        />

        <span className="text-slate-400">
          Step {disabled ? 0 : currentIndex + 1}/{stepCount}
        </span>
      </div>

      <p className="mt-2 min-h-5 text-xs text-indigo-200/90">{narration}</p>
    </div>
  )
}

