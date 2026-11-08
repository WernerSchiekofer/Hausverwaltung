import { FLOORS, formatCurrency, formatNumber, meterUsage, utilityBreakdown, yearlyCostBreakdown } from '../app.js';

const meterLabel = (meter, unit) => meter.updatedAt
  ? `${formatNumber(meterUsage(meter), 1)} ${unit} seit ${new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(meter.updatedAt))}`
  : 'Noch kein Stand erfasst';

export function render(state) {
  const electricity = utilityBreakdown(state, 'electricity');
  const water = utilityBreakdown(state, 'water');
  const costs = yearlyCostBreakdown(state);
  const annual = electricity.total + water.total + costs.total;

  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Ihr Zuhause auf einen Blick</p>
        <h1 class="hero-title">Zwei Einheiten.<br /><span>Ein Zuhause.</span></h1>
        <p class="hero-description">Zählerstände, laufende Kosten und die faire Verteilung für Ihr Zweifamilienhaus an einem Ort.</p>
        <div class="hero-meta"><span><i class="meta-dot"></i>2 Wohneinheiten</span><span><i class="meta-dot"></i>228 m² Gesamtfläche</span><span><i class="meta-dot"></i>Privat verwaltet</span></div>
      </div>
    </section>

    <div class="dashboard-grid">
      <section class="panel" aria-labelledby="units-title">
        <div class="panel-header"><h2 class="panel-title" id="units-title">Wohneinheiten</h2><span class="panel-kicker">Flächenverteilung</span></div>
        <div class="unit-list">
          ${FLOORS.map((floor) => `
            <div class="unit-row">
              <span class="unit-avatar">${floor.shortName}</span>
              <div class="unit-main"><strong>${floor.name}</strong><span>${formatNumber(floor.area)} m² · Strom ${meterLabel(state.electricity[floor.id], 'kWh')}</span></div>
              <div class="unit-share"><strong>${formatNumber(floor.share * 100, 2)}%</strong><span>Umlage</span></div>
            </div>`).join('')}
        </div>
      </section>
      <section class="panel" aria-labelledby="cost-overview-title">
        <div class="panel-header"><h2 class="panel-title" id="cost-overview-title">Kosten im Überblick</h2><span class="panel-kicker">pro Jahr</span></div>
        <div class="metric-grid">
          <div class="metric-card"><div class="metric-label">Gesamtkosten</div><div class="metric-value">${formatCurrency(annual)}</div></div>
          <div class="metric-card"><div class="metric-label">Strom</div><div class="metric-value">${formatCurrency(electricity.total)}</div></div>
          <div class="metric-card"><div class="metric-label">Wasser</div><div class="metric-value">${formatCurrency(water.total)}</div></div>
          <div class="metric-card"><div class="metric-label">Weitere Kosten</div><div class="metric-value">${formatCurrency(costs.total)}</div></div>
        </div>
      </section>
    </div>

    <nav class="quick-actions" aria-label="Schnellzugriff">
      <a class="quick-link" href="#strom"><span class="quick-icon" aria-hidden="true">ϟ</span><span><strong>Strom erfassen</strong><small>Stände und Arbeitspreis</small></span></a>
      <a class="quick-link" href="#wasser"><span class="quick-icon" aria-hidden="true">◌</span><span><strong>Wasser erfassen</strong><small>Verbrauch und Grundpreis</small></span></a>
      <a class="quick-link" href="#verteilung"><span class="quick-icon" aria-hidden="true">⇄</span><span><strong>Verteilung ansehen</strong><small>Anteile für EG und OG</small></span></a>
    </nav>`;
}