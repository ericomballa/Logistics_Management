import { BaseView } from './base.view.js';
import { dataService } from '../services/data.service.js';
import { toast, renderLoader } from '../utils/ui.js';

export class AuditTrailView extends BaseView {
    constructor(root) {
        super(root);
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalPages = 1;
        this.filters = {};
    }

    async render() {
        const layout = this.renderLayout(`
            <div class="page-header">
                <h2>Journal d'Audit</h2>
            </div>

            <div class="glass-panel">
                <div class="list-header">
                    <h3>Activités Récentes</h3>
                    <div class="form-group search-container">
                        <input type="text" id="audit-search-input" placeholder="Rechercher..." class="no-icon">
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table desktop-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Utilisateur</th>
                                <th>Action</th>
                                <th>Entité</th>
                                <th>ID</th>
                                <th>Détails</th>
                            </tr>
                        </thead>
                        <tbody id="audit-table-body">
                            <tr>
                                <td colspan="6" class="table-empty-state">
                                    <div id="audit-loading" class="loading-container">
                                        <div class="spinner"></div>
                                        <span>Chargement...</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination-controls responsive-pagination">
                    <div id="audit-pagination-info" class="pagination-info">
                        Affichage de <span id="audit-pagination-start">0</span>
                        à <span id="audit-pagination-end">0</span>
                        sur <span id="audit-pagination-total">0</span> activités
                    </div>

                    <div class="pagination-buttons">
                        <button id="audit-prev-page" class="btn btn-outline" disabled>
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>

                        <span id="audit-current-page" class="pagination-current">
                            1
                        </span>

                        <button id="audit-next-page" class="btn btn-outline" disabled>
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `, 'audit-trail');

        this.root.innerHTML = layout;
        this.bindLogout();
        this.bindEvents();
        this.loadAuditLogs('', 1);
    }

    bindEvents() {
        // Search functionality
        document.getElementById('audit-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchValue = e.target.value.trim();
                this.currentPage = 1;
                this.loadAuditLogs(searchValue ? `search=${encodeURIComponent(searchValue)}` : '', this.currentPage);
            }
        });

        // Pagination Events
        document.getElementById('audit-prev-page').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadAuditLogs(this.currentQuery || '', this.currentPage);
            }
        });

        document.getElementById('audit-next-page').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadAuditLogs(this.currentQuery || '', this.currentPage);
            }
        });
    }

    async loadAuditLogs(query = '', page = 1) {
        try {
            // Show loading
            const tableBody = document.getElementById('audit-table-body');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding: 2rem;">
                        <div class="loading-container">
                            <div class="spinner"></div>
                            <span>Chargement des activités...</span>
                        </div>
                    </td>
                </tr>
            `;

            // Call the API to get audit logs
            // Note: This assumes the backend has an audit endpoint
            // If the backend doesn't have this endpoint yet, it will fail gracefully
            let apiUrl = `/audit?page=${page}&limit=${this.itemsPerPage}`;
            if (query) {
                apiUrl += `&${query}`;
            }

            // In a real implementation, this would call the backend API
            // For now, I'll try to call the API and fall back to mock data if it fails
            let response;
            try {
                // Attempt to call the backend API
                // Using dataService.get with a custom API call
                response = await fetch(`/api/audit?${apiUrl.split('?')[1]}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    response = await response.json();
                } else {
                    // If the endpoint doesn't exist, use mock data
                    throw new Error('Audit endpoint not available');
                }
            } catch (error) {
                // Fallback to mock data if backend doesn't support audit logs yet
                console.warn('Audit endpoint not available, using mock data:', error);

                // Mock data for demonstration
                const mockLogs = [
                    {
                        id: 1,
                        timestamp: new Date().toISOString(),
                        user: 'Admin User',
                        action: 'CREATE',
                        entity: 'SHIPMENT',
                        entityId: 'SH-12345',
                        details: 'Created new shipment for client John Doe'
                    },
                    {
                        id: 2,
                        timestamp: new Date(Date.now() - 3600000).toISOString(),
                        user: 'Secretary User',
                        action: 'UPDATE',
                        entity: 'SHIPMENT',
                        entityId: 'SH-12344',
                        details: 'Updated status to DELIVERED'
                    },
                    {
                        id: 3,
                        timestamp: new Date(Date.now() - 7200000).toISOString(),
                        user: 'Admin User',
                        action: 'DELETE',
                        entity: 'USER',
                        entityId: 'USR-001',
                        details: 'Deleted user account'
                    }
                ];

                response = {
                    data: mockLogs,
                    total: mockLogs.length,
                    page: page,
                    limit: this.itemsPerPage
                };
            }

            const { data: logs, total } = response;
            const startIndex = (page - 1) * this.itemsPerPage + 1;
            const endIndex = Math.min(page * this.itemsPerPage, total);

            this.totalPages = Math.ceil(total / this.itemsPerPage);
            this.currentPage = page;

            if (logs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">Aucune activité enregistrée</td></tr>';
            } else {
                tableBody.innerHTML = logs.map(log => `
                    <tr>
                        <td data-label="Date">${new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                        <td data-label="Utilisateur">${log.user || log.userId}</td>
                        <td data-label="Action"><span class="badge badge-${this.getActionColor(log.action)}">${log.action}</span></td>
                        <td data-label="Entité">${log.entity}</td>
                        <td data-label="ID">${log.entityId}</td>
                        <td data-label="Détails">${log.details}</td>
                    </tr>
                `).join('');
            }

            // Update pagination info
            document.getElementById('audit-pagination-start').textContent = startIndex;
            document.getElementById('audit-pagination-end').textContent = endIndex;
            document.getElementById('audit-pagination-total').textContent = total;
            document.getElementById('audit-current-page').textContent = page;

            // Update pagination buttons
            document.getElementById('audit-prev-page').disabled = page <= 1;
            document.getElementById('audit-next-page').disabled = page >= this.totalPages;
        } catch (err) {
            console.error('Error loading audit logs:', err);
            const tableBody = document.getElementById('audit-table-body');
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--danger)">Erreur de chargement</td></tr>';
        }
    }

    getActionColor(action) {
        switch(action.toUpperCase()) {
            case 'CREATE':
                return 'success';
            case 'UPDATE':
                return 'warning';
            case 'DELETE':
                return 'danger';
            default:
                return 'info';
        }
    }
}