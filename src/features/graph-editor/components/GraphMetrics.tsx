import React, { useMemo } from 'react';
import type { GraphEdge, NodeId } from '../../graph/model/types';

interface GraphMetricsProps {
  nodes: NodeId[];
  edges: GraphEdge[];
  directed: boolean;
}

function detectGraphTypes(
  nodes: NodeId[],
  edges: GraphEdge[],
  directed: boolean,
): { label: string; color: string }[] {
  const n = nodes.length;
  const types: { label: string; color: string }[] = [];
  if (n === 0) return types;

  // Degré de chaque nœud
  const degree: Record<number, number> = {};
  for (const node of nodes) { degree[node] = 0; }
  for (const e of edges) {
    degree[e.from]    = (degree[e.from]    ?? 0) + 1;
    if (!directed) degree[e.to] = (degree[e.to] ?? 0) + 1;
  }

  // ── Orienté / Non-orienté
  types.push(directed
    ? { label: 'Dirigé',     color: '#818cf8' }
    : { label: 'Non-dirigé', color: '#94a3b8' }
  );

  // ── Complet
  const maxEdges = directed ? n * (n - 1) : (n * (n - 1)) / 2;
  if (n > 1 && edges.length === maxEdges) {
    types.push({ label: 'Complet', color: '#f59e0b' });
  }

  // ── Régulier
  const degrees = Object.values(degree);
  if (degrees.every(d => d === degrees[0]) && degrees[0] > 0) {
    types.push({ label: `${degrees[0]}-Régulier`, color: '#22d3ee' });
  }

  // ── Bipartie (BFS 2-coloration)
  const color2: Record<number, number> = {};
  let isBipartite = true;
  for (const start of nodes) {
    if (color2[start] !== undefined) continue;
    const queue = [start];
    color2[start] = 0;
    while (queue.length > 0 && isBipartite) {
      const cur = queue.shift()!;
      for (const e of edges) {
        const nb = e.from === cur ? e.to : (!directed && e.to === cur ? e.from : null);
        if (nb === null) continue;
        if (color2[nb] === undefined) { color2[nb] = 1 - color2[cur]; queue.push(nb); }
        else if (color2[nb] === color2[cur]) isBipartite = false;
      }
    }
  }
  if (isBipartite && edges.length > 0) {
    const gA = nodes.filter(nd => color2[nd] === 0);
    const gB = nodes.filter(nd => color2[nd] === 1);
    const biMax = directed ? gA.length * gB.length * 2 : gA.length * gB.length;
    if (gA.length > 0 && gB.length > 0) {
      types.push(edges.length === biMax
        ? { label: 'Bipartie complet', color: '#34d399' }
        : { label: 'Bipartie',         color: '#6ee7b7' }
      );
    }
  }





  // ── Planaire : condition nécessaire e ≤ 3n − 6
  if (n <= 2) {
    types.push({ label: 'Planaire', color: '#fb923c' });
  } else if (!directed && edges.length <= 3 * n - 6) {
    types.push({ label: 'Planaire', color: '#fb923c' });
  }

  // ── Graphe nul
  if (edges.length === 0) types.push({ label: 'Graphe nul', color: '#64748b' });

  return types;
}

export const GraphMetrics: React.FC<GraphMetricsProps> = ({ nodes, edges, directed }) => {
  const metrics = useMemo(() => {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    let maxEdges = nodeCount > 1 ? nodeCount * (nodeCount - 1) : 1;
    if (!directed) maxEdges = maxEdges / 2;
    const density = nodeCount > 1 ? ((edgeCount / maxEdges) * 100).toFixed(1) : 0;
    const types = detectGraphTypes(nodes, edges, directed);
    return { nodeCount, edgeCount, density, types };
  }, [nodes, edges, directed]);

  return (
    <div
      className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-xs text-slate-300 pointer-events-none transition-all duration-300 z-20"
      style={{ width: '170px' }}
    >
      {/* ── Graph Metrics ── */}
      <div className="flex items-center gap-2 mb-2.5 border-b border-slate-700/50 pb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
        <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Graph Metrics</h4>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 items-center">
        <span className="text-slate-400">Nodes</span>
        <span className="text-right text-indigo-300 font-mono font-semibold">{metrics.nodeCount}</span>
        <span className="text-slate-400">Edges</span>
        <span className="text-right text-purple-300 font-mono font-semibold">{metrics.edgeCount}</span>
        <span className="text-slate-400">Density</span>
        <span className="text-right text-emerald-300 font-mono font-semibold">{metrics.density}%</span>
      </div>

      {/* ── Graph Type ── */}
      {metrics.types.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Graph Type</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {metrics.types.map(t => (
              <span
                key={t.label}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  backgroundColor: t.color + '22',
                  color: t.color,
                  border: `1px solid ${t.color}55`,
                }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};