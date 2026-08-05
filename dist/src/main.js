const palette = { traffic: '#7c3aed', page: '#0ea5e9', action: '#10b981', email: '#f59e0b', conversion: '#ef4444' };
const icons = { traffic: '👥', page: '🖱️', action: '✅', email: '✉️', conversion: '🎯' };
const STORAGE_KEY = 'funnelflow-map-v2';

const demo = {
  nodes: [
    { id: 1, type: 'traffic', label: 'Paid Social', visitors: 12000, x: 70, y: 190, cost: 5200, revenue: 0 },
    { id: 2, type: 'page', label: 'Offer Page', visitors: 8700, x: 330, y: 190, cost: 0, revenue: 0 },
    { id: 3, type: 'action', label: 'Demo Booking', visitors: 2450, x: 590, y: 190, cost: 0, revenue: 0 },
    { id: 4, type: 'email', label: 'Follow-up Sequence', visitors: 1820, x: 850, y: 95, cost: 400, revenue: 0 },
    { id: 5, type: 'conversion', label: 'Annual Plan', visitors: 620, x: 1110, y: 190, cost: 0, revenue: 92380 },
  ],
  edges: [
    { id: 1, from: 1, to: 2 }, { id: 2, from: 2, to: 3 }, { id: 3, from: 3, to: 4 },
    { id: 4, from: 4, to: 5 }, { id: 5, from: 3, to: 5 },
  ],
};

let state = loadState();
let selectedId = state.nodes[1]?.id || state.nodes[0]?.id;
let connectFrom = null;
let drag = null;

const app = document.querySelector('#app');
const filePicker = Object.assign(document.createElement('input'), { type: 'file', accept: 'application/json', hidden: true });
document.body.append(filePicker);

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-US');

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.nodes?.length) return saved;
  } catch (_) { /* ignore invalid saved maps */ }
  return structuredClone(demo);
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function selectedNode() { return state.nodes.find((node) => node.id === selectedId) || state.nodes[0]; }
function stepRate(edge) {
  const from = state.nodes.find((node) => node.id === edge.from);
  const to = state.nodes.find((node) => node.id === edge.to);
  return from?.visitors ? `${((to.visitors / from.visitors) * 100).toFixed(1)}%` : '0.0%';
}
function stats() {
  const traffic = state.nodes.filter((node) => node.type === 'traffic').reduce((sum, node) => sum + node.visitors, 0);
  const conversions = state.nodes.filter((node) => node.type === 'conversion').reduce((sum, node) => sum + node.visitors, 0);
  const cost = state.nodes.reduce((sum, node) => sum + (node.cost || 0), 0);
  const revenue = state.nodes.reduce((sum, node) => sum + (node.revenue || 0), 0);
  return { traffic, conversions, conversionRate: traffic ? ((conversions / traffic) * 100).toFixed(1) : '0.0', cost, revenue, roas: cost ? (revenue / cost).toFixed(2) : '0.00' };
}

function render() {
  const selected = selectedNode();
  const kpi = stats();
  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand"><span>✦</span> FunnelFlow</div>
      <p class="eyebrow">Visual Journey Builder</p>
      <h1>Plan funnels, connect steps, and quantify drop-off in one canvas.</h1>
      <div class="toolbox">${Object.keys(palette).map((type) => `<button data-add="${type}"><span>${icons[type]}</span> Add ${type}</button>`).join('')}</div>
      <div class="actions"><button data-export>Export JSON</button><button data-import>Import JSON</button></div>
      <button class="ghost" data-reset>Reset demo</button>
      <p class="help">Tip: drag cards to arrange the map. Select a card, then click “Start connection” to link it to another step.</p>
    </aside>
    <section class="workspace">
      <header class="topbar">
        <div><p class="eyebrow">Campaign Blueprint</p><h2>SaaS demo funnel</h2></div>
        <div class="kpis">${card('Visitors', number.format(kpi.traffic))}${card('Conversions', number.format(kpi.conversions))}${card('Conv. rate', `${kpi.conversionRate}%`)}${card('ROAS', `${kpi.roas}x`)}</div>
      </header>
      <div class="canvas-card" id="canvas"><svg class="connector-layer" viewBox="0 0 1500 760">${connectors()}</svg>${state.nodes.map(nodeHtml).join('')}</div>
    </section>
    <aside class="inspector">
      <p class="eyebrow">Inspector</p><h2>${escapeHtml(selected.label)}</h2>
      <label>Name<input id="name" value="${escapeHtml(selected.label)}"></label>
      <label>Visitors<input id="visitors" type="number" min="0" value="${selected.visitors}"></label>
      <label>Cost<input id="cost" type="number" min="0" value="${selected.cost || 0}"></label>
      <label>Revenue<input id="revenue" type="number" min="0" value="${selected.revenue || 0}"></label>
      <label>Step type<select id="type">${Object.keys(palette).map((type) => `<option ${selected.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></label>
      <button class="connect" id="connect">${connectFrom === selected.id ? 'Cancel connection' : 'Start connection'}</button>
      <div class="insight"><span>📊</span><div><strong>Optimization hint</strong><p>${insight()}</p></div></div>
      <button class="danger" id="delete">Delete step</button>
    </aside>`;
  bindEvents(selected);
}

function card(label, value) { return `<div class="kpi"><span>${label}</span><strong>${value}</strong></div>`; }
function nodeHtml(node) {
  return `<button class="funnel-node ${node.id === selectedId ? 'selected' : ''} ${connectFrom === node.id ? 'connecting' : ''}" data-select="${node.id}" style="left:${node.x}px;top:${node.y}px;--accent:${palette[node.type]}"><span class="node-icon">${icons[node.type]}</span><span><strong>${escapeHtml(node.label)}</strong><small>${number.format(node.visitors)} visitors</small><small>${currency.format(node.revenue || 0)} revenue</small></span></button>`;
}
function connectors() {
  return `<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" /></marker></defs>` + state.edges.map((edge) => {
    const from = state.nodes.find((node) => node.id === edge.from); const to = state.nodes.find((node) => node.id === edge.to); if (!from || !to) return '';
    const x1 = from.x + 210, y1 = from.y + 58, x2 = to.x, y2 = to.y + 58, mid = Math.max(80, Math.abs(x2 - x1) / 2);
    return `<g><path d="M ${x1} ${y1} C ${x1 + mid} ${y1}, ${x2 - mid} ${y2}, ${x2} ${y2}" stroke="#94a3b8" stroke-width="3" fill="none" marker-end="url(#arrow)"/><text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 12}" class="edge-label">${stepRate(edge)}</text></g>`;
  }).join('');
}
function insight() {
  const worst = state.edges.map((edge) => ({ edge, rate: parseFloat(stepRate(edge)) })).sort((a, b) => a.rate - b.rate)[0];
  if (!worst) return 'Add connections between steps to reveal conversion gaps and opportunities.';
  const from = state.nodes.find((node) => node.id === worst.edge.from); const to = state.nodes.find((node) => node.id === worst.edge.to);
  return `${from.label} → ${to.label} is converting at ${worst.rate.toFixed(1)}%. Test clearer CTAs, message match, and reduced friction here.`;
}
function bindEvents(selected) {
  document.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => addNode(button.dataset.add)));
  document.querySelectorAll('[data-select]').forEach((button) => {
    button.addEventListener('click', () => selectOrConnect(Number(button.dataset.select)));
    button.addEventListener('pointerdown', startDrag);
  });
  ['name', 'visitors', 'cost', 'revenue', 'type'].forEach((id) => document.querySelector(`#${id}`).addEventListener('input', (event) => updateSelected(id === 'name' ? 'label' : id, event.target.type === 'number' ? Number(event.target.value) : event.target.value)));
  document.querySelector('#connect').addEventListener('click', () => { connectFrom = connectFrom === selected.id ? null : selected.id; render(); });
  document.querySelector('#delete').addEventListener('click', () => removeSelected(selected.id));
  document.querySelector('[data-reset]').addEventListener('click', resetDemo);
  document.querySelector('[data-export]').addEventListener('click', exportMap);
  document.querySelector('[data-import]').addEventListener('click', () => filePicker.click());
}
function selectOrConnect(id) {
  if (connectFrom && connectFrom !== id && !state.edges.some((edge) => edge.from === connectFrom && edge.to === id)) {
    state.edges.push({ id: Date.now(), from: connectFrom, to: id }); connectFrom = null; saveState(); render(); return;
  }
  selectedId = id; render();
}
function startDrag(event) {
  if (event.button !== 0) return;
  const node = state.nodes.find((item) => item.id === Number(event.currentTarget.dataset.select));
  drag = { id: node.id, dx: event.clientX - node.x, dy: event.clientY - node.y };
  event.currentTarget.setPointerCapture(event.pointerId);
  window.addEventListener('pointermove', dragNode); window.addEventListener('pointerup', stopDrag, { once: true });
}
function dragNode(event) { if (!drag) return; state.nodes = state.nodes.map((node) => node.id === drag.id ? { ...node, x: Math.max(20, event.clientX - drag.dx), y: Math.max(20, event.clientY - drag.dy) } : node); saveState(); render(); }
function stopDrag() { drag = null; window.removeEventListener('pointermove', dragNode); }
function addNode(type) { const id = Math.max(0, ...state.nodes.map((node) => node.id)) + 1; state.nodes.push({ id, type, label: `${type[0].toUpperCase()}${type.slice(1)} Step`, visitors: 1000, x: 140 + (state.nodes.length % 4) * 270, y: 390 + Math.floor(state.nodes.length / 4) * 150, cost: 0, revenue: 0 }); selectedId = id; saveState(); render(); }
function updateSelected(field, value) { state.nodes = state.nodes.map((node) => node.id === selectedId ? { ...node, [field]: value } : node); saveState(); render(); }
function removeSelected(id) { if (state.nodes.length <= 1) return; state.nodes = state.nodes.filter((node) => node.id !== id); state.edges = state.edges.filter((edge) => edge.from !== id && edge.to !== id); selectedId = state.nodes[0].id; connectFrom = null; saveState(); render(); }
function resetDemo() { state = structuredClone(demo); selectedId = 2; connectFrom = null; saveState(); render(); }
function exportMap() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = Object.assign(document.createElement('a'), { href: url, download: 'funnelflow-map.json' }); link.click(); URL.revokeObjectURL(url); }
filePicker.addEventListener('change', async () => { const file = filePicker.files[0]; if (!file) return; const imported = JSON.parse(await file.text()); if (imported.nodes?.length && Array.isArray(imported.edges)) { state = imported; selectedId = state.nodes[0].id; saveState(); render(); } filePicker.value = ''; });
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }

render();
