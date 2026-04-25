import { drag, type D3DragEvent } from 'd3-drag'
import { pointer, select } from 'd3-selection'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  isWeightAllowed,
  parseWeightInput,
  weightPolicyHint,
} from '../../graph/model/weightPolicy'
import { useGraphDispatch, useGraphState } from '../../graph/state/useGraphStore'

const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 520
const NODE_RADIUS = 20

interface EdgeGeometry {
  path: string
  labelX: number
  labelY: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function buildEdgeGeometry(
  from: { x: number; y: number },
  to: { x: number; y: number },
  offset: number,
  directed: boolean,
): EdgeGeometry {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)

  if (length < 1) {
    const loopRadius = 26
    return {
      path: `M ${from.x} ${from.y - NODE_RADIUS} a ${loopRadius} ${loopRadius} 0 1 1 1 0`,
      labelX: from.x,
      labelY: from.y - NODE_RADIUS - loopRadius - 8,
    }
  }

  const ux = dx / length
  const uy = dy / length
  const nx = -uy
  const ny = ux

  const startX = from.x + ux * NODE_RADIUS + nx * offset
  const startY = from.y + uy * NODE_RADIUS + ny * offset
  const endPadding = NODE_RADIUS + (directed ? 14 : 2)
  const endX = to.x - ux * endPadding + nx * offset
  const endY = to.y - uy * endPadding + ny * offset

  const middleX = (startX + endX) / 2
  const middleY = (startY + endY) / 2
  const curveOffset = offset * 1.5
  const controlX = middleX + nx * curveOffset
  const controlY = middleY + ny * curveOffset

  const labelX = (startX + 2 * controlX + endX) / 4
  const labelY = (startY + 2 * controlY + endY) / 4

  return {
    path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
    labelX,
    labelY,
  }
}

export function GraphCanvas() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dispatch = useGraphDispatch()
  const { graph, interaction } = useGraphState()
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)
  const [weightDraft, setWeightDraft] = useState('')
  const [weightError, setWeightError] = useState<string | null>(null)

  function startWeightEdit(edgeId: string, currentWeight: number) {
    setEditingEdgeId(edgeId)
    setWeightDraft(String(currentWeight))
    setWeightError(null)
  }

  function commitWeight(edgeId: string) {
    const parsed = parseWeightInput(weightDraft)

    if (parsed === null) {
      setWeightError('Weight must be a valid number')
      return
    }

    if (!isWeightAllowed(parsed, graph.weightPolicy)) {
      setWeightError(weightPolicyHint(graph.weightPolicy))
      return
    }

    dispatch({ type: 'SET_EDGE_WEIGHT', payload: { edgeId, weight: parsed } })
    setEditingEdgeId(null)
    setWeightDraft('')
    setWeightError(null)
  }

  useEffect(() => {
    if (svgRef.current === null) {
      return
    }

    const selection = select(svgRef.current)
    const behavior = drag<SVGGElement, unknown>().on(
      'drag',
      function onDrag(
        this: SVGGElement,
        event: D3DragEvent<SVGGElement, unknown, unknown>,
      ) {
        const id = Number(this.dataset.nodeId)

        if (!Number.isFinite(id)) {
          return
        }

        dispatch({
          type: 'MOVE_NODE',
          payload: {
            nodeId: id,
            position: {
              x: clamp(event.x, 20, CANVAS_WIDTH - 20),
              y: clamp(event.y, 20, CANVAS_HEIGHT - 20),
            },
          },
        })
      },
    )

    selection.selectAll<SVGGElement, unknown>('g.node-wrapper').call(behavior)

    return () => {
      selection.selectAll<SVGGElement, unknown>('g.node-wrapper').on('.drag', null)
    }
  }, [dispatch, graph.nodes])

  const edgeDraftPosition =
    interaction.edgeDraftFrom !== null ? graph.positions[interaction.edgeDraftFrom] : null

  const reverseEdgePairs = useMemo(() => {
    const pairSet = new Set<string>()

    for (const edge of graph.edges) {
      if (edge.from === edge.to) {
        continue
      }

      const reverseExists = graph.edges.some(
        (candidate) =>
          candidate.id !== edge.id &&
          candidate.from === edge.to &&
          candidate.to === edge.from,
      )

      if (reverseExists) {
        const pairKey = edge.from < edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`
        pairSet.add(pairKey)
      }
    }

    return pairSet
  }, [graph.edges])

  return (
    <section className="flex flex-col h-full rounded-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
      
      <div className="p-4 md:p-6 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 z-10 relative">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Visual Editor
            </h2>
            {interaction.edgeDraftFrom !== null && (
              <button
                type="button"
                className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                onClick={() => dispatch({ type: 'CLEAR_EDGE_DRAFT' })}
              >
                Cancel Draft
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1 text-xs text-slate-400">
            <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Left click empty canvas to add node. Click A then B for edge.</p>
            <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Right click node or double click edge to remove.</p>
            {graph.weighted && (
              <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Click edge weight to edit. {weightPolicyHint(graph.weightPolicy)}</p>
            )}
          </div>
        </div>

        {weightError !== null && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 shadow-[0_0_15px_rgba(225,29,72,0.15)] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {weightError}
          </div>
        )}
      </div>

      <div className="flex-grow relative bg-slate-950/50 overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-crosshair min-h-[520px]"
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={(event) => {
            if (interaction.edgeDraftFrom === null || svgRef.current === null) {
              return
            }

            const [x, y] = pointer(event, svgRef.current)
            setCursorPosition({ x, y })
          }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="rgba(99, 102, 241, 0.15)" />
            </pattern>
            <marker
              id="arrow"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
            >
              <path d="M0,2 L10,6 L0,10 L3,6 z" fill="#818cf8" />
            </marker>
            <marker
              id="arrow-selected"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
            >
              <path d="M0,2 L10,6 L0,10 L3,6 z" fill="#c084fc" />
            </marker>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id="glow-selected">
              <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            fill="url(#grid)"
            onClick={(event) => {
              if (event.button !== 0 || svgRef.current === null) {
                return
              }

              // Need to get coordinates mapping to the viewBox
              const pt = svgRef.current.createSVGPoint()
              pt.x = event.clientX
              pt.y = event.clientY
              const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse())

              dispatch({
                type: 'ADD_NODE',
                payload: {
                  position: {
                    x: clamp(svgP.x, 20, CANVAS_WIDTH - 20),
                    y: clamp(svgP.y, 20, CANVAS_HEIGHT - 20),
                  },
                },
              })
              setEditingEdgeId(null)
              setWeightError(null)
            }}
          />

          {graph.edges.map((edge) => {
            const from = graph.positions[edge.from]
            const to = graph.positions[edge.to]

            if (!from || !to) {
              return null
            }

            const isSelected = interaction.selectedEdgeId === edge.id
            const pairKey =
              edge.from < edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`
            const hasReverse = graph.directed && reverseEdgePairs.has(pairKey)
            const signedOffset =
              hasReverse && edge.from !== edge.to ? (edge.from < edge.to ? 16 : -16) : 0
            const geometry = buildEdgeGeometry(from, to, signedOffset, graph.directed)

            return (
              <g key={edge.id} className="transition-opacity hover:opacity-80">
                {/* Hit area for easier clicking */}
                <path
                  d={geometry.path}
                  stroke="transparent"
                  strokeWidth={15}
                  fill="none"
                  className="cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation()
                    dispatch({ type: 'SET_SELECTED_EDGE', payload: { edgeId: edge.id } })
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation()
                    dispatch({ type: 'DELETE_EDGE', payload: { edgeId: edge.id } })
                  }}
                />
                <path
                  d={geometry.path}
                  className={`pointer-events-none transition-all duration-300 ${isSelected ? 'stroke-purple-400' : 'stroke-indigo-400/70'}`}
                  strokeWidth={isSelected ? 3 : 2}
                  fill="none"
                  strokeLinecap="round"
                  filter={isSelected ? "url(#glow-selected)" : ""}
                  markerEnd={graph.directed ? (isSelected ? 'url(#arrow-selected)' : 'url(#arrow)') : undefined}
                />
                
                {graph.weighted && (
                  <g className="cursor-pointer" onClick={(event) => {
                    event.stopPropagation()
                    startWeightEdit(edge.id, edge.weight)
                  }}>
                    <circle
                      cx={geometry.labelX}
                      cy={geometry.labelY}
                      r={14}
                      fill="#1e1b4b"
                      stroke={isSelected ? "#c084fc" : "#6366f1"}
                      strokeWidth={1.5}
                      className="transition-colors duration-300"
                    />
                    {editingEdgeId === edge.id ? (
                      <foreignObject
                        x={geometry.labelX - 28}
                        y={geometry.labelY - 14}
                        width={56}
                        height={28}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          autoFocus
                          value={weightDraft}
                          className="h-7 w-14 rounded bg-slate-900 border border-purple-500 px-1 text-center text-xs font-semibold text-white outline-none focus:ring-1 focus:ring-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                          onChange={(event) => {
                            setWeightDraft(event.currentTarget.value)
                            setWeightError(null)
                          }}
                          onBlur={() => commitWeight(edge.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              commitWeight(edge.id)
                            }
                            if (event.key === 'Escape') {
                              setEditingEdgeId(null)
                              setWeightError(null)
                            }
                          }}
                        />
                      </foreignObject>
                    ) : (
                      <text
                        x={geometry.labelX}
                        y={geometry.labelY + 4}
                        textAnchor="middle"
                        className="pointer-events-none fill-white text-[12px] font-bold"
                      >
                        {edge.weight}
                      </text>
                    )}
                  </g>
                )}
              </g>
            )
          })}

          {edgeDraftPosition !== null && cursorPosition !== null && (
            <line
              x1={edgeDraftPosition.x}
              y1={edgeDraftPosition.y}
              x2={cursorPosition.x}
              y2={cursorPosition.y}
              className="stroke-indigo-400"
              strokeWidth={2}
              strokeDasharray="6 4"
              filter="url(#glow)"
            />
          )}

          {graph.nodes.map((nodeId) => {
            const position = graph.positions[nodeId]
            if (!position) {
              return null
            }

            const isSelected = interaction.selectedNodeId === nodeId
            const isDraftStart = interaction.edgeDraftFrom === nodeId

            return (
              <g
                key={nodeId}
                transform={`translate(${position.x} ${position.y})`}
                className="node-wrapper group/node"
                data-node-id={nodeId}
                onContextMenu={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  dispatch({ type: 'DELETE_NODE', payload: { nodeId } })
                  setEditingEdgeId(null)
                }}
              >
                <circle
                  r={NODE_RADIUS}
                  className={`cursor-pointer transition-all duration-300 group-hover/node:scale-110 ${
                    isSelected || isDraftStart
                      ? 'fill-indigo-900 stroke-purple-400'
                      : 'fill-slate-900 stroke-indigo-500 hover:stroke-indigo-400'
                  }`}
                  strokeWidth={isSelected || isDraftStart ? 3 : 2}
                  filter={isSelected || isDraftStart ? "url(#glow-selected)" : "url(#glow)"}
                  onClick={(event) => {
                    event.stopPropagation()

                    if (interaction.edgeDraftFrom === null) {
                      dispatch({ type: 'START_EDGE_DRAFT', payload: { from: nodeId } })
                      dispatch({ type: 'SET_SELECTED_NODE', payload: { nodeId } })
                      setEditingEdgeId(null)
                      return
                    }

                    if (interaction.edgeDraftFrom === nodeId) {
                      dispatch({ type: 'CLEAR_EDGE_DRAFT' })
                      return
                    }

                    dispatch({
                      type: 'ADD_EDGE',
                      payload: {
                        from: interaction.edgeDraftFrom,
                        to: nodeId,
                      },
                    })
                  }}
                />
                <text
                  className="pointer-events-none fill-slate-200 text-[13px] font-bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  dy="1"
                >
                  {nodeId}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
