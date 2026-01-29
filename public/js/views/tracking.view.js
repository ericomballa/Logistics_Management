import { BaseView } from './base.view.js';
import { dataService } from '../services/data.service.js';
import { toast, formatters } from '../utils/ui.js';

export class TrackingView extends BaseView {
    async render() {
        // Can be used logged in or out, so handle layout dynamically?
        // For simplicity, we use BaseView layout which checks auth.
        // If we wanted public tracking, we'd need a separate PublicBaseView or condition.

        const layout = this.renderLayout(`
            <div class="page-header">
                <h2>Suivi de Colis</h2>
            </div>
            
            <div class="glass-panel" style="max-width:600px; margin:0 auto; text-align:center;">
                <h3 style="margin-bottom:1rem;">Entrez votre numéro de suivi</h3>
                <div style="display:flex; gap:0.5rem; margin-bottom:2rem;">
                    <input type="text" id="track-input" placeholder="ex: TRK-12345678" style="flex:1">
                    <button id="track-btn" class="btn btn-primary"><i class="fa-solid fa-search"></i></button>
                </div>

                <div id="track-result" class="hidden" style="text-align:left; border-top:1px solid var(--border); padding-top:1.5rem;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                        <div>
                            <span style="color:var(--text-muted); font-size:0.9rem;">Numéro</span>
                            <div style="font-size:1.2rem; font-weight:bold;" id="res-number"></div>
                        </div>
                        <div style="text-align:right;">
                            <span style="color:var(--text-muted); font-size:0.9rem;">Status</span>
                            <div><span class="badge badge-info" id="res-status"></span></div>
                        </div>
                    </div>
                </div>
            </div>
        `, 'tracking');

        this.root.innerHTML = layout;
        if (this.root.querySelector('#logout-btn')) this.bindLogout();

        document.getElementById('track-btn').addEventListener('click', () => this.track());
    }

    async track() {
        const num = document.getElementById('track-input').value;
        if (!num) return;

        try {
            const shipment = await dataService.trackShipment(num);
            const container = document.getElementById('track-result');
            container.classList.remove('hidden');

            document.getElementById('res-number').textContent = shipment.trackingNumber;
            document.getElementById('res-status').textContent = shipment.status;

            // Fetch timeline
            try {
                const timelineData = await dataService.getShipmentTimeline(shipment.id);
                const events = timelineData.timeline || [];

                const timelineHtml = `
                    <div style="margin-top:2rem; border-left:2px solid var(--border); padding-left:1.5rem; position:relative;">
                        ${events.map(e => `
                            <div style="margin-bottom:1.5rem; position:relative;">
                                <div style="position:absolute; left:-1.9rem; top:0.2rem; width:12px; height:12px; border-radius:50%; background:${e.status === shipment.status ? 'var(--primary)' : 'var(--text-muted)'};"></div>
                                <div style="font-weight:bold; color:${e.status === shipment.status ? 'var(--primary)' : 'var(--text-light)'}">${e.status}</div>
                                <div style="font-size:0.9rem; margin-top:0.2rem;">${e.description}</div>
                                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
                                    ${e.location ? `${e.location}, ` : ''} ${e.country}<br>
                                    ${formatters.date(e.timestamp)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;

                const existingTimeline = document.getElementById('timeline-container');
                if (existingTimeline) existingTimeline.remove();

                container.insertAdjacentHTML('beforeend', `<div id="timeline-container">${timelineHtml}</div>`);

            } catch (evtErr) {
                console.error('Timeline error', evtErr);
            }

        } catch (err) {
            toast.error('Expédition introuvable');
            document.getElementById('track-result').classList.add('hidden');
        }
    }
}
