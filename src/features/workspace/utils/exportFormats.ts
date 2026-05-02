import type { GraphState } from '../../graph/model/types'

export type ExportFormat = 'json' | 'adjacency' | 'edgelist' | 'dot' | 'tikz'

function edgeWeight(graph: GraphState, weight: number): number {
  return graph.weighted ? weight : 1
}

export function toAdjacencyList(graph: GraphState): string {
  return graph.nodes
    .map((nodeId) => {
      const neighbors = graph.edges
        .flatMap((edge) => {
          if (edge.from === nodeId) {
            return `${edge.to}(${edgeWeight(graph, edge.weight)})`
          }
          if (!graph.directed && edge.to === nodeId) {
            return `${edge.from}(${edgeWeight(graph, edge.weight)})`
          }
          return []
        })
        .join(', ')
      return `${nodeId}: ${neighbors}`
    })
    .join('\n')
}

export function toEdgeList(graph: GraphState): string {
  if (graph.edges.length === 0) {
    return '# empty graph'
  }
  return graph.edges
    .map((edge) => `${edge.from} ${edge.to} ${edgeWeight(graph, edge.weight)}`)
    .join('\n')
}

export function toDOT(graph: GraphState): string {
  const graphType = graph.directed ? 'digraph' : 'graph'
  const connector = graph.directed ? '->' : '--'
  const nodes = graph.nodes.map((nodeId) => `  ${nodeId};`).join('\n')
  const edges = graph.edges
    .map((edge) => {
      const weight = edgeWeight(graph, edge.weight)
      return `  ${edge.from} ${connector} ${edge.to} [label="${weight}", weight=${weight}];`
    })
    .join('\n')

  return `${graphType} G {\n${nodes}\n${edges}\n}`
}

export function toTikZ(graph: GraphState): string {
  const header = [
    '\\begin{tikzpicture}[>=stealth, every node/.style={circle,draw,minimum size=7mm}]',
  ]

  const nodes = graph.nodes.map((nodeId) => {
    const position = graph.positions[nodeId]
    const x = ((position?.x ?? 0) / 60).toFixed(2)
    const y = (-(position?.y ?? 0) / 60).toFixed(2)
    return `\\node (${nodeId}) at (${x}, ${y}) {${nodeId}};`
  })

  const edgePrefix = graph.directed ? '\\draw[->]' : '\\draw'
  const edges = graph.edges.map((edge) => {
    const weight = edgeWeight(graph, edge.weight)
    return `${edgePrefix} (${edge.from}) -- node[midway, fill=black!10, inner sep=1pt] {${weight}} (${edge.to});`
  })

  const footer = ['\\end{tikzpicture}']
  return [...header, ...nodes, ...edges, ...footer].join('\n')
}

export function toJson(graph: GraphState): string {
  return JSON.stringify(graph, null, 2)
}

export function formatGraphForExport(graph: GraphState, format: ExportFormat): string {
  switch (format) {
    case 'json':
      return toJson(graph)
    case 'adjacency':
      return toAdjacencyList(graph)
    case 'edgelist':
      return toEdgeList(graph)
    case 'dot':
      return toDOT(graph)
    case 'tikz':
      return toTikZ(graph)
    default:
      return toJson(graph)
  }
}

export async function svgToPngBlob(svgElement: SVGSVGElement): Promise<Blob | null> {
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgElement)
  const encoded = encodeURIComponent(svgString)
  const image = new Image()

  return new Promise<Blob | null>((resolve) => {
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, svgElement.viewBox.baseVal.width || 900)
      canvas.height = Math.max(1, svgElement.viewBox.baseVal.height || 520)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      const themeBackground = getComputedStyle(document.documentElement)
        .getPropertyValue('--app-surface-strong')
        .trim()
      ctx.fillStyle = themeBackground || '#020617'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((nextBlob) => resolve(nextBlob), 'image/png')
    }

    image.onerror = () => resolve(null)
    image.src = `data:image/svg+xml;charset=utf-8,${encoded}`
  })
}


