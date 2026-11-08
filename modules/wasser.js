import { FLOORS, formatCurrency, formatNumber, meterUsage } from '../app.js';

export function render(state) {
  return `
    <header class="page-heading"><div><p class="eyebrow">Zählerverwaltung</p><h1>Wasserzähler</h1><p class="page-subtitle">Verbrauch je Wohneinheit festhalten und die jährlichen Kosten transparent berechnen.</p></div></header>
    <div class="meter-grid">
      ${FLOORS.map((floor) => {
        const meter = state.water[floor.id];
        const usage = meterUsage(meter);
        const total = usage * Number(meter.rate || 0) + Number(meter.fixedAnnual || 0);
        return `
          <section class="panel meter-card">
            <div class="panel-header"><h2 class="panel-title">${floor.name}</h2><span class="meter-unit">Zähler ${floor.shortName}</span></div>
            <form class="meter-form" data-floor="${floor.id}">
              <div class="form-grid">
                <div class="field"><label for="water-previous-${floor.id}">Vorheriger Stand (m³)</label><input id="water-previous-${floor.id}" name="previous" type="number" min="0" step="0.001" value="${meter.previous}" required /></div>
                <div class="field"><label for="water-current-${floor.id}">Aktueller Stand (m³)</label><input id="water-current-${floor.id}" name="current" type="number" min="0" step="0.001" value="${meter.current}" required /></div>
                <div class="field"><label for="water-rate-${floor.id}">Preis (€/m³)</label><input id="water-rate-${floor.id}" name="rate" type="number" min="0" step="0.0001" value="${meter.rate}" required /></div>
                <div class="field"><label for="water-fixed-${floor.id}">Grundpreis (€/Jahr)</label><input id="water-fixed-${floor.id}" name="fixedAnnual" type="number" min="0" step="0.01" value="${meter.fixedAnnual}" required /></div>
              </div>
              <div class="reading-result"><span>${formatNumber(usage, 3)} m³ erfasst</span><strong>${formatCurrency(total)} / Jahr</strong></div>
              <div class="form-actions"><button class="button" type="submit">Stand speichern</button><span class="field-hint">${meter.updatedAt ? `Zuletzt: ${new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(meter.updatedAt))}` : 'Noch nicht abgelesen'}</span></div>
            </form>
          </section>`;
      }).join('')}
    </div>
    <section class="panel history-panel"><div class="panel-header"><h2 class="panel-title">Ablesehistorie</h2><span class="panel-kicker">Letzte 10 Einträge</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Datum</th><th>Einheit</th><th>Zählerstand</th><th>Verbrauch</th><th>Kosten</th></tr></thead><tbody>
        ${historyRows(state)}
      </tbody></table></div>
    </section>`;
}

function historyRows(state) {
  const entries = FLOORS.flatMap((floor) => state.water[floor.id].history.map((entry) => ({ ...entry, floor })))
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  if (!entries.length) return '<tr><td class="empty-row" colspan="5">Nach dem ersten gespeicherten Zählerstand erscheint die Ablesehistorie hier.</td></tr>';
  return entries.map((entry) => `<tr><td>${new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(entry.date))}</td><td>${entry.floor.shortName}</td><td>${formatNumber(entry.current, 3)} m³</td><td>${formatNumber(entry.usage, 3)} m³</td><td>${formatCurrency(entry.cost)}</td></tr>`).join('');
}

export function init(container, { update }) {
  container.querySelectorAll('.meter-form').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const next = Object.fromEntries(['previous', 'current', 'rate', 'fixedAnnual'].map((key) => [key, Number(values[key])]));
    form.elements.current.setCustomValidity(next.current < next.previous ? 'Der aktuelle Stand muss mindestens so hoch wie der vorherige sein.' : '');
    if (!form.reportValidity()) return;
    const floorId = form.dataset.floor;
    update((state) => {
      const meter = state.water[floorId];
      const usage = next.current - next.previous;
      const entry = { ...next, usage, cost: usage * next.rate + next.fixedAnnual, date: new Date().toISOString() };
      state.water[floorId] = { ...meter, ...next, updatedAt: entry.date, history: [entry, ...meter.history].slice(0, 30) };
    }, 'Wasserzählerstand gespeichert');
  }));
  container.querySelectorAll('.meter-form').forEach((form) => {
    form.querySelectorAll('[name="previous"], [name="current"]').forEach((input) => input.addEventListener('input', () => form.elements.current.setCustomValidity('')));
  });
}