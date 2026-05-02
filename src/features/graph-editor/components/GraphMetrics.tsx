import React, { useMemo } from 'react'
import type { GraphEdge, NodeId } from '../../graph/model/types'
import { useI18n } from '../../../shared/context/I18nContext'

interface GraphMetricsProps {
  nodes: NodeId[];
  edges: GraphEdge[];
  directed: boolean;
}

function translateGraphTypeLabel(label: string, t: (key: string) => string): string {
  if (/^\d+-regular$/.test(label)) {
    return label.replace('-regular', `-${t('metrics.regular')}`)
  }

  switch (label) {
    case 'directed':
      return t('metrics.directed')
    case 'undirected':
      return t('metrics.undirected')
    case 'complete':
      return t('metrics.complete')
    case 'bipartite':
      return t('metrics.bipartite')
    case 'bipartite complete':
      return `${t('metrics.bipartite')} ${t('metrics.complete')}`
    case 'planar':
      return t('metrics.planar')
    case 'empty':
      return t('metrics.empty')
    default:
      return label
  }
}

function detectGraphTypes(
  nodes: NodeId[],
  edges: GraphEdge[],
  directed: boolean,
  logicalEdgeCount: number,
): { label: string; color: string }[] {
  const n = nodes.length;
  const types: { label: string; color: string }[] = [];
  if (n === 0) return types;

  // ── Degree calculation (Mode-aware)
  const degree: Record<number, number> = {};
  for (const node of nodes) { degree[node] = 0; }

  const seenForDegree = new Set<string>();
  for (const e of edges) {
    const key = directed ? `d-${e.from}-${e.to}` : `u-${[e.from, e.to].sort().join('-')}`;
    if (seenForDegree.has(key)) continue;
    seenForDegree.add(key);

    degree[e.from] = (degree[e.from] ?? 0) + 1;
    if (!directed && e.from !== e.to) {
      degree[e.to] = (degree[e.to] ?? 0) + 1;
    }
  }

  // ── Orienté / Non-orienté
  types.push(directed ? { label: 'directed', color: '#818cf8' } : { label: 'undirected', color: '#94a3b8' })

  // ── Complet
  const maxEdges = directed ? n * (n - 1) : (n * (n - 1)) / 2;
  if (n > 1 && logicalEdgeCount === maxEdges) {
    types.push({ label: 'complete', color: '#f59e0b' });
  }

  // ── Régulier
  const degrees = Object.values(degree);
  if (n > 0 && degrees.every(d => d === degrees[0]) && degrees[0] > 0) {
    types.push({ label: `${degrees[0]}-regular`, color: '#22d3ee' });
  }

  // ── Bipartie
  const color2: Record<number, number> = {};
  let isBipartite = true;
  for (const start of nodes) {
    if (color2[start] !== undefined) continue;
    const queue = [start];
    color2[start] = 0;
    while (queue.length > 0 && isBipartite) {
      const cur = queue.shift()!;
      for (const e of edges) {
        let nb: number | null = null;
        if (e.from === cur) nb = e.to;
        else if (!directed && e.to === cur) nb = e.from;

        if (nb === null || nb === cur) continue; // Ignore self-loops for bipartition

        if (color2[nb] === undefined) {
          color2[nb] = 1 - color2[cur];
          queue.push(nb);
        } else if (color2[nb] === color2[cur]) {
          isBipartite = false;
        }
      }
    }
  }

  if (isBipartite && logicalEdgeCount > 0) {
    const gA = nodes.filter(nd => color2[nd] === 0);
    const gB = nodes.filter(nd => color2[nd] === 1);
    if (gA.length > 0 && gB.length > 0) {
      const isCompleteBipartite = logicalEdgeCount === (gA.length * gB.length);
      types.push(isCompleteBipartite
        ? { label: 'Bipartie complet', color: '#34d399' }
        : { label: 'Bipartie', color: '#6ee7b7' }
      );
    }
  }

  // ── Planaire (Euler's formula e <= 3n - 6)
  if (n > 2 && !directed && logicalEdgeCount <= 3 * n - 6) {
    types.push({ label: 'Planaire', color: '#fb923c' });
  } else if (n <= 2) {
    types.push({ label: 'Planaire', color: '#fb923c' });
  }

  if (logicalEdgeCount === 0) types.push({ label: 'Graphe nul', color: '#64748b' });

  return types;
}

export const GraphMetrics: React.FC<GraphMetricsProps> = ({ nodes, edges, directed }) => {
  const { t } = useI18n()
  const metrics = useMemo(() => {
    const nodeCount = nodes.length;

    // Count unique logical edges
    const seen = new Set<string>();
    let logicalEdgeCount = 0;
    for (const e of edges) {
      const key = directed ? `${e.from}->${e.to}` : [e.from, e.to].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        logicalEdgeCount++;
      }
    }

    const maxEdges = nodeCount > 1 ? (directed ? nodeCount * (nodeCount - 1) : (nodeCount * (nodeCount - 1)) / 2) : 1;
    const density = nodeCount > 1 ? ((logicalEdgeCount / maxEdges) * 100).toFixed(1) : 0;
    const types = detectGraphTypes(nodes, edges, directed, logicalEdgeCount);

    return { nodeCount, edgeCount: logicalEdgeCount, density, types };
  }, [nodes, edges, directed]);

  return (
      <div
       className="absolute bottom-4 right-4 backdrop-blur-md p-3.5 rounded-xl border shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-xs text-slate-300 pointer-events-none transition-all duration-300 z-20"
       style={{ width: '170px', backgroundColor: 'var(--app-surface-strong)', borderColor: 'var(--app-border)', color: 'var(--app-text)' }}
     >
      <div className="flex items-center gap-2 mb-2.5 border-b border-slate-700/50 pb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
        <h4 style={{color: 'var(--app-text)'}} className="font-bold uppercase tracking-widest text-[10px]">{t('metrics.title')}</h4>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 items-center">
        <span className="text-slate-400">{t('metrics.nodes')}</span>
        <span className="text-right text-indigo-300 font-mono font-semibold">{metrics.nodeCount}</span>
        <span className="text-slate-400">{t('metrics.edges')}</span>
        <span className="text-right text-purple-300 font-mono font-semibold">{metrics.edgeCount}</span>
        <span className="text-slate-400">{t('metrics.density')}</span>
        <span className="text-right text-emerald-300 font-mono font-semibold">{metrics.density}%</span>
      </div>

      {/* ── Graph Type ── */}
      {metrics.types.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <h4 style={{color: 'var(--app-text)'}} className=" font-bold uppercase tracking-widest text-[10px]">{t('metrics.type')}</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {metrics.types.map((metric) => (
              <span
                key={metric.label}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  backgroundColor: metric.color + '22',
                  color: metric.color,
                  border: `1px solid ${metric.color}55`,
                }}
              >
                {translateGraphTypeLabel(metric.label, t)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
