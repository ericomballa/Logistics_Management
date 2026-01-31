import { BaseView } from './base.view.js';
import { reportsService } from '../services/reports.service.js';
import { renderLoader } from '../utils/ui.js';

export class ReportsView extends BaseView {
    constructor(root) {
        super(root);
        this.charts = {};
    }

    async render() {
        const layout = this.renderLayout(`
            <div class="page-header">
                <div>
                    <h2><i class="fa-solid fa-chart-line"></i> Rapports et Statistiques</h2>
                    <p style="color:var(--text-muted)">Analyse détaillée de vos opérations</p>
                </div>
            </div>

            <!-- Dashboard Stats -->
            <div id="dashboard-stats" class="stats-grid" style="margin-bottom:2rem;">
                ${renderLoader()}
            </div>

            <!-- Charts Section -->
            <div class="stats-grid" style="margin-bottom:2rem;">
                <!-- Shipments by Status Chart -->
                <div class="glass-panel">
                    <h3 style="margin-bottom:1rem;"><i class="fa-solid fa-chart-pie"></i> Expéditions par Statut</h3>
                    <div id="status-chart-container" style="position:relative; height:300px;">
                        ${renderLoader()}
                    </div>
                </div>

                <!-- Shipments by Origin Chart -->
                <div class="glass-panel">
                    <h3 style="margin-bottom:1rem;"><i class="fa-solid fa-chart-bar"></i> Expéditions par Origine</h3>
                    <div id="origin-chart-container" style="position:relative; height:300px;">
                        ${renderLoader()}
                    </div>
                </div>
            </div>

            <!-- Revenue Report -->
            <div class="glass-panel" style="margin-bottom:2rem;">
                <h3 style="margin-bottom:1rem;"><i class="fa-solid fa-money-bill-trend-up"></i> Rapport de Revenus</h3>
                
                <div style="display:flex; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; align-items: flex-end;">
                    <div style="flex:1; min-width:200px;">
                        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Date de début</label>
                        <input type="date" id="revenue-start-date" class="input no-icon" style="width:100%;">
                    </div>
                    <div style="flex:1; min-width:200px;">
                        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Date de fin</label>
                        <input type="date" id="revenue-end-date" class="input no-icon" style="width:100%;">
                    </div>
                    <button id="load-revenue-btn" class="btn btn-primary" style="height: 48px;">
                        <i class="fa-solid fa-search"></i> Charger
                    </button>
                </div>

                <div id="revenue-data" style="display:none;">
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
                        <div style="padding:1rem; background:rgba(99,102,241,0.1); border-radius:12px; border:1px solid rgba(99,102,241,0.3);">
                            <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">Total Factures</div>
                            <div id="revenue-total-invoices" style="font-size:1.5rem; font-weight:700; color:var(--primary);">-</div>
                        </div>
                        <div style="padding:1rem; background:rgba(16,185,129,0.1); border-radius:12px; border:1px solid rgba(16,185,129,0.3);">
                            <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">Montant Total</div>
                            <div id="revenue-total-amount" style="font-size:1.5rem; font-weight:700; color:var(--success);">-</div>
                        </div>
                        <div style="padding:1rem; background:rgba(16,185,129,0.1); border-radius:12px; border:1px solid rgba(16,185,129,0.3);">
                            <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">Montant Payé</div>
                            <div id="revenue-paid-amount" style="font-size:1.5rem; font-weight:700; color:var(--success);">-</div>
                        </div>
                        <div style="padding:1rem; background:rgba(245,158,11,0.1); border-radius:12px; border:1px solid rgba(245,158,11,0.3);">
                            <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">Montant En Attente</div>
                            <div id="revenue-pending-amount" style="font-size:1.5rem; font-weight:700; color:var(--warning);">-</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Daily Revenue Report -->
            <div class="glass-panel" style="margin-bottom:2rem;">
                <h3 style="margin-bottom:1rem;"><i class="fa-solid fa-calendar-day"></i> Revenus Journaliers</h3>

                <div style="display:flex; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; align-items: flex-end;">
                    <div style="flex:1; min-width:200px;">
                        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Sélectionner une date</label>
                        <input type="date" id="daily-revenue-date" class="input no-icon w-full">
                    </div>
                    <button id="load-daily-revenue-btn" class="btn btn-primary" style="height: 48px;">
                        <i class="fa-solid fa-search"></i> Charger
                    </button>
                </div>

                <div id="daily-revenue-data" style="display:none;">
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
                        <div style="padding:1rem; background:rgba(99,102,241,0.1); border-radius:12px; border:1px solid rgba(99,102,241,0.3);">
                            <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">Total Factures</div>
                            <div id="daily-revenue-total-invoices" style="font-size:1.5rem; font-weight:700; color:var(--primary);">-</div>
                        </div>
                        <div style="padding:1rem; background:rgba(16,185,129,0.1); border-radius:12px; border:1px solid rgba(16,185,129,0.3);">
                            <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">Montant Total</div>
                            <div id="daily-revenue-total-amount" style="font-size:1.5rem; font-weight:700; color:var(--success);">-</div>
                        </div>
                        <div style="padding:1rem; background:rgba(16,185,129,0.1); border-radius:12px; border:1px solid rgba(16,185,129,0.3);">
                            <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">Montant Payé</div>
                            <div id="daily-revenue-paid-amount" style="font-size:1.5rem; font-weight:700; color:var(--success);">-</div>
                        </div>
                        <div style="padding:1rem; background:rgba(245,158,11,0.1); border-radius:12px; border:1px solid rgba(245,158,11,0.3);">
                            <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.5rem;">Montant En Attente</div>
                            <div id="daily-revenue-pending-amount" style="font-size:1.5rem; font-weight:700; color:var(--warning);">-</div>
                        </div>
                    </div>

                    <!-- Revenue by Status -->
                    <div style="margin-top:1.5rem;">
                        <h4 style="margin-bottom:1rem; color:var(--text-light);">Répartition par Statut</h4>
                        <div id="daily-revenue-by-status" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:1rem;">
                            <!-- Status breakdown will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Average Delivery Time -->
            <div class="glass-panel">
                <h3 style="margin-bottom:1rem;"><i class="fa-solid fa-clock"></i> Temps de Livraison Moyen</h3>
                <div id="delivery-time-container">
                    ${renderLoader()}
                </div>
            </div>
        `, 'reports');

        this.root.innerHTML = layout;
        this.bindLogout();

        // Load all data
        await this.loadDashboardStats();
        await this.loadShipmentsByStatus();
        await this.loadShipmentsByOrigin();
        await this.loadAverageDeliveryTime();

        // Bind revenue report button
        this.bindRevenueReport();

        // Bind daily revenue report button
        this.bindDailyRevenueReport();

        // Set default dates (last 30 days)
        this.setDefaultDates();

        // Set today's date as default for daily revenue
        this.setTodayAsDefaultDailyRevenueDate();
    }

    async loadDashboardStats() {
        try {
            const stats = await reportsService.getDashboardStats();
            const container = document.getElementById('dashboard-stats');

            container.innerHTML = `
                <div class="glass-panel" style="display:flex; align-items:center; gap:1rem;">
                    <div style="background:rgba(99,102,241,0.2); width:60px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:12px; color:var(--primary); font-size:1.8rem;">
                        <i class="fa-solid fa-box"></i>
                    </div>
                    <div>
                        <div style="font-size:2.2rem; font-weight:700;">${stats.shipments?.total || 0}</div>
                        <div style="color:var(--text-muted); font-size:0.9rem;">Total Expéditions</div>
                    </div>
                </div>
                
                <div class="glass-panel" style="display:flex; align-items:center; gap:1rem;">
                    <div style="background:rgba(245,158,11,0.2); width:60px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:12px; color:var(--warning); font-size:1.8rem;">
                        <i class="fa-solid fa-hourglass-half"></i>
                    </div>
                    <div>
                        <div style="font-size:2.2rem; font-weight:700;">${stats.shipments?.pending || 0}</div>
                        <div style="color:var(--text-muted); font-size:0.9rem;">En Attente</div>
                    </div>
                </div>

                <div class="glass-panel" style="display:flex; align-items:center; gap:1rem;">
                    <div style="background:rgba(236,72,153,0.2); width:60px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:12px; color:var(--secondary); font-size:1.8rem;">
                        <i class="fa-solid fa-truck-fast"></i>
                    </div>
                    <div>
                        <div style="font-size:2.2rem; font-weight:700;">${stats.shipments?.inTransit || 0}</div>
                        <div style="color:var(--text-muted); font-size:0.9rem;">En Transit</div>
                    </div>
                </div>

                <div class="glass-panel" style="display:flex; align-items:center; gap:1rem;">
                    <div style="background:rgba(16,185,129,0.2); width:60px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:12px; color:var(--success); font-size:1.8rem;">
                        <i class="fa-solid fa-check-circle"></i>
                    </div>
                    <div>
                        <div style="font-size:2.2rem; font-weight:700;">${stats.shipments?.delivered || 0}</div>
                        <div style="color:var(--text-muted); font-size:0.9rem;">Livrées</div>
                    </div>
                </div>

                <div class="glass-panel" style="display:flex; align-items:center; gap:1rem;">
                    <div style="background:rgba(16,185,129,0.2); width:60px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:12px; color:var(--success); font-size:1.8rem;">
                        <i class="fa-solid fa-dollar-sign"></i>
                    </div>
                    <div>
                        <div style="font-size:2.2rem; font-weight:700;">${this.formatCurrency(stats.revenue?.total || 0)}</div>
                        <div style="color:var(--text-muted); font-size:0.9rem;">Revenu Total</div>
                    </div>
                </div>

                <div class="glass-panel" style="display:flex; align-items:center; gap:1rem;">
                    <div style="background:rgba(16,185,129,0.2); width:60px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:12px; color:var(--success); font-size:1.8rem;">
                        <i class="fa-solid fa-money-bill-wave"></i>
                    </div>
                    <div>
                        <div style="font-size:2.2rem; font-weight:700;">${this.formatCurrency(stats.revenue?.paid || 0)}</div>
                        <div style="color:var(--text-muted); font-size:0.9rem;">Revenu Payé</div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Error loading dashboard stats:', err);
            document.getElementById('dashboard-stats').innerHTML = '<p class="text-center" style="color:var(--error);">Erreur de chargement des statistiques</p>';
        }
    }

    async loadShipmentsByStatus() {
        try {
            // Wait for Chart.js to be available
            await this.waitForChart();

            const data = await reportsService.getShipmentsByStatus();
            const container = document.getElementById('status-chart-container');

            // Create canvas
            container.innerHTML = '<canvas id="status-chart"></canvas>';
            const canvas = document.getElementById('status-chart');

            // Status labels in French
            const statusLabels = {
                'PENDING': 'En Attente',
                'IN_TRANSIT': 'En Transit',
                'DELIVERED': 'Livrée',
                'CANCELLED': 'Annulée',
                'RETURNED': 'Retournée'
            };

            const labels = data.map(item => statusLabels[item.status] || item.status);
            const values = data.map(item => item.count);

            // Colors for different statuses
            const colors = [
                'rgba(245, 158, 11, 0.8)',  // Warning - Pending
                'rgba(236, 72, 153, 0.8)',  // Secondary - In Transit
                'rgba(16, 185, 129, 0.8)',  // Success - Delivered
                'rgba(239, 68, 68, 0.8)',   // Error - Cancelled
                'rgba(107, 114, 128, 0.8)'  // Gray - Returned
            ];

            this.charts.statusChart = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#e5e7eb',
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Error loading shipments by status:', err);
            document.getElementById('status-chart-container').innerHTML = '<p class="text-center" style="color:var(--error);">Erreur de chargement</p>';
        }
    }

    async loadShipmentsByOrigin() {
        try {
            // Wait for Chart.js to be available
            await this.waitForChart();

            const data = await reportsService.getShipmentsByOrigin();
            const container = document.getElementById('origin-chart-container');

            // Create canvas
            container.innerHTML = '<canvas id="origin-chart"></canvas>';
            const canvas = document.getElementById('origin-chart');

            const labels = data.map(item => item.origin || 'Non spécifié');
            const values = data.map(item => item.count);

            this.charts.originChart = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Nombre d\'expéditions',
                        data: values,
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#e5e7eb',
                                stepSize: 1
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#e5e7eb'
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Error loading shipments by origin:', err);
            document.getElementById('origin-chart-container').innerHTML = '<p class="text-center" style="color:var(--error);">Erreur de chargement</p>';
        }
    }

    async loadAverageDeliveryTime() {
        try {
            const data = await reportsService.getAverageDeliveryTime();
            const container = document.getElementById('delivery-time-container');

            container.innerHTML = `
                <div style="display:flex; align-items:center; gap:2rem; flex-wrap:wrap;">
                    <div style="flex:1; min-width:200px; text-align:center; padding:2rem; background:rgba(99,102,241,0.1); border-radius:12px; border:2px solid rgba(99,102,241,0.3);">
                        <div style="font-size:3rem; font-weight:800; color:var(--primary); margin-bottom:0.5rem;">
                            ${data.averageDays || 0}
                        </div>
                        <div style="font-size:1.1rem; color:var(--text-muted);">Jours en moyenne</div>
                    </div>
                    <div style="flex:1; min-width:200px; text-align:center; padding:2rem; background:rgba(16,185,129,0.1); border-radius:12px; border:2px solid rgba(16,185,129,0.3);">
                        <div style="font-size:3rem; font-weight:800; color:var(--success); margin-bottom:0.5rem;">
                            ${data.totalShipments || 0}
                        </div>
                        <div style="font-size:1.1rem; color:var(--text-muted);">Expéditions livrées</div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Error loading average delivery time:', err);
            document.getElementById('delivery-time-container').innerHTML = '<p class="text-center" style="color:var(--error);">Erreur de chargement</p>';
        }
    }

    bindRevenueReport() {
        const btn = document.getElementById('load-revenue-btn');
        if (btn) {
            btn.addEventListener('click', async () => {
                const startDate = document.getElementById('revenue-start-date').value;
                const endDate = document.getElementById('revenue-end-date').value;

                if (!startDate || !endDate) {
                    alert('Veuillez sélectionner les deux dates');
                    return;
                }

                try {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Chargement...';

                    const data = await reportsService.getRevenue(startDate, endDate);

                    document.getElementById('revenue-total-invoices').textContent = data.totalInvoices || 0;
                    document.getElementById('revenue-total-amount').textContent = this.formatCurrency(data.totalAmount || 0);
                    document.getElementById('revenue-paid-amount').textContent = this.formatCurrency(data.paidAmount || 0);
                    document.getElementById('revenue-pending-amount').textContent = this.formatCurrency(data.pendingAmount || 0);

                    document.getElementById('revenue-data').style.display = 'block';
                } catch (err) {
                    console.error('Error loading revenue:', err);
                    alert('Erreur lors du chargement du rapport de revenus');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-search"></i> Charger';
                }
            });
        }
    }

    bindDailyRevenueReport() {
        const btn = document.getElementById('load-daily-revenue-btn');
        if (btn) {
            btn.addEventListener('click', async () => {
                const date = document.getElementById('daily-revenue-date').value;

                if (!date) {
                    alert('Veuillez sélectionner une date');
                    return;
                }

                try {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Chargement...';

                    const data = await reportsService.getDailyRevenue(date);

                    document.getElementById('daily-revenue-total-invoices').textContent = data.totalInvoices || 0;
                    document.getElementById('daily-revenue-total-amount').textContent = this.formatCurrency(data.totalAmount || 0);
                    document.getElementById('daily-revenue-paid-amount').textContent = this.formatCurrency(data.paidAmount || 0);
                    document.getElementById('daily-revenue-pending-amount').textContent = this.formatCurrency(data.pendingAmount || 0);

                    // Populate revenue by status
                    this.populateDailyRevenueByStatus(data.byStatus);

                    document.getElementById('daily-revenue-data').style.display = 'block';
                } catch (err) {
                    console.error('Error loading daily revenue:', err);
                    alert('Erreur lors du chargement du rapport de revenus journaliers');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-search"></i> Charger';
                }
            });
        }
    }

    populateDailyRevenueByStatus(byStatusData) {
        const container = document.getElementById('daily-revenue-by-status');
        if (!byStatusData || byStatusData.length === 0) {
            container.innerHTML = '<p>Aucune donnée disponible</p>';
            return;
        }

        // Status labels in French
        const statusLabels = {
            'PENDING': 'En Attente',
            'PARTIAL': 'Partiel',
            'PAID': 'Payé',
            'CANCELLED': 'Annulé',
            'OVERDUE': 'En Retard'
        };

        container.innerHTML = byStatusData.map(item => {
            // Determine color based on status
            let colorClass = 'primary';
            if (item.status === 'PAID') colorClass = 'success';
            else if (item.status === 'PENDING' || item.status === 'PARTIAL') colorClass = 'warning';
            else if (item.status === 'CANCELLED') colorClass = 'danger';

            return `
                <div class="glass-panel" style="padding:1rem; border-left:4px solid var(--${colorClass});">
                    <div style="font-weight:600; color:var(--${colorClass}); margin-bottom:0.5rem;">${statusLabels[item.status] || item.status}</div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                        <span>Factures:</span>
                        <strong>${item.count}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                        <span>Total:</span>
                        <strong>${this.formatCurrency(item.total)}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span>Payé:</span>
                        <strong>${this.formatCurrency(item.paid)}</strong>
                    </div>
                </div>
            `;
        }).join('');
    }

    setTodayAsDefaultDailyRevenueDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('daily-revenue-date');
        if (dateInput) dateInput.value = today;
    }

    setDefaultDates() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const endInput = document.getElementById('revenue-end-date');
        const startInput = document.getElementById('revenue-start-date');

        if (endInput) endInput.value = endDate.toISOString().split('T')[0];
        if (startInput) startInput.value = startDate.toISOString().split('T')[0];
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XAF'
        }).format(amount);
    }

    async waitForChart() {
        // Wait for Chart.js to be available
        return new Promise((resolve) => {
            if (typeof Chart !== 'undefined') {
                resolve();
            } else {
                const checkChart = setInterval(() => {
                    if (typeof Chart !== 'undefined') {
                        clearInterval(checkChart);
                        resolve();
                    }
                }, 100);

                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkChart);
                    resolve();
                }, 5000);
            }
        });
    }
}
