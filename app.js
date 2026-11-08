import * as dashboard from './modules/dashboard.js';
import * as strom from './modules/strom.js';
import * as wasser from './modules/wasser.js';
import * as nebenkosten from './modules/nebenkosten.js';
import * as verteilung from './modules/verteilung.js';

export const FLOORS = [
  { id: 'eg', name: 'Erdgeschoss', shortName: 'EG', area: 127, share: 127 / 228 },
  { id: 'og', name: 'Obergeschoss', shortName: 'OG', area: 101, share: 101 / 228 },
];

export const PAGES = {
  dashboard: { title: 'Übersicht', module: dashboard },
  strom: { title: 'Stromzähler', module: strom },
  wasser: { title: 'Wasserzähler', module: wasser },
  nebenkosten: { title: 'Nebenkosten', module: nebenkosten },
  verteilung: { title: 'Kostenverteilung', module: verteilung },
};

const STORAGE_KEY = 'hausverwaltung-v1';
const INITIAL_STATE = {
  electricity: Object.fromEntries(FLOORS.map((floor) => [floor.id, { previous: 0, current: 0, rate: 0, fixedAnnual: 0, updatedAt: null, history: [] }])),
  water: Object.fromEntries(FLOORS.map((floor) => [floor.id, { previous: 0, current: 0, rate: 0, fixedAnnual: 0, updatedAt: null, history: [] }])),
  costs: [],
};

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return structuredClone(INITIAL_STATE);
    return {
      ...structuredClone(INITIAL_STATE),
      ...saved,
      electricity: mergeFloors(INITIAL_STATE.electricity, saved.electricity),
      water: mergeFloors(INITIAL_STATE.water, saved.water),
      costs: Array.isArray(saved.costs) ? saved.costs : [],
    };
  } catch {
    return structuredClone(INITIAL_STATE);
  }
}

function mergeFloors(defaults, saved = {}) {
  return Object.fromEntries(FLOORS.map(({ id }) => [id, { ...defaults[id], ...(saved?.[id] ?? {}), history: Array.isArray(saved?.[id]?.history) ? saved[id].history : [] }]));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function meterUsage(meter) {
  return Math.max(0, Number(meter.current || 0) - Number(meter.previous || 0));
}

export function utilityBreakdown(state, utility) {
  const meters = state[utility];
  const variable = Object.fromEntries(FLOORS.map(({ id }) => [id, meterUsage(meters[id]) * Number(meters[id].rate || 0)]));
  const fixed = FLOORS.reduce((sum, { id }) => sum + Number(meters[id].fixedAnnual || 0), 0);
  const fixedByFloor = Object.fromEntries(FLOORS.map(({ id }) => [id, Number(meters[id].fixedAnnual || 0)]));
  const byFloor = Object.fromEntries(FLOORS.map(({ id }) => [id, variable[id] + fixedByFloor[id]]));
  return { variable, fixed, fixedByFloor, byFloor, total: byFloor.eg + byFloor.og };
}

export function costAllocationSplit(cost) {
  const total = Number(cost.amount || 0) * (cost.period === 'monthly' ? 12 : 1);
  if (cost.allocation === 'eg') return { eg: total, og: 0, total };
  if (cost.allocation === 'og') return { eg: 0, og: total, total };
  if (cost.allocation === 'equal') return { eg: total / 2, og: total / 2, total };
  return { eg: total * FLOORS[0].share, og: total * FLOORS[1].share, total };
}

export function costAllocationLabel(cost) {
  if (cost.allocation === 'eg') return 'Vollständig · EG';
  if (cost.allocation === 'og') return 'Vollständig · OG';
  if (cost.allocation === 'equal') return 'Hälftig · 50 / 50';
  return `Wohnfläche · EG ${formatNumber(FLOORS[0].share * 100, 2)} % / OG ${formatNumber(FLOORS[1].share * 100, 2)} %`;
}

export function yearlyCostBreakdown(state) {
  return state.costs.reduce((totals, cost) => {
    const split = costAllocationSplit(cost);
    totals.total += split.total;
    totals.eg += split.eg;
    totals.og += split.og;
    return totals;
  }, { eg: 0, og: 0, total: 0 });
}

const content = document.querySelector('#page-content');
const title = document.querySelector('#page-title');
const nav = document.querySelector('#main-nav');
const toast = document.querySelector('#toast');
const saveStatus = document.querySelector('#save-status');
let state = loadState();
let activePage = 'dashboard';
let toastTimeout;

export function notify(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2400);
}

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveStatus.innerHTML = '<span class="status-dot"></span> Lokal gespeichert';
  } catch {
    saveStatus.innerHTML = '<span class="status-dot" style="background:var(--danger)"></span> Speicher voll';
    notify('Änderung konnte nicht gespeichert werden.');
  }
}

export function update(mutator, message = 'Änderungen gespeichert') {
  mutator(state);
  persist();
  renderPage();
  if (message) notify(message);
}

function renderPage() {
  const page = PAGES[activePage] ?? PAGES.dashboard;
  title.textContent = page.title;
  nav.querySelectorAll('.nav-link').forEach((link) => {
    const active = link.dataset.page === activePage;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  content.innerHTML = page.module.render(state);
  page.module.init?.(content, { update, notify, state });
}

function navigate() {
  const requested = location.hash.slice(1);
  activePage = Object.hasOwn(PAGES, requested) ? requested : 'dashboard';
  if (!requested) history.replaceState(null, '', '#dashboard');
  renderPage();
}

nav.addEventListener('click', (event) => {
  const link = event.target.closest('[data-page]');
  if (!link || link.dataset.page === activePage) return;
  activePage = link.dataset.page;
  renderPage();
});
window.addEventListener('hashchange', navigate);
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    state = loadState();
    renderPage();
  }
});

const installButton = document.querySelector('#install-button');
let installPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});
window.addEventListener('appinstalled', () => notify('App wurde installiert.'));

document.querySelector('#today').textContent = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date());
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => notify('Offline-Modus konnte nicht aktiviert werden.')));
}
navigate();