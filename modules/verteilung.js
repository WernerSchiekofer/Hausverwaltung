import { FLOORS, costAllocationLabel, costAllocationSplit, escapeHtml, formatCurrency, formatNumber, utilityBreakdown, yearlyCostBreakdown } from '../app.js';

export function render(state) {
  const electricity = utilityBreakdown(state, 'electricity');
  const water = utilityBreakdown(state, 'water');
  const costs = yearlyCostBreakdown(state);
  const totals = Object.fromEntries(FLOORS.map(({ id }) => [id, electricity.byFloor[id] + water.byFloor[id] + costs[id]]));
  const grandTotal = totals.eg + totals.og;
  return `
    <header class="page-heading"><div><p class="eyebrow">Mieterübersicht · jährliche Beträge</p><h1>Kostenverteilung</h1><p class="page-subtitle">Jeder Nebenkostenposten mit gewähltem Umlageschlüssel und den Anteilen für EG und OG.</p></div><button class="button print-button" id="print-statement" type="button">Abrechnung drucken / PDF</button></header>
    <div class="distribution-summary">
      ${FLOORS.map((floor) => `<section class="distribution-unit"><div class="distribution-unit-top"><strong>${floor.name}</strong><span>${formatNumber(floor.share * 100, 2)} % Flächenanteil</span></div><div class="distribution-amount">${formatCurrency(totals[floor.id])}</div><small>Jährlicher Anteil</small></section>`).join('')}
    </div>
    <section class="panel breakdown-section"><div class="panel-header"><h2 class="panel-title">Einzelaufstellung</h2><span class="panel-kicker">Jährlich · Anteile je Wohnung</span></div>
      <div class="table-wrap"><table class="data-table distribution-table"><thead><tr><th>Kostenposten</th><th>Umlageschlüssel</th><th>EG</th><th>OG</th><th>Gesamt</th></tr></thead><tbody>
        ${distributionRow('Strom · Verbrauch', 'Je Zählerstand', electricity.variable.eg, electricity.variable.og)}
        ${distributionRow('Strom · Grundpreise', 'Direkt je Zähler', electricity.fixedByFloor.eg, electricity.fixedByFloor.og)}
        ${distributionRow('Wasser · Verbrauch', 'Je Zählerstand', water.variable.eg, water.variable.og)}
        ${distributionRow('Wasser · Grundpreise', 'Direkt je Zähler', water.fixedByFloor.eg, water.fixedByFloor.og)}
        ${state.costs.map((cost) => {
          const split = costAllocationSplit(cost);
          return distributionRow(escapeHtml(cost.name), costAllocationLabel(cost), split.eg, split.og);
        }).join('')}
      </tbody><tfoot><tr><td colspan="2">Jahressumme</td><td>${formatCurrency(totals.eg)}</td><td>${formatCurrency(totals.og)}</td><td>${formatCurrency(grandTotal)}</td></tr></tfoot></table></div>
    </section>
    <section class="panel breakdown-section"><div class="panel-header"><h2 class="panel-title">Umlageschlüssel</h2><span class="panel-kicker">Wohnfläche · 228 m²</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Einheit</th><th>Fläche</th><th>Anteil</th><th>Meterverbrauch</th></tr></thead><tbody>
        ${FLOORS.map((floor) => `<tr><td>${floor.name}</td><td>${formatNumber(floor.area)} m²</td><td>${formatNumber(floor.share * 100, 2)} %</td><td>${formatNumber(state.electricity[floor.id].current - state.electricity[floor.id].previous, 2)} kWh Strom · ${formatNumber(state.water[floor.id].current - state.water[floor.id].previous, 3)} m³ Wasser</td></tr>`).join('')}
      </tbody></table></div>
    </section>`;
}

function distributionRow(name, allocation, eg, og) {
  return `<tr><td>${name}</td><td>${allocation}</td><td>${formatCurrency(eg)}</td><td>${formatCurrency(og)}</td><td>${formatCurrency(eg + og)}</td></tr>`;
}

export function init(container) {
  container.querySelector('#print-statement').addEventListener('click', () => window.print());
}