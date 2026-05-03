import type { GraphState, NodeId } from '../../graph/model/types'
import type { CinemaStep } from '../utils/algorithmCinema'

interface FlowReportData {
  graph: GraphState
  flowByEdge: Record<string, number>
  maxFlow: number
  pathCount: number
pathHistory: Array<{ index: number; bottleneck: number; edgeIds: string[]; edgeLabels?: string[] }> 
  source: NodeId
  target: NodeId
  cutEdges: Array<{ from: NodeId; to: NodeId; id: string; weight: number }>
  cutCapacity: number
  sSet: string
  tSet: string
}

export function generateFlowReportHtml(data: FlowReportData): string {
  const {
    graph,
    flowByEdge,
    maxFlow,
    pathCount,
    pathHistory,
    source,
    target,
    cutEdges,
    cutCapacity,
    sSet,
    tSet,
  } = data

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Rapport Ford-Fulkerson</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      padding: 40px;
    }
    .page { max-width: 800px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: white;
      padding: 32px;
      border-radius: 16px;
      margin-bottom: 24px;
    }
    .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
    .header p { font-size: 14px; opacity: 0.7; }
    .badges { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
    .badge {
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
    }
    .badge strong { display: block; font-size: 22px; font-weight: 700; }
    .section {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .section-header {
      padding: 14px 20px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
    }
    .section-header.blue   { background: #eff6ff; color: #1d4ed8; }
    .section-header.green  { background: #f0fdf4; color: #15803d; }
    .section-header.orange { background: #fff7ed; color: #c2410c; }
    .section-header.purple { background: #faf5ff; color: #7c3aed; }
    .section-body { padding: 16px 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th {
      text-align: left;
      padding: 8px 12px;
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    td { padding: 10px 12px; border-top: 1px solid #f1f5f9; }
    tr:hover td { background: #f8fafc; }
    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .tag-red    { background: #fee2e2; color: #991b1b; }
    .tag-blue   { background: #dbeafe; color: #1e40af; }
    .tag-green  { background: #dcfce7; color: #166534; }
    .tag-gray   { background: #f1f5f9; color: #64748b; }
    .flow-bar-wrap {
      background: #f1f5f9;
      border-radius: 4px;
      height: 8px;
      width: 100px;
      display: inline-block;
      vertical-align: middle;
      margin-left: 8px;
    }
    .flow-bar { height: 100%; border-radius: 4px; background: #3b82f6; }
    .flow-bar.saturated { background: #ef4444; }
    .path-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 0;
      border-top: 1px solid #f1f5f9;
    }
    .path-row:first-child { border-top: none; }
    .path-index {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: #e0e7ff;
      color: #3730a3;
      font-size: 12px;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .path-edges { font-size: 13px; color: #1e293b; flex: 1; }
    .path-bottleneck {
      font-size: 12px;
      font-weight: 600;
      color: #f59e0b;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 3px 10px;
    }
    .cut-sets { display: flex; gap: 16px; margin-bottom: 16px; }
    .cut-set { flex: 1; border-radius: 8px; padding: 12px 16px; font-size: 13px; }
    .cut-set.s { background: #eff6ff; border: 1px solid #bfdbfe; }
    .cut-set.t { background: #fef2f2; border: 1px solid #fecaca; }
    .cut-set-label { font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; color: #64748b; }
    .cut-set-nodes { font-size: 16px; font-weight: 700; }
    .cut-set.s .cut-set-nodes { color: #1d4ed8; }
    .cut-set.t .cut-set-nodes { color: #dc2626; }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <h1>Rapport Ford-Fulkerson</h1>
    <p>Généré le ${new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    <div class="badges">
      <div class="badge"><strong>${source}</strong>Nœud source</div>
      <div class="badge"><strong>${target}</strong>Nœud puits</div>
      <div class="badge"><strong>${maxFlow}</strong>Flow maximum</div>
      <div class="badge"><strong>${pathCount}</strong>Chemin(s) augmentant(s)</div>
      <div class="badge"><strong>${graph.nodes.length}</strong>Nœuds</div>
      <div class="badge"><strong>${graph.edges.length}</strong>Arêtes</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header blue">Chemins augmentants trouvés</div>
    <div class="section-body">
      ${pathHistory.length === 0
        ? '<p style="color:#94a3b8;font-size:13px">Aucun chemin — le flot initial était déjà maximal.</p>'
        : pathHistory.map(ph => `
            <div class="path-row">
             <div class="path-edges">${
                    ph.edgeLabels
                        ? ph.edgeLabels.join(' &nbsp;→&nbsp; ')
                        : ph.edgeIds.map(eid => {
                            const e = graph.edges.find(x => x.id === eid)
                            return e ? `${e.from}→${e.to}` : eid
                        }).join(' &nbsp;→&nbsp; ')
                    }</div>
              <div class="path-bottleneck">+${ph.bottleneck} unités</div>
            </div>
          `).join('')
      }
    </div>
  </div>

  <div class="section">
    <div class="section-header green">Flot final par arête</div>
    <div class="section-body" style="padding:0">
      <table>
        <thead>
          <tr>
            <th>Arête</th>
            <th>Flot</th>
            <th>Capacité</th>
            <th>Utilisation</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${graph.edges.map(e => {
            const flow = flowByEdge[e.id] ?? 0
            const cap  = Math.max(1, e.weight)
            const ratio = Math.round((flow / cap) * 100)
            const isSat = flow >= cap
            return `
              <tr>
                <td><strong>${e.from} → ${e.to}</strong></td>
                <td>${flow}</td>
                <td>${cap}</td>
                <td>
                  ${ratio}%
                  <span class="flow-bar-wrap">
                    <span class="flow-bar ${isSat ? 'saturated' : ''}" style="width:${ratio}%"></span>
                  </span>
                </td>
                <td>${isSat
                  ? '<span class="tag tag-red">Saturée</span>'
                  : flow > 0
                    ? '<span class="tag tag-blue">Active</span>'
                    : '<span class="tag tag-gray">Vide</span>'
                }</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-header orange">Coupe minimale (Max-Flow Min-Cut)</div>
    <div class="section-body">
      <div class="cut-sets">
        <div class="cut-set s">
          <div class="cut-set-label">Ensemble S (côté source)</div>
          <div class="cut-set-nodes">{ ${sSet} }</div>
        </div>
        <div class="cut-set t">
          <div class="cut-set-label">Ensemble T (côté puits)</div>
          <div class="cut-set-nodes">{ ${tSet} }</div>
        </div>
      </div>
      <table>
        <thead>
          <tr><th>Arête coupée</th><th>Capacité</th><th>Flot</th></tr>
        </thead>
        <tbody>
          ${cutEdges.map(e => `
            <tr>
              <td><strong>${e.from} → ${e.to}</strong></td>
              <td>${Math.max(1, e.weight)}</td>
              <td>${flowByEdge[e.id] ?? 0}</td>
            </tr>
          `).join('')}
          <tr style="font-weight:700; background:#fff7ed">
            <td>Total</td>
            <td>${cutCapacity}</td>
            <td>${maxFlow}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-header purple">Vérification loi de Kirchhoff</div>
    <div class="section-body" style="padding:0">
      <table>
        <thead>
          <tr><th>Nœud</th><th>Flot entrant</th><th>Flot sortant</th><th>Statut</th></tr>
        </thead>
        <tbody>
          ${graph.nodes.map(nodeId => {
            const flowIn  = graph.edges.filter(e => e.to   === nodeId).reduce((s, e) => s + (flowByEdge[e.id] ?? 0), 0)
            const flowOut = graph.edges.filter(e => e.from === nodeId).reduce((s, e) => s + (flowByEdge[e.id] ?? 0), 0)
            const isSource = nodeId === source
            const isSink   = nodeId === target
            const isOk     = isSource || isSink || flowIn === flowOut
            return `
              <tr>
                <td>
                  <strong>${nodeId}</strong>
                  ${isSource ? '<span class="tag tag-blue" style="margin-left:6px">Source</span>' : ''}
                  ${isSink   ? '<span class="tag tag-green" style="margin-left:6px">Puits</span>'  : ''}
                </td>
                <td>${flowIn}</td>
                <td>${flowOut}</td>
                <td>${isSource || isSink
                  ? '<span class="tag tag-gray">N/A</span>'
                  : isOk
                    ? '<span class="tag tag-green">✓ Respectée</span>'
                    : '<span class="tag tag-red">✗ Violée</span>'
                }</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    Rapport généré automatiquement · Ford-Fulkerson · Flow max = ${maxFlow}
  </div>

</div>
</body>
</html>`
}