import type { CinemaStep } from '../utils/algorithmCinema'
import type { GraphState, NodeId } from '../../graph/model/types'

interface Props {
  step: CinemaStep | null
  graph: GraphState
  source: NodeId
  target: NodeId
}

const NODE_R = 18
const CANVAS_W = 340
const CANVAS_H = 260

export function ResidualGraphPanel({ step, graph, source, target }: Props) {
  if (!step?.residualEdges) return null

  return (
    <div className="rounded-xl border p-3" style={{
      borderColor: 'var(--app-border)',
      backgroundColor: 'var(--app-surface)',
    }}>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-muted)' }}>
        Graphe résiduel
      </p>
      <svg
        width="100%"
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        style={{ maxHeight: 220 }}
      >
        <defs>
          {/* Flèche pour arêtes forward (bleue) */}
          <marker id="arr-fwd" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#60a5fa"
              stroke-width="1.5" stroke-linecap="round"/>
          </marker>
          {/* Flèche pour arêtes backward (orange) */}
          <marker id="arr-bwd" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#f97316"
              stroke-width="1.5" stroke-linecap="round"/>
          </marker>
        </defs>

        {/* Arêtes résiduelles */}
        {step.residualEdges.map((re, i) => {
          const fromPos = graph.positions[re.from]
          const toPos = graph.positions[re.to]
          if (!fromPos || !toPos) return null

          // Mise à l'échelle des positions du graphe principal → petit canvas
          const scaleX = CANVAS_W / 900
          const scaleY = CANVAS_H / 520
          const x1 = fromPos.x * scaleX
          const y1 = fromPos.y * scaleY
          const x2 = toPos.x * scaleX
          const y2 = toPos.y * scaleY

          const dx = x2 - x1, dy = y2 - y1
          const len = Math.hypot(dx, dy)
          const ux = dx / len, uy = dy / len
          const nx = -uy, ny = ux
          const off = re.isBackward ? -5 : 5

          const sx = x1 + ux * NODE_R * scaleX + nx * off
          const sy = y1 + uy * NODE_R * scaleY + ny * off
          const ex = x2 - ux * (NODE_R * scaleX + 8) + nx * off
          const ey = y2 - uy * (NODE_R * scaleY + 8) + ny * off
          const mx = (sx + ex) / 2 + nx * 10
          const my = (sy + ey) / 2 + ny * 10

          // Arêtes du chemin augmentant en surbrillance
          const isAugmenting = step.augmentingEdgeIds?.includes(re.originalEdgeId)

          const color = re.isBackward ? '#f97316' : '#60a5fa'
          const strokeW = isAugmenting ? 2.5 : 1.5
          const marker = re.isBackward ? 'url(#arr-bwd)' : 'url(#arr-fwd)'

          return (
            <g key={i}>
              <path
                d={`M${sx},${sy} Q${mx},${my} ${ex},${ey}`}
                fill="none"
                stroke={color}
                strokeWidth={strokeW}
                opacity={isAugmenting ? 1 : 0.55}
                markerEnd={marker}
              />
              {/* Capacité résiduelle */}
              <text
                x={(sx + 2 * mx + ex) / 4}
                y={(sy + 2 * my + ey) / 4 - 4}
                textAnchor="middle"
                fontSize="9"
                fill={color}
                opacity={isAugmenting ? 1 : 0.7}
                fontWeight={isAugmenting ? '700' : '400'}
              >
                {re.capacity}
              </text>
            </g>
          )
        })}

        {/* Nœuds */}
        {graph.nodes.map(nodeId => {
          const pos = graph.positions[nodeId]
          if (!pos) return null
          const scaleX = CANVAS_W / 900
          const scaleY = CANVAS_H / 520
          const cx = pos.x * scaleX
          const cy = pos.y * scaleY
          const isSource = nodeId === source
          const isTarget = nodeId === target
          const fill = isSource ? '#1d4ed8' : isTarget ? '#15803d' : '#1e1b4b'
          const stroke = isSource ? '#60a5fa' : isTarget ? '#4ade80' : '#475569'

          return (
            <g key={nodeId}>
              <circle cx={cx} cy={cy} r={NODE_R * 0.7}
                fill={fill} stroke={stroke} strokeWidth={1.5} />
              <text x={cx} y={cy + 1} textAnchor="middle"
                dominantBaseline="middle" fontSize="10"
                fontWeight="600" fill="#e2e8f0">
                {nodeId}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Légende */}
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1 text-xs" style={{ color: '#60a5fa' }}>
          <span style={{ display: 'inline-block', width: 16, height: 2, background: '#60a5fa' }} />
          Forward (capacité libre)
        </span>
        <span className="flex items-center gap-1 text-xs" style={{ color: '#f97316' }}>
          <span style={{ display: 'inline-block', width: 16, height: 2, background: '#f97316' }} />
          Backward (flot annulable)
        </span>
      </div>
      {step.pathHistory && step.pathHistory.length > 0 && (
  <div className="mt-3 border-t pt-2" style={{ borderColor: 'var(--app-border)' }}>
    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--app-muted)' }}>
      Chemins augmentants trouvés
    </p>
    <table className="w-full text-xs">
      <thead>
        <tr style={{ color: 'var(--app-muted)' }}>
          <th className="text-left py-0.5">Chemin</th>
          <th className="text-left py-0.5">Bottleneck</th>
          <th className="text-left py-0.5">Arêtes</th>
        </tr>
      </thead>
      <tbody>
        {step.pathHistory.map(ph => (
          <tr
            key={ph.index}
            style={{
              color: ph.index === step.augmentingPathIndex
                ? '#f59e0b'   // chemin actif = orange
                : 'var(--app-text)',
              fontWeight: ph.index === step.augmentingPathIndex ? 600 : 400,
            }}
          >
            <td className="py-0.5">#{ph.index}</td>
            <td className="py-0.5">+{ph.bottleneck}</td>
            <td className="py-0.5" style={{ fontSize: '11px' }}>
                {(ph.edgeLabels && ph.edgeLabels.length > 0
                    ? ph.edgeLabels
                    : ph.edgeIds.map(eid => {
                        const e = graph.edges.find(x => x.id === eid)
                        return e ? `(${e.from},${e.to})` : eid
                    })
                ).map((label, i) => (
                    <span key={i}>
                    {i > 0 && <span style={{ color: '#94a3b8', margin: '0 3px' }}>→</span>}
                    <span style={{
                        color: label.includes('↩') ? '#f97316' : '#60a5fa',
                        fontWeight: 500,
                    }}>
                        {label}
                    </span>
                    </span>
                ))}
</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
    </div>
  )
}