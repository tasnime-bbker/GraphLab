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
  const endPadding = NODE_RADIUS + (directed ? 12 : 2)
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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Visual Editor</h2>
        {interaction.edgeDraftFrom !== null && (
          <button
            type="button"
            className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
            onClick={() => dispatch({ type: 'CLEAR_EDGE_DRAFT' })}
          >
            Cancel Edge Draft
          </button>
        )}
      </div>
      <p className="text-sm text-slate-600">
        Left click on empty canvas to add nodes.
        Right click on node to remove it with its corresponding edges.
      </p>
      <p className="text-sm text-slate-600">
        Click node A then node B to create an edge.
      </p>
      {graph.weighted && (
        <p className="mt-1 text-xs text-slate-500">
          Click an edge weight to edit. {weightPolicyHint(graph.weightPolicy)}
        </p>
      )}
      {weightError !== null && (
        <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
          {weightError}
        </p>
      )}

      <svg
        ref={svgRef}
        className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50"
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        onMouseMove={(event) => {
          if (interaction.edgeDraftFrom === null || svgRef.current === null) {
            return
          }

          const [x, y] = pointer(event, svgRef.current)
          setCursorPosition({ x, y })
        }}
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
                <path d="M0,0 L8,4 L0,8 z" fill="#334155" />
          </marker>
        </defs>

                <rect
                  x={0}
                  y={0}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  fill="#f8fafc"
                  onClick={(event) => {
                    if (event.button !== 0 || svgRef.current === null) {
                      return
                    }

                    const [x, y] = pointer(event, svgRef.current)
                    dispatch({
                      type: 'ADD_NODE',
                      payload: {
                        position: {
                          x: clamp(x, 20, CANVAS_WIDTH - 20),
                          y: clamp(y, 20, CANVAS_HEIGHT - 20),
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
            <g key={edge.id}>
              <path
                d={geometry.path}
                className={isSelected ? 'cursor-pointer stroke-indigo-600' : 'cursor-pointer stroke-slate-700'}
                strokeWidth={isSelected ? 3 : 2.5}
                fill="none"
                strokeLinecap="round"
                markerEnd={graph.directed ? 'url(#arrow)' : undefined}
                onClick={(event) => {
                  event.stopPropagation()
                  dispatch({ type: 'SET_SELECTED_EDGE', payload: { edgeId: edge.id } })
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  dispatch({ type: 'DELETE_EDGE', payload: { edgeId: edge.id } })
                }}
              />
              {graph.weighted && (
                <>
                  <circle
                    cx={geometry.labelX}
                    cy={geometry.labelY - 2}
                    r={14}
                    fill="#ffffff"
                    stroke="#cbd5e1"
                    strokeWidth={1.5}
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
                        className="h-7 w-14 rounded border border-indigo-400 bg-white px-1 text-center text-xs font-semibold text-slate-900 outline-none"
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
                      y={geometry.labelY + 2}
                      textAnchor="middle"
                      className="cursor-pointer fill-slate-900 text-[11px] font-bold"
                      style={{ paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: 3 }}
                      onClick={(event) => {
                        event.stopPropagation()
                        startWeightEdit(edge.id, edge.weight)
                      }}
                    >
                      {edge.weight}
                    </text>
                  )}
                </>
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
            className="stroke-indigo-300"
            strokeWidth={2}
            strokeDasharray="5 4"
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
              className="node-wrapper"
              data-node-id={nodeId}
              onContextMenu={(event) => {
                event.preventDefault()
                event.stopPropagation()
                dispatch({ type: 'DELETE_NODE', payload: { nodeId } })
                setEditingEdgeId(null)
              }}
            >
              <circle
                r={20}
                className={
                  isSelected || isDraftStart
                    ? 'cursor-pointer fill-indigo-600 stroke-indigo-900'
                    : 'cursor-pointer fill-indigo-500 stroke-indigo-800'
                }
                strokeWidth={isSelected || isDraftStart ? 3 : 2.5}
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
                className="pointer-events-none fill-white text-[12px] font-bold"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {nodeId}
              </text>
            </g>
          )
        })}
      </svg>
    </section>
  )
}



