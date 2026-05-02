import { drag, type D3DragEvent } from 'd3-drag'
import { forceCenter, forceLink, forceManyBody, forceSimulation } from 'd3-force'
import { zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom'
import { pointer, select } from 'd3-selection'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import {
  isWeightAllowed,
  parseWeightInput,
  weightPolicyHint,
} from '../../graph/model/weightPolicy'
import {
  degreeOfNode,
  detectCycle,
  diffGraphStates,
  findComponents,
  neighborsOfNode,
  shortestPathBetweenNodes,
  getVisualEdges,
} from '../../graph/state/selectors'
import { useGraphDispatch, useGraphHistory, useGraphState } from '../../graph/state/useGraphStore'
import { EdgeFlowParticles } from './EdgeFlowParticles'
import { ParticleBurst } from './ParticleBurst'
import { EdgePulse } from './EdgePulse'
import { GraphMetrics } from './GraphMetrics'
import { SnapGuides } from './SnapGuides'
import { AlgorithmCinemaPanel } from './AlgorithmCinemaPanel'
import { calculateSnap } from '../hooks/useMagneticSnap'
import { CanvasHelp } from '../../workspace/components/CanvasHelp'
import { CanvasToolbar } from './CanvasToolbar'
import { useShortcut } from '../../../shared/hooks/useShortcut'
import { useI18n } from '../../../shared/context/I18nContext'
import { useAppTheme } from '../../../shared/context/AppThemeContext'
import { svgToPngBlob } from '../../workspace/utils/exportFormats'
import {
  buildCinemaProgram,
  speedToInterval,
  type CinemaAlgorithm,
  type CinemaProgram,
  type CinemaStep,
} from '../utils/algorithmCinema'
import { ENABLE_CLUSTER_ZONES } from '../config/featureFlags'
import './GraphCanvas.css'
import {Button} from "@mantine/core";

const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 520
const NODE_RADIUS = 20
const MINIMAP_WIDTH = 120
const MINIMAP_HEIGHT = 80

interface EdgeGeometry {
  path: string
  labelX: number
  labelY: number
  normalX: number
  normalY: number
}

interface QueryHighlights {
  nodes: number[]
  edges: string[]
  color: string
  message: string
  components: number[][]
}

interface HistoryDiffOverlay {
  addedNodes: number[]
  removedNodes: number[]
  addedEdges: string[]
  removedEdges: string[]
}



function applyCollisions(
  targetX: number,
  targetY: number,
  ignoreId: number | null,
  nodes: number[],
  positions: Record<number, { x: number; y: number }>,
  minDist = 55
): { x: number; y: number } {
  let cx = targetX
  let cy = targetY

  for (let step = 0; step < 3; step++) {
    for (const id of nodes) {
      if (id === ignoreId) continue
      const pos = positions[id]
      if (!pos) continue

      const dx = cx - pos.x
      const dy = cy - pos.y
      const dist = Math.hypot(dx, dy)

      if (dist < minDist && dist > 0.001) {
        const pushDist = minDist - dist
        const ux = dx / dist
        const uy = dy / dist
        cx += ux * pushDist
        cy += uy * pushDist
      } else if (dist <= 0.001) {
        cx += minDist
      }
    }
  }

  return { x: cx, y: cy }
}



function buildEdgeGeometry(
  from: { x: number; y: number },
  to: { x: number; y: number },
  offset: number,
  directed: boolean,
  bundleControl?: { x: number; y: number; spread: number },
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
      normalX: 0,
      normalY: -1,
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
  
  // Control point for the quadratic curve
  const controlX = (bundleControl?.x ?? middleX) + nx * (curveOffset + (bundleControl?.spread ?? 0))
  const controlY = (bundleControl?.y ?? middleY) + ny * (curveOffset + (bundleControl?.spread ?? 0))

  // Midpoint of quadratic Bézier curve: B(0.5) = (startX + 2*controlX + endX) / 4
  const labelX = (startX + 2 * controlX + endX) / 4
  const labelY = (startY + 2 * controlY + endY) / 4

  return {
    path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
    labelX,
    labelY,
    normalX: nx,
    normalY: ny,
  }
}

function EdgeItem({
  edge,
  geometry,
  isSelected,
  directed,
  weighted,
  editingEdgeId,
  weightDraft,
  startWeightEdit,
  setWeightDraft,
  setWeightError,
  commitWeight,
  setEditingEdgeId,
  dispatch,
  colorScheme
}: any) {
  const pathRef = useRef<SVGPathElement>(null)

  return (
    <g className="transition-opacity hover:opacity-80">
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
        ref={pathRef}
        d={geometry.path}
        className={`edge-path pointer-events-none transition-all duration-300 ${isSelected ? 'selected-glow' : ''}`}
        stroke={isSelected ? '#38bdf8' : 'rgba(14, 165, 233, 0.4)'}
        strokeWidth={isSelected ? 3.5 : 2}
        fill="none"
        strokeLinecap="round"
        markerEnd={directed ? (isSelected ? 'url(#arrow-selected)' : 'url(#arrow)') : undefined}
      />
      
      <EdgeFlowParticles 
        pathRef={pathRef} 
        speed={directed ? 1.2 : 0.8} 
        isActive={true} 
        color={colorScheme === 'dark' ? '#00d4ff' : '#0e7490'} 
      />
      {!directed && (
        <EdgeFlowParticles 
          pathRef={pathRef} 
          speed={0.8} 
          isActive={true} 
          reverse={true} 
          color={colorScheme === 'dark' ? '#00d4ff' : '#0e7490'} 
        />
      )}
      <EdgePulse 
        d={geometry.path} 
        color={isSelected 
          ? (colorScheme === 'dark' ? '#38bdf8' : '#0369a1') 
          : (colorScheme === 'dark' ? '#0ea5e9' : '#0284c7')} 
      />
      
      {weighted && (
        <g className="cursor-pointer" onClick={(event) => {
          event.stopPropagation()
          startWeightEdit(edge.id, edge.weight)
        }}>
          {/* Rectangular weight label (Task: Graph Weights Fixes) */}
          <rect
            x={geometry.labelX - 12}
            y={geometry.labelY - 10}
            width={24}
            height={20}
            rx={4}
            fill="#0ea5e9"
            stroke={isSelected ? "#38bdf8" : "rgba(255,255,255,0.1)"}
            strokeWidth={1.5}
            className="transition-all duration-300"
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
                className="h-7 w-14 rounded bg-slate-900 border border-blue-500 px-1 text-center text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-400 shadow-[0_0_10px_rgba(14,165,233,0.4)]"
                style={{color : 'var(--app-text)'}}
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
              className="pointer-events-none font-mono text-[11px] font-bold"
              style={{ fill: '#ffffff' }}
            >
              {edge.weight}
            </text>
          )}
        </g>
      )}
    </g>
  )
}

export function GraphCanvas() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dispatch = useGraphDispatch()
  const history = useGraphHistory()
  const { graph, interaction } = useGraphState()
  const { t } = useI18n()
  const { colorScheme } = useAppTheme()
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)
  const [weightDraft, setWeightDraft] = useState('')
  const [weightError, setWeightError] = useState<string | null>(null)
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([])
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 })
  const [flashingEdgeIds, setFlashingEdgeIds] = useState<string[]>([])
  const [queryInput, setQueryInput] = useState('')
  const [queryHighlights, setQueryHighlights] = useState<QueryHighlights | null>(null)
  const [cinemaAlgorithm, setCinemaAlgorithm] = useState<CinemaAlgorithm>('BFS')
  const [cinemaSourceNode, setCinemaSourceNode] = useState<number | null>(graph.nodes[0] ?? null)
  const [cinemaTargetNode, setCinemaTargetNode] = useState<number | null>(graph.nodes[1] ?? graph.nodes[0] ?? null)
  const [cinemaProgram, setCinemaProgram] = useState<CinemaProgram | null>(null)
  const [cinemaStepIndex, setCinemaStepIndex] = useState(0)
  const [cinemaPlaying, setCinemaPlaying] = useState(false)
  const [cinemaSpeed, setCinemaSpeed] = useState(1)
  const [autoLayoutRunning, setAutoLayoutRunning] = useState(false)
  const [edgeDraftDirected, setEdgeDraftDirected] = useState(graph.directed)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const onStatus = (e: any) => setIsCommandPaletteOpen(e.detail.open)
    window.addEventListener('graph:command-palette-status', onStatus)
    return () => window.removeEventListener('graph:command-palette-status', onStatus)
  }, [])

  useEffect(() => {
    setEdgeDraftDirected(graph.directed)
  }, [graph.directed])

  const cycleFlashTimeoutRef = useRef<number | null>(null)
  const queryTimeoutRef = useRef<number | null>(null)
  const playbackIntervalRef = useRef<number | null>(null)
  const previousEdgesRef = useRef(graph.edges)
  const simulationRef = useRef<ReturnType<typeof forceSimulation<{ id: number; x: number; y: number }>> | null>(null)
  const zoomBehaviorRef = useRef<ReturnType<typeof zoom<SVGSVGElement, unknown>> | null>(null)
  const zoomSelectionRef = useRef<ReturnType<typeof select<SVGSVGElement, unknown>> | null>(null)

  const positionsRef = useRef(graph.positions)
  useEffect(() => {
    positionsRef.current = graph.positions
  }, [graph.positions])

  useEffect(() => {
    if (graph.nodes.length === 0) {
      setCinemaSourceNode(null)
      setCinemaTargetNode(null)
      return
    }

    if (cinemaSourceNode === null || !graph.nodes.includes(cinemaSourceNode)) {
      setCinemaSourceNode(graph.nodes[0])
    }

    if (
      cinemaTargetNode === null ||
      !graph.nodes.includes(cinemaTargetNode) ||
      (graph.nodes.length > 1 && cinemaTargetNode === cinemaSourceNode)
    ) {
      const fallback = graph.nodes.find((nodeId) => nodeId !== (cinemaSourceNode ?? graph.nodes[0]))
      setCinemaTargetNode(fallback ?? graph.nodes[0])
    }
  }, [cinemaSourceNode, cinemaTargetNode, graph.nodes])

  useEffect(() => {
    if (!cinemaProgram || !cinemaPlaying) {
      if (playbackIntervalRef.current !== null) {
        window.clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
      return
    }

    playbackIntervalRef.current = window.setInterval(() => {
      setCinemaStepIndex((index) => {
        const finalIndex = cinemaProgram.steps.length - 1
        if (index >= finalIndex) {
          setCinemaPlaying(false)
          return finalIndex
        }
        return index + 1
      })
    }, speedToInterval(cinemaSpeed))

    return () => {
      if (playbackIntervalRef.current !== null) {
        window.clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }
  }, [cinemaPlaying, cinemaProgram, cinemaSpeed])

  useEffect(() => {
    if (cinemaProgram === null) {
      return
    }

    const nextSignature = buildCinemaProgram(
      graph,
      cinemaProgram.algorithm,
      cinemaProgram.source,
      cinemaProgram.target,
    ).graphSignature

    if (nextSignature !== cinemaProgram.graphSignature) {
      setCinemaProgram(null)
      setCinemaPlaying(false)
      setCinemaStepIndex(0)
    }
  }, [cinemaProgram, graph])

  useEffect(() => {
    return () => {
      if (cycleFlashTimeoutRef.current !== null) {
        window.clearTimeout(cycleFlashTimeoutRef.current)
      }
      if (queryTimeoutRef.current !== null) {
        window.clearTimeout(queryTimeoutRef.current)
      }
      if (playbackIntervalRef.current !== null) {
        window.clearInterval(playbackIntervalRef.current)
      }
      simulationRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    const onAutoLayout = () => runAutoLayout()
    const onRunCinema = (event: Event) => {
      const custom = event as CustomEvent<{
        algorithm: CinemaAlgorithm
        source: number
        target?: number
      }>
      const detail = custom.detail
      if (!detail) {
        return
      }
      setCinemaAlgorithm(detail.algorithm)
      setCinemaSourceNode(detail.source)
      if (typeof detail.target === 'number') {
        setCinemaTargetNode(detail.target)
      }
      const program = buildCinemaProgram(graph, detail.algorithm, detail.source, detail.target)
      setCinemaProgram(program)
      setCinemaStepIndex(0)
      setCinemaPlaying(true)
    }

    window.addEventListener('graph:auto-layout', onAutoLayout)
    window.addEventListener('graph:run-cinema', onRunCinema)

    return () => {
      window.removeEventListener('graph:auto-layout', onAutoLayout)
      window.removeEventListener('graph:run-cinema', onRunCinema)
    }
  }, [graph])

  useShortcut('Escape', () => {
    if (interaction.edgeDraftFrom !== null) {
      dispatch({ type: 'CLEAR_EDGE_DRAFT' })
    }
    if (editingEdgeId !== null) {
      setEditingEdgeId(null)
      setWeightError(null)
    }
  })

  const handleDeleteShortcut = () => {
    if (interaction.selectedNodeId !== null) {
      dispatch({ type: 'DELETE_NODE', payload: { nodeId: interaction.selectedNodeId } })
    } else if (interaction.selectedEdgeId !== null) {
      dispatch({ type: 'DELETE_EDGE', payload: { edgeId: interaction.selectedEdgeId } })
    }
  }

  useShortcut('Delete', handleDeleteShortcut)
  useShortcut('Backspace', handleDeleteShortcut)

  useShortcut('N', () => {
    const viewportX = CANVAS_WIDTH / 2
    const viewportY = CANVAS_HEIGHT / 2
    let worldX = (viewportX - transform.x) / transform.k
    let worldY = (viewportY - transform.y) / transform.k

    // Apply collisions so N doesn't stack nodes
    const collided = applyCollisions(worldX, worldY, null, graph.nodes, positionsRef.current, 55)
    
    dispatch({ type: 'ADD_NODE', payload: { position: { x: collided.x, y: collided.y } } })
  })

  useShortcut('D', () => {
    dispatch({ type: 'SET_DIRECTED', payload: { directed: !graph.directed } })
  })

  useShortcut('W', () => {
    dispatch({ type: 'SET_WEIGHTED', payload: { weighted: !graph.weighted } })
  })

  useShortcut('Ctrl+Z', () => {
    dispatch({ type: 'UNDO' })
  })

  useShortcut('Ctrl+Y', () => {
    dispatch({ type: 'REDO' })
  })

  useEffect(() => {
    const previousEdges = previousEdgesRef.current
    const previousIds = new Set(previousEdges.map((edge) => edge.id))
    const addedEdges = graph.edges.filter((edge) => !previousIds.has(edge.id))

    if (addedEdges.length > 0) {
      const previousOnly = graph.edges.filter((edge) => !addedEdges.some((added) => added.id === edge.id))

      for (const added of addedEdges) {
        const path = detectCycle(previousOnly, added.from, added.to, graph.directed)
        if (path !== null) {
          setFlashingEdgeIds([...path, added.id])
          if (cycleFlashTimeoutRef.current !== null) {
            window.clearTimeout(cycleFlashTimeoutRef.current)
          }
          cycleFlashTimeoutRef.current = window.setTimeout(() => {
            setFlashingEdgeIds([])
          }, 1000)
          break
        }
      }
    }

    previousEdgesRef.current = graph.edges
  }, [graph.directed, graph.edges])

  function runQueryCommand(rawInput: string) {
    const input = rawInput.trim()
    if (input.length === 0) {
      setQueryHighlights(null)
      return
    }

    const match = /^(path|neighbors|degree|components)\s*(.*)$/i.exec(input)
    if (match === null) {
      setQueryHighlights({
        nodes: [],
        edges: [],
        color: '#f87171',
        message: 'Unknown command. Use: path, neighbors, degree, components.',
        components: [],
      })
      return
    }

    const command = match[1].toLowerCase()
    const args = match[2].trim().split(/\s+/).filter((token) => token.length > 0)

    if (command === 'components') {
      const components = findComponents(graph)
      setQueryHighlights({
        nodes: [],
        edges: [],
        color: '#22d3ee',
        message: `Found ${components.length} connected component(s).`,
        components,
      })
    } else if (command === 'neighbors') {
      const nodeId = Number(args[0])
      const neighbors = neighborsOfNode(graph, nodeId)
      const edges = graph.edges
        .filter((edge) => edge.from === nodeId || edge.to === nodeId)
        .map((edge) => edge.id)
      setQueryHighlights({
        nodes: [nodeId, ...neighbors],
        edges,
        color: '#34d399',
        message: `Neighbors(${nodeId}) = ${neighbors.join(', ') || 'none'}.`,
        components: [],
      })
    } else if (command === 'degree') {
      const nodeId = Number(args[0])
      const degree = degreeOfNode(graph, nodeId)
      setQueryHighlights({
        nodes: [nodeId],
        edges: graph.edges
          .filter((edge) => edge.from === nodeId || edge.to === nodeId)
          .map((edge) => edge.id),
        color: '#fbbf24',
        message: `Degree(${nodeId}) = ${degree}.`,
        components: [],
      })
    } else if (command === 'path') {
      const source = Number(args[0])
      const target = Number(args[1])
      const path = shortestPathBetweenNodes(graph, source, target)
      if (path === null) {
        setQueryHighlights({
          nodes: [source, target],
          edges: [],
          color: '#f87171',
          message: `No path from ${source} to ${target}.`,
          components: [],
        })
      } else {
        setQueryHighlights({
          nodes: path.nodeIds,
          edges: path.edgeIds,
          color: '#4ade80',
          message: `Shortest path ${source} -> ${target} (distance ${path.distance}).`,
          components: [],
        })
      }
    }

    if (queryTimeoutRef.current !== null) {
      window.clearTimeout(queryTimeoutRef.current)
    }
    queryTimeoutRef.current = window.setTimeout(() => {
      setQueryHighlights(null)
    }, 5000)
  }

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

  function runCinema() {
    if (cinemaSourceNode === null) {
      return
    }

    const program = buildCinemaProgram(
      graph,
      cinemaAlgorithm,
      cinemaSourceNode,
      cinemaTargetNode ?? undefined,
    )

    setCinemaProgram(program)
    setCinemaStepIndex(0)
    setCinemaPlaying(false)
  }

  function scrubCinema(index: number) {
    if (!cinemaProgram) {
      return
    }
    const bounded = Math.max(0, Math.min(index, cinemaProgram.steps.length - 1))
    setCinemaStepIndex(bounded)
    setCinemaPlaying(false)
  }

  function stepCinema(delta: number) {
    if (!cinemaProgram) {
      return
    }
    scrubCinema(cinemaStepIndex + delta)
  }

  function applyZoomTransform(next: { x: number; y: number; k: number }) {
    const zoomBehavior = zoomBehaviorRef.current
    const zoomSelection = zoomSelectionRef.current
    if (!zoomBehavior || !zoomSelection) {
      setTransform(next)
      return
    }
    zoomSelection.call(zoomBehavior.transform, zoomIdentity.translate(next.x, next.y).scale(next.k))
  }

  function runAutoLayout() {
    if (graph.nodes.length < 2) {
      return
    }

    simulationRef.current?.stop()

    const simNodes = graph.nodes.map((nodeId) => {
      const position = graph.positions[nodeId]
      return {
        id: nodeId,
        x: position?.x ?? CANVAS_WIDTH / 2,
        y: position?.y ?? CANVAS_HEIGHT / 2,
      }
    })

    const simulation = forceSimulation(simNodes)
      .force('charge', forceManyBody().strength(-450)) // Stronger repulsion for clearer graphs
      .force('center', forceCenter(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2))
      .force(
        'link',
        forceLink(
          graph.edges.map((edge) => ({ source: edge.from, target: edge.to })),
        )
          .id((node) => (node as { id: number }).id)
          .distance(150) // Increased distance
          .strength(0.2),
      )
      .alpha(1)
      .alphaDecay(0.035)

    simulationRef.current = simulation
    setAutoLayoutRunning(true)

    simulation.on('tick', () => {
      const positions: Record<number, { x: number; y: number }> = {}
      for (const node of simNodes) {
        const clampedX = Math.min(CANVAS_WIDTH - NODE_RADIUS, Math.max(NODE_RADIUS, node.x ?? 0))
        const clampedY = Math.min(CANVAS_HEIGHT - NODE_RADIUS, Math.max(NODE_RADIUS, node.y ?? 0))
        positions[node.id] = {
          x: Math.round(clampedX),
          y: Math.round(clampedY),
        }
      }
      dispatch({ type: 'SET_NODE_POSITIONS', payload: { positions } })
    })

    simulation.on('end', () => {
      simulationRef.current = null
      setAutoLayoutRunning(false)
    })
  }

  useEffect(() => {
    if (svgRef.current === null) {
      return
    }

    const selection = select(svgRef.current)
    const behavior = drag<SVGGElement, unknown>()
      .filter((event) => event.button === 0)
      .on('start', () => {
        simulationRef.current?.stop()
        simulationRef.current = null
        setAutoLayoutRunning(false)
      })
      .on('drag', function onDrag(
        this: SVGGElement,
        event: D3DragEvent<SVGGElement, unknown, unknown>,
      ) {
        const id = Number(this.dataset.nodeId)

        if (!Number.isFinite(id)) {
          return
        }

        const rawX = event.x
        const rawY = event.y

        // Apply collisions during drag
        const collided = applyCollisions(rawX, rawY, id, graph.nodes, positionsRef.current, 50)

        const { snapX, snapY, guideX, guideY } = calculateSnap(
          id,
          collided.x,
          collided.y,
          graph.nodes,
          positionsRef.current,
          12 // snap threshold
        )

        // Ensure snap didn't drag it back into a collision
        let finalX = snapX
        let finalY = snapY
        
        setGuides({ x: guideX, y: guideY })

        dispatch({
          type: 'MOVE_NODE',
          payload: {
            nodeId: id,
            position: { x: finalX, y: finalY },
          },
        })
      })
      .on('end', () => {
        setGuides({ x: null, y: null })
      })

    selection.selectAll<SVGGElement, unknown>('g.node-wrapper').call(behavior)

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .filter((event) => event.button === 0 || event.type === 'wheel')
      .on('zoom', (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setTransform(e.transform)
      })

    zoomBehaviorRef.current = zoomBehavior
    zoomSelectionRef.current = selection
    selection.call(zoomBehavior).on('dblclick.zoom', null)

    return () => {
      selection.selectAll<SVGGElement, unknown>('g.node-wrapper').on('.drag', null)
      selection.on('.zoom', null)
      zoomBehaviorRef.current = null
      zoomSelectionRef.current = null
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

  const currentCinemaStep: CinemaStep | null =
    cinemaProgram !== null && cinemaProgram.steps.length > 0
      ? cinemaProgram.steps[Math.max(0, Math.min(cinemaStepIndex, cinemaProgram.steps.length - 1))]
      : null

  const visualEdges = useMemo(() => getVisualEdges(graph.edges, graph.directed), [graph.edges, graph.directed])

  const edgeGeometryById = useMemo(() => {
    const map = new Map<string, EdgeGeometry>()
    const bundlesEnabled = visualEdges.length > 15

    type BundleGroup = { angle: number; centerX: number; centerY: number; edgeIds: string[] }
    const groups: BundleGroup[] = []
    const bundleByEdgeId = new Map<string, { x: number; y: number; spread: number }>()

    if (bundlesEnabled) {
      for (const edge of visualEdges) {
        const from = graph.positions[edge.from]
        const to = graph.positions[edge.to]
        if (!from || !to) {
          continue
        }
        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        const centerX = (from.x + to.x) / 2
        const centerY = (from.y + to.y) / 2

        let matched: BundleGroup | undefined
        for (const group of groups) {
          const angleDelta = Math.abs(group.angle - angle)
          const wrappedDelta = Math.min(angleDelta, Math.abs(Math.PI * 2 - angleDelta))
          const centerDelta = Math.hypot(group.centerX - centerX, group.centerY - centerY)
          if (wrappedDelta <= (15 * Math.PI) / 180 && centerDelta <= 40) {
            matched = group
            break
          }
        }

        if (!matched) {
          matched = { angle, centerX, centerY, edgeIds: [] }
          groups.push(matched)
        }

        matched.edgeIds.push(edge.id)
        const count = matched.edgeIds.length
        matched.centerX = (matched.centerX * (count - 1) + centerX) / count
        matched.centerY = (matched.centerY * (count - 1) + centerY) / count
        matched.angle = (matched.angle * (count - 1) + angle) / count
      }

      for (const group of groups) {
        if (group.edgeIds.length < 2) {
          continue
        }
        group.edgeIds.forEach((edgeId, index) => {
          const spread = (index - (group.edgeIds.length - 1) / 2) * 4
          bundleByEdgeId.set(edgeId, {
            x: group.centerX,
            y: group.centerY,
            spread,
          })
        })
      }
    }

    for (const edge of visualEdges) {
      const from = graph.positions[edge.from]
      const to = graph.positions[edge.to]
      if (!from || !to) {
        continue
      }
      const pairKey = edge.from < edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`
      const hasReverse = edge.hasArrow && reverseEdgePairs.has(pairKey)
      const signedOffset =
        hasReverse && edge.from !== edge.to ? (edge.from < edge.to ? 16 : -16) : 0
      const geometry = buildEdgeGeometry(from, to, signedOffset, edge.hasArrow, bundleByEdgeId.get(edge.id))
      map.set(edge.id, geometry)
      
      if (edge.symmetryKey) {
        const reverseEdge = graph.edges.find(e => e.symmetryKey === edge.symmetryKey && e.id !== edge.id)
        if (reverseEdge) {
          map.set(reverseEdge.id, geometry)
        }
      }
    }

    return map
  }, [graph.directed, graph.edges, graph.positions, reverseEdgePairs])

  const historyDiff: HistoryDiffOverlay = useMemo(() => {
    const previous = history.past[history.past.length - 1]
    if (!previous) {
      return { addedNodes: [], removedNodes: [], addedEdges: [], removedEdges: [] }
    }
    return diffGraphStates(previous.graph, graph)
  }, [graph, history.past])

  const clusteringRegions = useMemo(() => {
    if (!ENABLE_CLUSTER_ZONES) {
      return []
    }

    const palette = ['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#22d3ee']
    return findComponents(graph).map((component, index) => {
      const points = component
        .map((nodeId) => graph.positions[nodeId])
        .filter((position): position is { x: number; y: number } => typeof position === 'object')
      if (points.length === 0) {
        return null
      }
      const padding = 34
      const minX = Math.min(...points.map((point) => point.x)) - padding
      const maxX = Math.max(...points.map((point) => point.x)) + padding
      const minY = Math.min(...points.map((point) => point.y)) - padding
      const maxY = Math.max(...points.map((point) => point.y)) + padding
      return {
        id: `cluster-${index}`,
        color: palette[index % palette.length],
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }
    })
  }, [graph])

  const minimapScaleX = MINIMAP_WIDTH / CANVAS_WIDTH
  const minimapScaleY = MINIMAP_HEIGHT / CANVAS_HEIGHT
  const viewportX = (-transform.x / transform.k) * minimapScaleX
  const viewportY = (-transform.y / transform.k) * minimapScaleY
  const viewportWidth = (CANVAS_WIDTH / transform.k) * minimapScaleX
  const viewportHeight = (CANVAS_HEIGHT / transform.k) * minimapScaleY

  function navigateFromMinimap(event: MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const worldX = ((event.clientX - rect.left) / MINIMAP_WIDTH) * CANVAS_WIDTH
    const worldY = ((event.clientY - rect.top) / MINIMAP_HEIGHT) * CANVAS_HEIGHT
    applyZoomTransform({
      k: transform.k,
      x: CANVAS_WIDTH / 2 - worldX * transform.k,
      y: CANVAS_HEIGHT / 2 - worldY * transform.k,
    })
  }

  return (
    <section className="flex flex-col h-full rounded-2xl relative overflow-hidden group">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(140deg, rgba(99,102,241,0.03) 0%, rgba(168,85,247,0.02) 60%)' }} />

      <div
        className="p-4 md:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 relative"
        style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--app-text)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--app-accent)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              {t('canvas.title')}
            </h2>
          </div>
        </div>

        <div className="flex items-start gap-2 self-start">
          <div style={{ marginRight: 32, display: 'flex', gap: 12 }}>
            <button 
              className="btn-premium"
              onClick={() => window.dispatchEvent(new CustomEvent('graph:auto-layout'))} 
              disabled={autoLayoutRunning}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${autoLayoutRunning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {autoLayoutRunning ? t('canvas.autoLayoutRunning') : t('params.autoLayout')}
            </button>
            <button 
              className="btn-danger-premium"
              onClick={() => dispatch({ type: 'RESET' })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('toolbar.clear')}
            </button>
          </div>

          {interaction.edgeDraftFrom !== null && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded px-2 py-1" style={{ backgroundColor: 'var(--app-surface-strong)', border: '1px solid var(--app-border)' }}>
                <span className="text-xs font-semibold mr-1" style={{ color: 'var(--app-muted)' }}>{t('canvas.edge')}:</span>
                <button
                  type="button"
                  onClick={() => setEdgeDraftDirected(true)}
                  className="px-2 py-0.5 text-xs rounded transition-colors font-semibold"
                  style={{ backgroundColor: edgeDraftDirected ? 'var(--app-accent)' : 'transparent', color: edgeDraftDirected ? 'var(--app-surface-strong)' : 'var(--app-text)' }}
                >
                  {t('canvas.directed')}
                </button>
                <button
                  type="button"
                  onClick={() => setEdgeDraftDirected(false)}
                  className="px-2 py-0.5 text-xs rounded transition-colors font-semibold"
                  style={{ backgroundColor: !edgeDraftDirected ? 'var(--app-accent)' : 'transparent', color: !edgeDraftDirected ? 'var(--app-surface-strong)' : 'var(--app-text)' }}
                >
                  {t('canvas.undirected')}
                </button>
              </div>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                style={{ border: '1px solid var(--app-border)', backgroundColor: 'rgba(0,120,215,0.08)', color: 'var(--app-accent)' }}
                onClick={() => dispatch({ type: 'CLEAR_EDGE_DRAFT' })}
              >
                {t('canvas.cancelDraft')}
              </button>
            </div>
          )}
          <div className="z-20 ml-auto">
            <CanvasHelp />
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

      <div className="border-b p-3 md:p-4 space-y-3" style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface)' }}>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            runQueryCommand(queryInput)
          }}
        >
          <input
            value={queryInput}
            onChange={(event) => setQueryInput(event.currentTarget.value)}
            placeholder={t('query.placeholder')}
            className="glass-input flex-1 px-3 py-1.5 text-xs"
          />
          <button type="submit" className="glass-button px-3 py-1 text-xs">
            {t('query.run')}
          </button>
          <button
            type="button"
            className="glass-button px-3 py-1 text-xs"
            onClick={() => {
              setQueryInput('')
              setQueryHighlights(null)
            }}
          >
            {t('query.clear')}
          </button>
        </form>

        <AlgorithmCinemaPanel
          nodes={graph.nodes}
          algorithm={cinemaAlgorithm}
          sourceNode={cinemaSourceNode}
          targetNode={cinemaTargetNode}
          speed={cinemaSpeed}
          playing={cinemaPlaying}
          stepCount={cinemaProgram?.steps.length ?? 0}
          currentIndex={cinemaStepIndex}
          narration={currentCinemaStep?.narration ?? 'Build steps to start playback.'}
          onAlgorithmChange={(value) => {
            setCinemaAlgorithm(value)
            setCinemaProgram(null)
            setCinemaStepIndex(0)
            setCinemaPlaying(false)
          }}
          onSourceChange={(value) => setCinemaSourceNode(value)}
          onTargetChange={(value) => setCinemaTargetNode(value)}
          onSpeedChange={(value) => setCinemaSpeed(value)}
          onRun={runCinema}
          onPlayPause={() => {
            if (!cinemaProgram) {
              return
            }
            setCinemaPlaying((playing) => !playing)
          }}
          onStepBack={() => stepCinema(-1)}
          onStepForward={() => stepCinema(1)}
          onRewind={() => scrubCinema(0)}
          onFastForward={() => {
            if (cinemaProgram) {
              scrubCinema(cinemaProgram.steps.length - 1)
            }
          }}
          onScrub={scrubCinema}
          currentStep={currentCinemaStep}
        />

        {queryHighlights !== null && (
          <p className="text-xs text-slate-300">{queryHighlights.message}</p>
        )}
      </div>

      <div className="canvas-container w-full h-full">
        <div className="canvas-bg-glow" />
        <div className="canvas-bg-glow-2" />
        <svg
          ref={svgRef}
          data-graph-canvas="main"
          className="canvas-svg cursor-crosshair min-h-[520px]"
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          onDoubleClick={() => applyZoomTransform({ x: 0, y: 0, k: 1 })}
          onMouseMove={(event) => {
            if (interaction.edgeDraftFrom === null || svgRef.current === null) {
              return
            }

            const [x, y] = pointer(event, svgRef.current)
            // Transform viewport pointer to world coordinates
            const worldX = (x - transform.x) / transform.k
            const worldY = (y - transform.y) / transform.k
            setCursorPosition({ x: worldX, y: worldY })
          }}
        >
          <defs>
            <pattern
              id="dot-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill="#38bdf8" fillOpacity="0.12" />
            </pattern>
            <marker
              id="arrow"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
            >
              <path d="M0,2 L10,6 L0,10 L3,6 z" fill="var(--app-accent)" />
            </marker>
            <marker
              id="arrow-selected"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
            >
              <path d="M0,2 L10,6 L0,10 L3,6 z" fill="var(--app-accent)" />
            </marker>
            
          </defs>

          <g style={{ animation: 'grid-pan 18s linear infinite' }}>
            <rect
              x="-40"
              y="-40"
              width="calc(100% + 80px)"
              height="calc(100% + 80px)"
              fill="url(#dot-grid)"
              style={{ pointerEvents: 'none' }}
            />
          </g>

          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
            {/* Clickable Overlay for creating nodes (Static, so clicking works properly) */}
            <rect
              x={-50000}
              y={-50000}
              width={100000}
              height={100000}
              fill="transparent"
              onClick={(event) => {
                if (event.button !== 0 || svgRef.current === null) {
                  return
                }

                const pt = svgRef.current.createSVGPoint()
                pt.x = event.clientX
                pt.y = event.clientY
                const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse())

                // Manually apply the d3-zoom transform to get world coordinates
                let rawX = (svgP.x - transform.x) / transform.k
                let rawY = (svgP.y - transform.y) / transform.k
                
                // Prevent overlapping on click
                const collided = applyCollisions(rawX, rawY, null, graph.nodes, graph.positions, 55)

                const newBurstId = Date.now()
                setBursts((prev) => [...prev, { id: newBurstId, x: collided.x, y: collided.y }])

                dispatch({
                  type: 'ADD_NODE',
                  payload: { position: { x: collided.x, y: collided.y } },
                })
                dispatch({ type: 'SET_SELECTED_NODE', payload: { nodeId: null } })
                dispatch({ type: 'SET_SELECTED_EDGE', payload: { edgeId: null } })
                dispatch({ type: 'CLEAR_EDGE_DRAFT' })
                
                setEditingEdgeId(null)
                setWeightError(null)

                // deselect find node after interaction
                window.dispatchEvent(new CustomEvent('toolbar:close-search'))
              }}
            />
            
            <SnapGuides x={guides.x} y={guides.y} bounds={{ w: 10000, h: 10000 }} />

            {ENABLE_CLUSTER_ZONES && clusteringRegions.map((region) => {
              if (!region) {
                return null
              }
              return (
                <rect
                  key={region.id}
                  x={region.x}
                  y={region.y}
                  width={region.width}
                  height={region.height}
                  rx={26}
                  fill={region.color}
                  fillOpacity={0.08}
                  stroke={region.color}
                  strokeOpacity={0.28}
                  className="cluster-region"
                />
              )
            })}

            {queryHighlights?.components.map((component, index) => {
              const points = component
                .map((nodeId) => graph.positions[nodeId])
                .filter((position): position is { x: number; y: number } => typeof position === 'object')

              if (points.length < 2) {
                return null
              }

              const minX = Math.min(...points.map((point) => point.x)) - 28
              const maxX = Math.max(...points.map((point) => point.x)) + 28
              const minY = Math.min(...points.map((point) => point.y)) - 28
              const maxY = Math.max(...points.map((point) => point.y)) + 28
              const palette = ['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#22d3ee']
              const color = palette[index % palette.length]

              return (
                <rect
                  key={`component-${index}`}
                  x={minX}
                  y={minY}
                  width={maxX - minX}
                  height={maxY - minY}
                  rx={24}
                  fill={color}
                  fillOpacity={0.09}
                  stroke={color}
                  strokeOpacity={0.35}
                  strokeDasharray="6 4"
                />
              )
            })}

          {visualEdges.map((edge) => {
            const geometry = edgeGeometryById.get(edge.id)
            if (!geometry) {
              return null
            }

            const isSelected = interaction.selectedEdgeId === edge.id || (edge.symmetryKey !== undefined && graph.edges.find(e => e.id === interaction.selectedEdgeId)?.symmetryKey === edge.symmetryKey)

            return (
              <EdgeItem
                key={edge.id}
                edge={edge}
                geometry={geometry}
                isSelected={isSelected}
                directed={edge.hasArrow}
                weighted={graph.weighted}
                editingEdgeId={editingEdgeId}
                weightDraft={weightDraft}
                startWeightEdit={startWeightEdit}
                setWeightDraft={setWeightDraft}
                setWeightError={setWeightError}
                commitWeight={commitWeight}
                setEditingEdgeId={setEditingEdgeId}
                dispatch={dispatch}
                colorScheme={colorScheme}
              />
            )
          })}


          {historyDiff.removedEdges.map((edgeId) => {
            const previous = history.past[history.past.length - 1]
            const edge = previous?.graph.edges.find((candidate) => candidate.id === edgeId)
            if (!edge || !previous) {
              return null
            }
            const from = previous.graph.positions[edge.from]
            const to = previous.graph.positions[edge.to]
            if (!from || !to) {
              return null
            }
            const geometry = buildEdgeGeometry(from, to, 0, previous.graph.directed)
            return (
              <path
                key={`removed-edge-${edgeId}`}
                d={geometry.path}
                fill="none"
                stroke="#f87171"
                strokeWidth={3}
                strokeDasharray="6 4"
                opacity={0.45}
                className="history-removed-edge"
              />
            )
          })}

          {queryHighlights?.edges.map((edgeId) => {
            const geometry = edgeGeometryById.get(edgeId)
            if (!geometry) {
              return null
            }
            return (
              <path
                key={`query-edge-${edgeId}`}
                d={geometry.path}
                fill="none"
                stroke={queryHighlights.color}
                strokeWidth={4.5}
                strokeLinecap="round"
                opacity={0.8}
                className="query-highlight-pulse"
              />
            )
          })}

          {flashingEdgeIds.map((edgeId) => {
            const geometry = edgeGeometryById.get(edgeId)
            if (!geometry) {
              return null
            }
            return (
              <path
                key={`cycle-edge-${edgeId}`}
                d={geometry.path}
                fill="none"
                stroke="#60a5fa"
                strokeWidth={5}
                strokeLinecap="round"
                className="cycle-flash"
              />
            )
          })}

          {currentCinemaStep?.treeEdges.map((edgeId) => {
            const geometry = edgeGeometryById.get(edgeId)
            if (!geometry) {
              return null
            }
            return (
              <path
                key={`cinema-tree-edge-${edgeId}`}
                d={geometry.path}
                fill="none"
                stroke={colorScheme === 'dark' ? '#22c55e' : '#15803d'}
                strokeWidth={4}
                strokeLinecap="round"
                opacity={0.8}
              />
            )
          })}

          {currentCinemaStep?.pathEdges?.map((edgeId) => {
            const geometry = edgeGeometryById.get(edgeId)
            if (!geometry) {
              return null
            }
            return (
              <path
                key={`dfs-path-edge-${edgeId}-${cinemaStepIndex}`}
                d={geometry.path}
                fill="none"
                stroke={colorScheme === 'dark' ? '#f59e0b' : '#b45309'}
                strokeWidth={4}
                strokeLinecap="round"
                className="dfs-tendril"
              />
            )
          })}

          {currentCinemaStep?.mstEdges?.map((edgeId) => {
            const geometry = edgeGeometryById.get(edgeId)
            if (!geometry) {
              return null
            }
            const isNew = currentCinemaStep.mstNewEdgeId === edgeId
            return (
              <path
                key={`cinema-mst-edge-${edgeId}-${cinemaStepIndex}`}
                d={geometry.path}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={5}
                strokeLinecap="round"
                className={isNew ? 'mst-grow' : undefined}
                opacity={0.85}
              />
            )
          })}

          {typeof currentCinemaStep?.rejectedEdgeId === 'string' && (() => {
            const geometry = edgeGeometryById.get(currentCinemaStep.rejectedEdgeId)
            if (!geometry) {
              return null
            }
            return (
              <path
                key={`cinema-rejected-edge-${currentCinemaStep.rejectedEdgeId}-${cinemaStepIndex}`}
                d={geometry.path}
                fill="none"
                stroke="#ef4444"
                strokeWidth={5}
                strokeLinecap="round"
                className="rejected-flash"
              />
            )
          })()}

          {typeof currentCinemaStep?.currentEdgeId === 'string' && (() => {
            const geometry = edgeGeometryById.get(currentCinemaStep.currentEdgeId)
            if (!geometry) {
              return null
            }
            return (
              <path
                key={`cinema-current-edge-${currentCinemaStep.currentEdgeId}-${cinemaStepIndex}`}
                d={geometry.path}
                fill="none"
                stroke={colorScheme === 'dark' ? '#00e5ff' : '#0097a7'}
                strokeWidth={4}
                strokeLinecap="round"
                className="cinema-edge-flash"
              />
            )
          })()}

          {graph.edges.map((edge) => {
            const geometry = edgeGeometryById.get(edge.id)
            if (!geometry) {
              return null
            }
            const flow = currentCinemaStep?.flowByEdge?.[edge.id]
            if (typeof flow !== 'number' || flow <= 0) {
              return null
            }
            const capacity = Math.max(1, edge.weight)
            const ratio = Math.max(0.05, Math.min(1, flow / capacity))
            const isSaturated = currentCinemaStep?.saturatedEdgeIds?.includes(edge.id) ?? false

            return (
              <path
                key={`flow-${edge.id}-${cinemaStepIndex}`}
                d={geometry.path}
                fill="none"
                stroke={isSaturated 
                  ? (colorScheme === 'dark' ? '#ef4444' : '#b91c1c') 
                  : (colorScheme === 'dark' ? '#60a5fa' : '#1d4ed8')}
                strokeWidth={Math.max(2, 8 * ratio)}
                strokeLinecap="round"
                opacity={0.75}
                className={isSaturated ? 'flow-saturated' : undefined}
              />
            )
          })}

          {currentCinemaStep?.augmentingEdgeIds?.map((edgeId) => {
            const geometry = edgeGeometryById.get(edgeId)
            if (!geometry) {
              return null
            }
            return (
              <path
                key={`augmenting-${edgeId}-${cinemaStepIndex}`}
                d={geometry.path}
                fill="none"
                stroke={colorScheme === 'dark' ? '#a78bfa' : '#6d28d9'}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="10 6"
                className="augmenting-pulse"
              />
            )
          })}

          {edgeDraftPosition !== null && cursorPosition !== null && (
            <line
              x1={edgeDraftPosition.x}
              y1={edgeDraftPosition.y}
              x2={cursorPosition.x}
              y2={cursorPosition.y}
              className="stroke-blue-400"
              strokeWidth={2}
              strokeDasharray="6 4"
              filter="url(#glow)"
            />
          )}

          {historyDiff.removedNodes.map((nodeId) => {
            const previous = history.past[history.past.length - 1]
            const position = previous?.graph.positions[nodeId]
            if (!position) {
              return null
            }
            return (
              <circle
                key={`removed-node-${nodeId}`}
                cx={position.x}
                cy={position.y}
                r={NODE_RADIUS + 3}
                fill="none"
                stroke="#f87171"
                strokeWidth={3}
                strokeDasharray="5 4"
                opacity={0.5}
              />
            )
          })}

          {graph.nodes.map((nodeId) => {
            const position = graph.positions[nodeId]
            if (!position) {
              return null
            }

            const isSelected = interaction.selectedNodeId === nodeId
            const isDraftStart = interaction.edgeDraftFrom === nodeId
            const isQueryNode = queryHighlights?.nodes.includes(nodeId) ?? false
            const isAddedNode = historyDiff.addedNodes.includes(nodeId)
            const isCinemaVisited = currentCinemaStep?.visited.includes(nodeId) ?? false
            const isCinemaFrontier = currentCinemaStep?.frontier.includes(nodeId) ?? false
            const isCinemaCurrent = currentCinemaStep?.currentNode === nodeId
            const isDijkstra = cinemaProgram?.algorithm === 'Dijkstra'
            const distance = currentCinemaStep?.distances?.[nodeId]
            const finiteDistances = currentCinemaStep?.distances
              ? Object.values(currentCinemaStep.distances)
              : []
            const maxDistance =
              finiteDistances.length > 0
                ? Math.max(...finiteDistances)
                : 1
            const haloRadius =
              typeof distance === 'number'
                ? NODE_RADIUS + 8 + Math.min(72, (distance / Math.max(maxDistance, 1)) * 72)
                : NODE_RADIUS + 8
            const haloHue =
              typeof distance === 'number'
                ? Math.round(250 - Math.min(1, distance / Math.max(maxDistance, 1)) * 180)
                : 240
            const shouldShowHalo =
              isDijkstra && typeof distance === 'number' && !(currentCinemaStep?.visited.includes(nodeId) ?? false)

            // Welsh-Powell : couleur distincte par groupe de coloration
            const cinemaColorGroup = currentCinemaStep?.colorGroups?.find(g =>
              g.nodeIds.includes(nodeId)
            ) ?? null

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
                  fill={isSelected || isDraftStart ? "var(--app-accent)" : "var(--app-surface-strong)"}
                  fillOpacity={isSelected || isDraftStart ? 0.25 : 1}
                  stroke="var(--app-accent)"
                  strokeOpacity={isSelected || isDraftStart ? 1 : 0.35}
                  strokeWidth={isSelected || isDraftStart ? 3.5 : 2.2}
                  className={`cursor-pointer transition-all hover:stroke-opacity-100 ${isSelected ? 'selected-glow' : ''}`}
                  style={{ 
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }}
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
                        directed: edgeDraftDirected,
                      },
                    })
                    // Clear selection states to remove "active" effects
                    dispatch({ type: 'SET_SELECTED_NODE', payload: { nodeId: null } })
                    dispatch({ type: 'SET_SELECTED_EDGE', payload: { edgeId: null } })
                    dispatch({ type: 'CLEAR_EDGE_DRAFT' })
                    
                    const closeSearchEvent = new CustomEvent('toolbar:close-search')
                    window.dispatchEvent(closeSearchEvent)
                  }}
                />
                {shouldShowHalo && (
                  <circle
                    r={haloRadius}
                    fill="none"
                    stroke={distance === 0 
                      ? (colorScheme === 'dark' ? '#0055cc' : '#1d4ed8') 
                      : (colorScheme === 'dark' ? '#00aaff' : '#0284c7')}
                    strokeWidth={2.5}
                    opacity={0.5}
                    className="dijkstra-halo"
                  />
                )}
                {isQueryNode && (
                  <circle
                    r={NODE_RADIUS + 10}
                    fill="none"
                    stroke={queryHighlights?.color ?? '#4ade80'}
                    strokeWidth={2.5}
                    className="query-highlight-pulse"
                  />
                )}
                {/* Anneau coloré Welsh-Powell : affiché à la place du vert générique si le nœud a une couleur */}
                {cinemaColorGroup !== null ? (
                  <circle
                    r={NODE_RADIUS + 5}
                    fill={cinemaColorGroup.color + '22'}
                    stroke={cinemaColorGroup.color}
                    strokeWidth={2.5}
                    opacity={0.9}
                  />
                ) : (
                  isCinemaVisited && (
                    <circle
                      r={NODE_RADIUS + 5}
                      fill="none"
                      stroke={colorScheme === 'dark' ? '#22c55e' : '#15803d'}
                      strokeWidth={2.5}
                      opacity={0.8}
                    />
                  )
                )}
                {isCinemaFrontier && (
                  <circle
                    r={NODE_RADIUS + 9}
                    fill="none"
                    stroke={colorScheme === 'dark' ? '#f59e0b' : '#b45309'}
                    strokeWidth={2}
                    className={cinemaProgram?.algorithm === 'BFS' ? 'bfs-wavefront' : 'frontier-pulse'}
                  />
                )}
                {isCinemaCurrent && (
                  <circle
                    r={NODE_RADIUS + 12}
                    fill="none"
                    stroke={colorScheme === 'dark' ? '#00e5ff' : '#0097a7'}
                    strokeWidth={3}
                    className="cinema-current-node"
                  />
                )}
                <text
                  className="pointer-events-none text-[13px] font-bold"
                  style={{ fill: 'var(--app-text)' }}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  dy="1"
                >
                  {nodeId}
                </text>
              </g>
            )
          })}
          
          {bursts.map(b => (
            <ParticleBurst
              key={b.id}
              x={b.x}
              y={b.y}
              onComplete={() => setBursts(prev => prev.filter(p => p.id !== b.id))}
            />
          ))}

          {typeof currentCinemaStep?.mstWeight === 'number' && (
            <g transform="translate(18 34)">
              <rect width="150" height="30" rx="8" fill="rgba(15,23,42,0.85)" stroke="rgba(56,189,248,0.65)" />
              <text x="10" y="20" className="fill-sky-300 text-[12px] font-semibold">
                MST Weight: {currentCinemaStep.mstWeight}
              </text>
            </g>
          )}
          </g>
        </svg>

        <div className="absolute bottom-4 right-4 rounded-lg border p-1.5 shadow-lg" style={{ borderColor: 'var(--app-border)', backgroundColor: 'var(--app-surface-strong)' }}>
          <svg
            width={MINIMAP_WIDTH}
            height={MINIMAP_HEIGHT}
            viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`}
            className="cursor-pointer"
            onClick={navigateFromMinimap}
          >
            <rect x={0} y={0} width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} fill="var(--app-surface-strong)" />
            {graph.edges.map((edge) => {
              const from = graph.positions[edge.from]
              const to = graph.positions[edge.to]
              if (!from || !to) {
                return null
              }
              return (
                <line
                  key={`minimap-edge-${edge.id}`}
                  x1={from.x * minimapScaleX}
                  y1={from.y * minimapScaleY}
                  x2={to.x * minimapScaleX}
                  y2={to.y * minimapScaleY}
                   stroke="var(--app-accent)"
                  strokeWidth={1}
                />
              )
            })}
            {graph.nodes.map((nodeId) => {
              const pos = graph.positions[nodeId]
              if (!pos) {
                return null
              }
              return (
                <circle
                  key={`minimap-node-${nodeId}`}
                  cx={pos.x * minimapScaleX}
                  cy={pos.y * minimapScaleY}
                  r={2}
                  fill="#e2e8f0"
                />
              )
            })}
            <rect
              x={viewportX}
              y={viewportY}
              width={Math.min(MINIMAP_WIDTH, viewportWidth)}
              height={Math.min(MINIMAP_HEIGHT, viewportHeight)}
              fill="none"
              stroke="#f8fafc"
              strokeWidth={1.2}
            />
          </svg>
        </div>
        <GraphMetrics nodes={graph.nodes} edges={graph.edges} directed={graph.directed} />
        
        <CanvasToolbar
          onAddNode={() => {
            const viewportX = CANVAS_WIDTH / 2
            const viewportY = CANVAS_HEIGHT / 2
            let worldX = (viewportX - transform.x) / transform.k
            let worldY = (viewportY - transform.y) / transform.k
            const collided = applyCollisions(worldX, worldY, null, graph.nodes, positionsRef.current, 55)
            dispatch({ type: 'ADD_NODE', payload: { position: { x: collided.x, y: collided.y } } })
            
            // deselect find node
            window.dispatchEvent(new CustomEvent('toolbar:close-search'))
          }}
          onDeleteSelected={() => {
            if (interaction.selectedNodeId !== null) {
              dispatch({ type: 'DELETE_NODE', payload: { nodeId: interaction.selectedNodeId } })
            } else if (interaction.selectedEdgeId !== null) {
              dispatch({ type: 'DELETE_EDGE', payload: { edgeId: interaction.selectedEdgeId } })
            }
          }}
          onUndo={() => dispatch({ type: 'UNDO' })}
          onRedo={() => dispatch({ type: 'REDO' })}
          onFindNode={(id) => {
            const nodeId = Number(id)
            if (graph.nodes.includes(nodeId)) {
              const pos = graph.positions[nodeId]
              if (pos) {
                applyZoomTransform({ x: CANVAS_WIDTH / 2 - pos.x * 1, y: CANVAS_HEIGHT / 2 - pos.y * 1, k: 1 })
                dispatch({ type: 'SET_SELECTED_NODE', payload: { nodeId } })
              }
            }
          }}
          onScreenshot={async () => {
            if (svgRef.current) {
              const blob = await svgToPngBlob(svgRef.current)
              if (blob) {
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'graphlab-screenshot.png'
                link.click()
                URL.revokeObjectURL(url)
              }
            }
          }}
          onResetView={() => applyZoomTransform({ x: 0, y: 0, k: 1 })}
          onZoomIn={() => {
            const behavior = zoomBehaviorRef.current
            const selection = zoomSelectionRef.current
            if (behavior && selection) {
              selection.transition().duration(250).call(behavior.scaleBy, 1.3)
            }
          }}
          onZoomOut={() => {
            const behavior = zoomBehaviorRef.current
            const selection = zoomSelectionRef.current
            if (behavior && selection) {
              selection.transition().duration(250).call(behavior.scaleBy, 0.7)
            }
          }}
          onOpenCommandPalette={() => {
            window.dispatchEvent(new CustomEvent('graph:open-command-palette'))
          }}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
          hasSelection={interaction.selectedNodeId !== null || interaction.selectedEdgeId !== null}
          isCommandPaletteOpen={isCommandPaletteOpen}
          zoomLevel={transform.k}
        />
      </div>
    </section>
  )
}
