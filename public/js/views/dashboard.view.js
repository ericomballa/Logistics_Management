import { BaseView } from './base.view.js';
import { dataService } from '../services/data.service.js';
import { renderLoader } from '../utils/ui.js';

export class DashboardView extends BaseView {
    async render() {
        const layout = this.renderLayout(`
            <div class="page-header">
                <div>
                    <h2>Tableau de bord</h2>
                    <p style="color:var(--text-muted)" id="current-date">Aujourd'hui</p>
                </div>
            </div>

            <div id="stats-container" class="stats-grid" style="margin-bottom:2rem;">
                ${renderLoader()}
            </div>

            <div class="glass-panel">
                <h3 style="margin-bottom:1rem;"><i class="fa-solid fa-bolt"></i> Actions rapides</h3>
                <div class="flex-wrap gap-1" style="display:flex;">
                    <a href="#shipments" class="btn btn-secondary">
                        <i class="fa-solid fa-plus"></i> Nouvelle Expédition
                    </a>
                    <a href="#tracking" class="btn btn-secondary">
                        <i class="fa-solid fa-magnifying-glass"></i> Suivre un colis
                    </a>
                </div>
            </div>
        `, 'dashboard');

        this.root.innerHTML = layout;
        this.bindLogout();
        this.loadStats();

        // Date
        const dateEl = document.getElementById('current-date');
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    async loadStats() {
        try {
            const stats = await dataService.getShipmentStats();
            const container = document.getElementById('stats-container');

            container.innerHTML = `
                <div class="glass-panel" style="display:flex; align-items:center; gap:1rem;">
                    <div class="stats-icon" style="background:rgba(99,102,241,0.2); color:var(--primary);">
                        <i class="fa-solid fa-box"></i>
                    </div>
                    <div>
                        <div style="font-size:2rem; font-weight:700;">${stats.total || 0}</div>
                        <div style="color:var(--text-muted); font-size:0.9rem;">Total Expéditions</div>
                    </div>
                </div>
                
                <div class="glass-panel" style="display:flex; align-items:center; gap:1rem;">
                    <div class="stats-icon" style="background:rgba(236,72,153,0.2); color:var(--secondary);">
                        <i class="fa-solid fa-truck-fast"></i>
                    </div>
                    <div>
                        <div style="font-size:2rem; font-weight:700;">${stats.inTransit || 0}</div>
                        <div style="color:var(--text-muted); font-size:0.9rem;">En Transit</div>
                    </div>
                </div>

                <div class="glass-panel" style="display:flex; align-items:center; gap:1rem;">
                    <div class="stats-icon" style="background:rgba(16,185,129,0.2); color:var(--success);">
                        <i class="fa-solid fa-check-circle"></i>
                    </div>
                    <div>
                        <div style="font-size:2rem; font-weight:700;">${stats.delivered || 0}</div>
                        <div style="color:var(--text-muted); font-size:0.9rem;">Livrées</div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Stats error', err);
        }
    }
}
