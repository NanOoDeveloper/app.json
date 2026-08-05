const palette = { traffic: '#7c3aed', page: '#0ea5e9', action: '#10b981', email: '#f59e0b', conversion: '#ef4444' };
const icons = { traffic: '👥', page: '🖱️', action: '✅', email: '✉️', conversion: '🎯' };

let nodes = [
  { id: 1, type: 'traffic', label: 'Facebook Ads', visitors: 12000, x: 70, y: 190 },
  { id: 2, type: 'page', label: 'Landing Page', visitors: 8700, x: 330, y: 190 },
  { id: 3, type: 'action', label: 'Webinar Signup', visitors: 2450, x: 590, y: 190 },
  { id: 4, type: 'email', label: 'Nurture Sequence', visitors: 1820, x: 850, y: 95 },
  { id: 5, type: 'conversion', label: 'Paid Plan', visitors: 620, x: 1110, y: 190 },
];
let edges = [
  { from: 1, to: 2, rate: 72.5 }, { from: 2, to: 3, rate: 28.2 }, { from: 3, to: 4, rate: 74.3 },
  { from: 4, to: 5, rate: 34.1 }, { from: 3, to: 5, rate: 11.8 },
];
let selectedId = 2;

const app = document.querySelector('#app');
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-US');

function stats() {
  const traffic = nodes.filter((node) => node.type === 'traffic').reduce((sum, node) => sum + node.visitors, 0);
  const conversions = nodes.filter((node) => node.type === 'conversion').reduce((sum, node) => sum + node.visitors, 0);
  return { traffic, conversions, conversionRate: traffic ? ((conversions / traffic) * 100).toFixed(1) : '0.0', revenue: conversions * 149 };
}

function render() {
  const selected = nodes.find((node) => node.id === selectedId) || nodes[0];
  const kpi = stats();
  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand"><span>✦</span> FunnelFlow</div>
      <p class="eyebrow">Visualization Studio</p>
      <h1>Map, measure, and optimize every customer journey.</h1>
      <div class="toolbox">${Object.keys(palette).map((type) => `<button data-add="${type}"><span>${icons[type]}</span> Add ${type}</button>`).join('')}</div>
      <div class="actions"><button>💾 Save</button><button>🔗 Share</button></div>
    </aside>
    <section class="workspace">
      <header class="topbar">
        <div><p class="eyebrow">Campaign Blueprint</p><h2>SaaS demo funnel</h2></div>
        <div class="kpis">
          ${card('Visitors', number.format(kpi.traffic))}${card('Conversions', number.format(kpi.conversions))}${card('Conv. rate', `${kpi.conversionRate}%`)}${card('Revenue', currency.format(kpi.revenue))}
        </div>
      </header>
      <div class="canvas-card"><svg class="connector-layer" viewBox="0 0 1320 560">${connectors()}</svg>${nodes.map(nodeHtml).join('')}</div>
    </section>
    <aside class="inspector">
      <p class="eyebrow">Inspector</p><h2>${escapeHtml(selected.label)}</h2>
      <label>Name<input id="name" value="${escapeHtml(selected.label)}"></label>
      <label>Visitors<input id="visitors" type="number" value="${selected.visitors}"></label>
      <label>Step type<select id="type">${Object.keys(palette).map((type) => `<option ${selected.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></label>
      <div class="insight"><span>📊</span><div><strong>Optimization hint</strong><p>Highest leakage occurs between Landing Page and Webinar Signup. Test above-the-fold proof and shorter forms.</p></div></div>
      <button class="danger" id="delete">🗑️ Delete step</button>
    </aside>`;
  bindEvents(selected);
}

function card(label, value) { return `<div class="kpi"><span>${label}</span><strong>${value}</strong></div>`; }
function nodeHtml(node) { return `<button class="funnel-node ${node.id === selectedId ? 'selected' : ''}" data-select="${node.id}" style="left:${node.x}px;top:${node.y}px;--accent:${palette[node.type]}"><span class="node-icon">${icons[node.type]}</span><span><strong>${escapeHtml(node.label)}</strong><small>${number.format(node.visitors)} visitors</small></span></button>`; }
function connectors() {
  return `<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" /></marker></defs>` + edges.map((edge) => {
    const from = nodes.find((node) => node.id === edge.from); const to = nodes.find((node) => node.id === edge.to); if (!from || !to) return '';
    const x1 = from.x + 190, y1 = from.y + 52, x2 = to.x, y2 = to.y + 52, mid = (x2 - x1) / 2;
    return `<g><path d="M ${x1} ${y1} C ${x1 + mid} ${y1}, ${x2 - mid} ${y2}, ${x2} ${y2}" stroke="#94a3b8" stroke-width="3" fill="none" marker-end="url(#arrow)"/><text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 12}" class="edge-label">${edge.rate}%</text></g>`;
  }).join('');
}
function bindEvents(selected) {
  document.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => addNode(button.dataset.add)));
  document.querySelectorAll('[data-select]').forEach((button) => button.addEventListener('click', () => { selectedId = Number(button.dataset.select); render(); }));
  document.querySelector('#name').addEventListener('input', (event) => updateSelected('label', event.target.value));
  document.querySelector('#visitors').addEventListener('input', (event) => updateSelected('visitors', Number(event.target.value)));
  document.querySelector('#type').addEventListener('change', (event) => updateSelected('type', event.target.value));
  document.querySelector('#delete').addEventListener('click', () => removeSelected(selected.id));
}
function addNode(type) {
  const id = Math.max(...nodes.map((node) => node.id)) + 1;
  nodes = [...nodes, { id, type, label: `${type[0].toUpperCase()}${type.slice(1)} Step`, visitors: 1000, x: 160 + (nodes.length % 4) * 250, y: 360 + Math.floor(nodes.length / 4) * 130 }];
  selectedId = id; render();
}
function updateSelected(field, value) { nodes = nodes.map((node) => node.id === selectedId ? { ...node, [field]: value } : node); render(); }
function removeSelected(id) { if (nodes.length <= 1) return; nodes = nodes.filter((node) => node.id !== id); edges = edges.filter((edge) => edge.from !== id && edge.to !== id); selectedId = nodes[0].id; render(); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }

render();
