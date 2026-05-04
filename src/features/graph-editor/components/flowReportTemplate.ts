import type { GraphState, NodeId } from '../../graph/model/types'

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
<html lang="fr" data-theme="light">
<head>
  <meta charset="UTF-8"/>
  <title>Rapport Ford-Fulkerson</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* ── Design tokens ── */
    :root {
      --blue-0: #eef2ff;
      --blue-1: #e0e7ff;
      --blue-2: #c7d2fe;
      --blue-3: #a5b4fc;
      --blue-4: #38bdf8;
      --blue-5: #0ea5e9;
      --blue-6: #0284c7;
      --blue-7: #0369a1;
      --blue-8: #075985;
      --blue-9: #0c4a6e;

      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;

      /* light */
      --bg:          #f0f4f8;
      --surface:     #ffffff;
      --surface-2:   #f8fafc;
      --border:      #e2e8f0;
      --text:        #0f172a;
      --text-muted:  #64748b;
      --header-from: #0c4a6e;
      --header-to:   #075985;
      --tag-blue-bg:   #dbeafe; --tag-blue-fg:   #1e40af;
      --tag-green-bg:  #dcfce7; --tag-green-fg:  #166534;
      --tag-red-bg:    #fee2e2; --tag-red-fg:    #991b1b;
      --tag-gray-bg:   #f1f5f9; --tag-gray-fg:   #475569;
      --tag-amber-bg:  #fffbeb; --tag-amber-fg:  #92400e;
      --bar-track:   #e2e8f0;
      --bar-fill:    var(--blue-5);
      --bar-sat:     #ef4444;
      --cut-s-bg:    #eff6ff; --cut-s-border: #bfdbfe;
      --cut-t-bg:    #fef2f2; --cut-t-border: #fecaca;
      --section-blue-bg:   #eff6ff; --section-blue-fg:   #1d4ed8;
      --section-green-bg:  #f0fdf4; --section-green-fg:  #15803d;
      --section-orange-bg: #fff7ed; --section-orange-fg: #c2410c;
      --section-purple-bg: #faf5ff; --section-purple-fg: #7c3aed;
      --total-row-bg: #fff7ed;
    }

    [data-theme="dark"] {
      --bg:          #0b1120;
      --surface:     #111827;
      --surface-2:   #1e2a3a;
      --border:      #1e3a5f;
      --text:        #e2e8f0;
      --text-muted:  #94a3b8;
      --header-from: #0c4a6e;
      --header-to:   #0369a1;
      --tag-blue-bg:   #0c2d48; --tag-blue-fg:   #38bdf8;
      --tag-green-bg:  #052e16; --tag-green-fg:  #4ade80;
      --tag-red-bg:    #2d0a0a; --tag-red-fg:    #f87171;
      --tag-gray-bg:   #1e293b; --tag-gray-fg:   #94a3b8;
      --tag-amber-bg:  #1c1400; --tag-amber-fg:  #fbbf24;
      --bar-track:   #1e3a5f;
      --bar-fill:    var(--blue-4);
      --bar-sat:     #f87171;
      --cut-s-bg:    #0c2d48; --cut-s-border: #0369a1;
      --cut-t-bg:    #2d0a0a; --cut-t-border: #b91c1c;
      --section-blue-bg:   #0c2d48; --section-blue-fg:   #38bdf8;
      --section-green-bg:  #052e16; --section-green-fg:  #4ade80;
      --section-orange-bg: #1c0a00; --section-orange-fg: #fb923c;
      --section-purple-bg: #1a0535; --section-purple-fg: #c084fc;
      --total-row-bg: #1c120a;
    }

    /* ── Reset & base ── */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 40px 20px;
      transition: background 0.25s, color 0.25s;
    }
    .page { max-width: 820px; margin: 0 auto; }

    /* ── Dark mode toggle ── */
    .topbar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }
    .theme-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 16px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border);
      background: var(--surface);
      color: var(--text-muted);
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, color 0.2s, border-color 0.2s;
    }
    .theme-btn:hover { color: var(--blue-5); border-color: var(--blue-5); }
    .theme-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, var(--header-from) 0%, var(--header-to) 100%);
      color: #fff;
      padding: 32px;
      border-radius: var(--radius-lg);
      margin-bottom: 20px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.3px; }
    .header p  { font-size: 13px; opacity: 0.65; }
    .badges { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
    .badge {
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: var(--radius-md);
      padding: 8px 16px;
      font-size: 12px;
      color: rgba(255,255,255,0.75);
    }
    .badge strong { display: block; font-size: 20px; font-weight: 700; color: #fff; line-height: 1.2; }

    /* ── Section card ── */
    .section {
      background: var(--surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      margin-bottom: 16px;
      overflow: hidden;
      transition: background 0.25s, border-color 0.25s;
    }
    .section-header {
      padding: 12px 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border-bottom: 1px solid var(--border);
      transition: background 0.25s;
    }
    .section-header.blue   { background: var(--section-blue-bg);   color: var(--section-blue-fg);   }
    .section-header.green  { background: var(--section-green-bg);  color: var(--section-green-fg);  }
    .section-header.orange { background: var(--section-orange-bg); color: var(--section-orange-fg); }
    .section-header.purple { background: var(--section-purple-bg); color: var(--section-purple-fg); }
    .section-body { padding: 16px 20px; }

    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th {
      text-align: left;
      padding: 9px 14px;
      background: var(--surface-2);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    td { padding: 10px 14px; border-top: 1px solid var(--border); color: var(--text); }
    tr:hover td { background: var(--surface-2); }
    .total-row td { font-weight: 700; background: var(--total-row-bg) !important; }

    /* ── Tags ── */
    .tag {
      display: inline-flex;
      align-items: center;
      padding: 2px 9px;
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.03em;
    }
    .tag-red    { background: var(--tag-red-bg);   color: var(--tag-red-fg);   }
    .tag-blue   { background: var(--tag-blue-bg);  color: var(--tag-blue-fg);  }
    .tag-green  { background: var(--tag-green-bg); color: var(--tag-green-fg); }
    .tag-gray   { background: var(--tag-gray-bg);  color: var(--tag-gray-fg);  }

    /* ── Flow bar ── */
    .utilisation-cell { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
    .flow-bar-wrap {
      background: var(--bar-track);
      border-radius: 99px;
      height: 7px;
      flex: 1;
      min-width: 60px;
      overflow: hidden;
    }
    .flow-bar { height: 100%; border-radius: 99px; background: var(--bar-fill); transition: width 0.3s; }
    .flow-bar.saturated { background: var(--bar-sat); width: 100% !important; }

    /* ── Augmenting paths ── */
    .path-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 0;
      border-top: 1px solid var(--border);
    }
    .path-row:first-child { border-top: none; }
    .path-index {
      width: 26px; height: 26px;
      border-radius: 50%;
      background: var(--tag-blue-bg);
      color: var(--tag-blue-fg);
      font-size: 11px;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .path-edges { font-size: 13px; color: var(--text); flex: 1; line-height: 1.5; }
    .path-bottleneck {
      font-size: 12px;
      font-weight: 700;
      color: var(--tag-amber-fg);
      background: var(--tag-amber-bg);
      border-radius: var(--radius-sm);
      padding: 3px 10px;
      white-space: nowrap;
    }

    /* ── Min-cut sets ── */
    .cut-sets { display: flex; gap: 14px; margin-bottom: 16px; flex-wrap: wrap; }
    .cut-set {
      flex: 1;
      min-width: 140px;
      border-radius: var(--radius-md);
      padding: 12px 16px;
    }
    .cut-set.s { background: var(--cut-s-bg); border: 1.5px solid var(--cut-s-border); }
    .cut-set.t { background: var(--cut-t-bg); border: 1.5px solid var(--cut-t-border); }
    .cut-set-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; color: var(--text-muted); }
    .cut-set-nodes { font-size: 17px; font-weight: 700; }
    .cut-set.s .cut-set-nodes { color: var(--tag-blue-fg); }
    .cut-set.t .cut-set-nodes { color: var(--tag-red-fg);  }

    /* ── Footer ── */
    .footer {
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Dark-mode toggle -->
  <div class="topbar">
    <button class="theme-btn" id="themeToggle" onclick="toggleTheme()">
      <svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
      </svg>
      <span id="themeLabel">Mode sombre</span>
    </button>
  </div>

  <!-- Header -->
  <div class="header">
    <h1>Rapport Ford-Fulkerson</h1>
    <p>Généré le ${new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    <div class="badges">
      <div class="badge"><strong>${source}</strong>Nœud source</div>
      <div class="badge"><strong>${target}</strong>Nœud puits</div>
      <div class="badge"><strong>${maxFlow}</strong>Flow maximum</div>
      <div class="badge"><strong>${pathCount}</strong>Chemin(s)</div>
      <div class="badge"><strong>${graph.nodes.length}</strong>Nœuds</div>
      <div class="badge"><strong>${graph.edges.length}</strong>Arêtes</div>
    </div>
  </div>

  <!-- Augmenting paths -->
  <div class="section">
    <div class="section-header blue">Chemins augmentants trouvés</div>
    <div class="section-body">
      ${pathHistory.length === 0
        ? '<p style="color:var(--text-muted);font-size:13px">Aucun chemin — le flot initial était déjà maximal.</p>'
        : pathHistory.map((ph, i) => `
          <div class="path-row">
            <div class="path-index">${i + 1}</div>
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

  <!-- Final flow per edge -->
  <div class="section">
    <div class="section-header green">Flot final par arête</div>
    <div class="section-body" style="padding:0">
      <table>
        <thead>
          <tr>
            <th>Arête</th><th>Flot</th><th>Capacité</th><th>Utilisation</th><th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${graph.edges.map(e => {
            const flow  = flowByEdge[e.id] ?? 0
            const cap   = Math.max(1, e.weight)
            const ratio = Math.round((flow / cap) * 100)
            const isSat = flow >= cap
            return `
              <tr>
                <td><strong>${e.from} → ${e.to}</strong></td>
                <td>${flow}</td>
                <td>${cap}</td>
                <td>
                  <div class="utilisation-cell">
                    <span style="min-width:36px">${ratio}%</span>
                    <div class="flow-bar-wrap">
                      <div class="flow-bar${isSat ? ' saturated' : ''}" style="width:${ratio}%"></div>
                    </div>
                  </div>
                </td>
                <td>${
                  isSat  ? '<span class="tag tag-red">Saturée</span>'  :
                  flow>0 ? '<span class="tag tag-blue">Active</span>'  :
                           '<span class="tag tag-gray">Vide</span>'
                }</td>
              </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Min-cut -->
  <div class="section">
    <div class="section-header orange">Coupe minimale (Max-Flow Min-Cut)</div>
    <div class="section-body">
      <div class="cut-sets">
        <div class="cut-set s">
          <div class="cut-set-label">Ensemble S — côté source</div>
          <div class="cut-set-nodes">{ ${sSet} }</div>
        </div>
        <div class="cut-set t">
          <div class="cut-set-label">Ensemble T — côté puits</div>
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
          <tr class="total-row">
            <td>Total</td>
            <td>${cutCapacity}</td>
            <td>${maxFlow}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Kirchhoff -->
  <div class="section">
    <div class="section-header purple">Vérification loi de Kirchhoff</div>
    <div class="section-body" style="padding:0">
      <table>
        <thead>
          <tr><th>Nœud</th><th>Flot entrant</th><th>Flot sortant</th><th>Statut</th></tr>
        </thead>
        <tbody>
          ${graph.nodes.map(nodeId => {
            const flowIn  = graph.edges.filter(e => e.to   === nodeId).reduce((s,e) => s + (flowByEdge[e.id] ?? 0), 0)
            const flowOut = graph.edges.filter(e => e.from === nodeId).reduce((s,e) => s + (flowByEdge[e.id] ?? 0), 0)
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
                <td>${
                  isSource || isSink
                    ? '<span class="tag tag-gray">N/A</span>'
                    : isOk
                      ? '<span class="tag tag-green">✓ Respectée</span>'
                      : '<span class="tag tag-red">✗ Violée</span>'
                }</td>
              </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    Rapport généré automatiquement &nbsp;·&nbsp; Ford-Fulkerson &nbsp;·&nbsp; Flow max = ${maxFlow}
  </div>

</div>

<script>
  const SUN_ICON = '<path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/><circle cx="12" cy="12" r="4"/>'
  const MOON_ICON = '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>'

  function toggleTheme() {
    const html = document.documentElement
    const isDark = html.getAttribute('data-theme') === 'dark'
    html.setAttribute('data-theme', isDark ? 'light' : 'dark')
    document.getElementById('themeIcon').innerHTML = isDark ? MOON_ICON : SUN_ICON
    document.getElementById('themeLabel').textContent = isDark ? 'Mode sombre' : 'Mode clair'
    localStorage.setItem('graph-lab-color-scheme', isDark ? 'light' : 'dark')
  }

  // Sync with app's persisted preference on load
  (function() {
    const saved = localStorage.getItem('graph-lab-color-scheme')
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.getElementById('themeIcon').innerHTML = SUN_ICON
      document.getElementById('themeLabel').textContent = 'Mode clair'
    }
  })()
</script>
</body>
</html>`
}
