import { FLOORS, costAllocationLabel, costAllocationSplit, escapeHtml, formatCurrency, formatNumber, yearlyCostBreakdown } from '../app.js';

export function render(state) {
  const annual = yearlyCostBreakdown(state);
  return `
    <header class="page-heading"><div><p class="eyebrow">Laufende Ausgaben</p><h1>Nebenkosten</h1><p class="page-subtitle">Jeden Posten einzeln erfassen und nach Wohnfläche oder vollständig einer Wohnung zuordnen.</p></div></header>
    <div class="cost-layout">
      <section class="panel">
        <div class="cost-total"><span>Erfasste Nebenkosten pro Jahr</span><strong>${formatCurrency(annual.total)}</strong></div>
        ${state.costs.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Posten</th><th>Betrag</th><th>Schlüssel</th><th>Jährlich</th><th>EG</th><th>OG</th><th></th></tr></thead><tbody>${state.costs.map((cost) => {
          const split = costAllocationSplit(cost);
          return `<tr><td class="cost-name">${escapeHtml(cost.name)}</td><td>${formatCurrency(cost.amount)} <span class="muted-cell">/ ${cost.period === 'monthly' ? 'Monat' : 'Jahr'}</span></td><td>${costAllocationLabel(cost)}</td><td>${formatCurrency(split.total)}</td><td>${formatCurrency(split.eg)}</td><td>${formatCurrency(split.og)}</td><td><button class="button button-danger" type="button" data-delete="${escapeHtml(cost.id)}" aria-label="${escapeHtml(cost.name)} löschen">Entfernen</button></td></tr>`;
        }).join('')}</tbody></table></div>` : '<div class="cost-empty">Noch keine Nebenkosten erfasst.</div>'}
        <form class="form-panel cost-form" id="cost-form">
          <div class="field"><label for="cost-name">Kostenposten</label><input id="cost-name" name="name" type="text" maxlength="60" placeholder="z. B. Gebäudeversicherung" required /></div>
          <div class="field"><label for="cost-amount">Betrag (€)</label><input id="cost-amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0,00" required /></div>
          <div class="field"><label for="cost-period">Zeitraum</label><select id="cost-period" name="period"><option value="yearly">Pro Jahr</option><option value="monthly">Pro Monat</option></select></div>
          <div class="field"><label for="cost-allocation">Umlageschlüssel</label><select id="cost-allocation" name="allocation"><option value="area">Nach Wohnfläche · EG 55,70 % / OG 44,30 %</option><option value="eg">Vollständig dem EG zuordnen · 100 %</option><option value="og">Vollständig dem OG zuordnen · 100 %</option></select></div>
          <div class="form-actions"><button class="button" type="submit">Kostenposten hinzufügen</button></div>
        </form>
        <p class="form-note">Monatsbeträge werden für die Jahresübersicht mit 12 multipliziert. Die Verteilung zeigt pro Posten den Schlüssel und den Anteil beider Wohnungen.</p>
      </section>

      <aside class="panel allocation-card"><h2>Aktuelle Flächenquote</h2><p>Die Quote wird für flächenbezogene Nebenkosten automatisch angewendet.</p>
        ${FLOORS.map((floor) => `<div class="allocation-line"><span>${floor.shortName} · ${formatNumber(floor.area)} m²</span><strong>${formatNumber(floor.share * 100, 2)} %</strong></div>`).join('')}
        <div class="allocation-line allocation-total"><span>Gesamtfläche</span><strong>228 m²</strong></div>
      </aside>
    </div>`;
}

export function init(container, { update }) {
  container.querySelector('#cost-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const cost = { id: crypto.randomUUID(), name: values.name.trim(), amount: Number(values.amount), period: values.period, allocation: values.allocation };
    update((state) => { state.costs.push(cost); }, 'Nebenkosten hinzugefügt');
  });
  container.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => {
    update((state) => { state.costs = state.costs.filter((cost) => cost.id !== button.dataset.delete); }, 'Nebenkosten entfernt');
  }));
}