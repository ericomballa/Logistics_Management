import { BaseView } from './base.view.js';
import { state } from '../state.js';
import { dataService } from '../services/data.service.js';
import { toast, formatters } from '../utils/ui.js';

export class ShipmentsView extends BaseView {
    async render() {
        const layout = this.renderLayout(`


<div class="page-header responsive-header">
    <h2>Expéditions</h2>
    <button id="new-shipment-btn" class="btn btn-primary btn-block-mobile">
        <i class="fa-solid fa-plus"></i> Nouvelle Expédition
    </button>
</div>

<div class="glass-panel">
    <div class="list-header">
        <h3>Liste des colis</h3>
        <div class="form-group search-container">
            <input type="text" id="search-input" placeholder="Rechercher..." class="no-icon">
        </div>
    </div>

    <div class="table-responsive">
        <table class="table desktop-table">
            <thead>
                <tr>
                    <th>Suivi</th>
                    <th>Destinataire</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="shipments-table-body">
                <tr>
                    <td colspan="5" class="table-empty-state">
                        Chargement...
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div id="shipments-cards-list" class="shipments-cards-container" style="display: none;">
        <div id="shipments-cards">
            <div class="table-empty-state" id="shipments-loading">
                Chargement...
            </div>
        </div>
    </div>

    <div class="pagination-controls responsive-pagination">
        <div id="pagination-info" class="pagination-info">
            Affichage de <span id="pagination-start">0</span>
            à <span id="pagination-end">0</span>
            sur <span id="pagination-total">0</span> colis
        </div>

        <div class="pagination-buttons">
            <button id="prev-page" class="btn btn-outline" disabled>
                <i class="fa-solid fa-chevron-left"></i>
            </button>

            <span id="current-page" class="pagination-current">
                1
            </span>

            <button id="next-page" class="btn btn-outline" disabled>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    </div>
</div>

            <!-- Create Shipment Modal -->
            <div id="create-modal" class="modal-overlay hidden" style="display:none;">
                <div class="modal-container glass-panel">
                    <div class="modal-header">
                        <h3>Nouvelle Expédition</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="shipment-form">
                        <div class="form-group">
                            <select id="shipment-client-id" class="w-full" style="margin-bottom:1rem;">
                                <option value="">Sélectionner un client...</option>
                            </select>
                        </div>
                        <div class="form-group">
                             <label>Expéditeur (Staff)</label>
                            <select id="senderName" class="w-full" required>
                                <option value="">Chargement...</option>
                            </select>
                        </div>
                        <div class="form-group"><input type="text" id="senderAddress" class="w-full" placeholder="Adresse Exp." required></div>
                        <div class="form-group"><input type="text" id="senderPhone" class="w-full" placeholder="Téléphone Exp."></div>

                        <div class="grid grid-2" style="margin-bottom: 1rem;">
                            <div>
                                 <label>Pays de Départ</label>
                                 <select id="origin" class="w-full" required>
                                     <option value="CHINA" selected>CHINA</option>
                                     <option value="DUBAI">DUBAI</option>
                                     <option value="USA">USA</option>
                                     <option value="TURKEY">TURKEY</option>
                                 </select>
                                 <input type="text" id="originCity" class="w-full no-icon" placeholder="Ville de départ" style="margin-top:0.5rem;">
                            </div>
                            <div>
                                 <label>Pays de Destination</label>
                                 <select id="destination" class="w-full" required>
                                     <option value="CAMEROON">CAMEROON</option>
                                     <option value="GABON">GABON</option>
                                     <option value="CONGO">CONGO</option>
                                     <option value="CHAD">CHAD</option>
                                 </select>
                                 <input type="text" id="destinationCity" class="w-full no-icon" placeholder="Ville de destination" style="margin-top:0.5rem;">
                            </div>
                        </div>
                        <div class="form-group"><input type="text" id="recipientName" class="w-full" placeholder="Destinataire (Nom)" required></div>
                        <div class="form-group"><input type="text" id="recipientPhone" class="w-full" placeholder="Téléphone Dest." required></div>
                        <div class="form-group"><input type="text" id="recipientAddress" class="w-full" placeholder="Adresse Dest." required></div>
                        <div class="grid grid-2" style="margin-bottom: 1rem;">
                             <input type="number" step="0.1" id="weight" class="w-full" placeholder="Poids (kg)" required>
                             <input type="text" id="dimensions" class="w-full" placeholder="Dim (LxWxH)">
                        </div>
                        <div class="form-group">
                            <label>Date estimée</label>
                            <input type="date" id="estimatedDeliveryDate" class="w-full" required>
                        </div>
                        <div class="form-group">
                            <select id="serviceType" class="w-full">
                                <option value="standard">Standard</option>
                                <option value="express">Express</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary w-full">Créer</button>
                    </form>
                </div>
            </div>

            <!-- Status Update Modal -->
            <div id="status-modal" class="modal-overlay hidden" style="display:none;">
                <div class="modal-container glass-panel">
                    <div class="modal-header">
                        <h3>Mettre à jour le statut</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="status-form">
                        <input type="hidden" id="status-shipment-id">
                        <div class="form-group">
                            <label>Nouveau Statut</label>
                            <select id="new-status" class="w-full" required>
                                <option value="PENDING">En attente</option>
                                <option value="IN_TRANSIT">En transit</option>
                                <option value="OUT_FOR_DELIVERY">En cours de livraison</option>
                                <option value="DELIVERED">Livré</option>
                                <option value="CANCELLED">Annulé</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Emplacement actuel</label>
                            <input type="text" id="current-location" class="w-full" placeholder="Ville, Pays">
                        </div>
                        <button type="submit" class="btn btn-primary w-full">Mettre à jour</button>
                    </form>
                </div>
            </div>
`, 'shipments');

        this.root.innerHTML = layout;
        this.bindLogout();
        this.bindEvents();
        this.loadClients();
        this.loadStaff(); // Load staff for sender
        this.setupDetailsModal();
        this.loadShipments('', 1);

        // Add resize event listener to handle layout changes
        window.addEventListener('resize', () => {
            // Reload the current shipment list to adjust for new screen size
            this.loadShipments(this.currentQuery, this.currentPage);
        });
    }

    async loadStaff() {
        try {
            const select = document.getElementById('senderName');
            if (!select) return;
            // Fetch all users and filter
            const res = await dataService.getUsers();
            const users = res.data || res;
            // Filter roles: ADMIN, SUPER_ADMIN, AGENT, SECRETARY
            const staff = users.filter(u => ['ADMIN', 'SUPER_ADMIN', 'AGENT', 'SECRETARY'].includes(u.role));

            select.innerHTML = '<option value="">Sélectionner un expéditeur...</option>' +
                staff.map(u => `<option value="${u.name}">${u.name} (${u.role})</option>`).join('');
        } catch (e) {
            console.error('Staff load error', e);
            const select = document.getElementById('senderName');
            if (select) select.innerHTML = '<option value="">Erreur chargement (Admin required)</option>';
        }
    }

    async loadClients() {
        try {
            const select = document.getElementById('shipment-client-id');
            if (!select) return;

            const res = await dataService.getClients();
            this.clients = res.data || res; // Store clients for auto-fill

            select.innerHTML = '<option value="">Sélectionner un client (Moi-même par défaut)</option>' +
                this.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

            // Auto-fill listener
            select.addEventListener('change', (e) => {
                const clientId = e.target.value;
                if (clientId && this.clients) {
                    const client = this.clients.find(c => c.id === clientId);
                    if (client) {
                        document.getElementById('recipientName').value = client.name || '';
                        document.getElementById('recipientPhone').value = client.phone || '';
                        // Also fill address if available and empty
                        const addressInput = document.getElementById('recipientAddress');
                        if (client.address) addressInput.value = client.address;
                    }
                }
            });
        } catch (e) { console.error('Clients load error', e); }
    }

    currentPage = 1;
    totalPages = 1;
    itemsPerPage = 10;
    currentQuery = '';

    bindEvents() {
        const createModal = document.getElementById('create-modal');
        const openCreateBtn = document.getElementById('new-shipment-btn');
        const closeCreateBtn = createModal.querySelector('.modal-close');

        if (openCreateBtn) openCreateBtn.addEventListener('click', () => createModal.style.display = 'flex');
        if (closeCreateBtn) closeCreateBtn.addEventListener('click', () => createModal.style.display = 'none');

        document.getElementById('shipment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                clientId: document.getElementById('shipment-client-id').value || undefined,
                senderName: document.getElementById('senderName').value,
                senderAddress: document.getElementById('senderAddress').value,
                senderPhone: document.getElementById('senderPhone').value,
                recipientName: document.getElementById('recipientName').value,
                receiverPhone: document.getElementById('recipientPhone').value, // Add receiver phone
                recipientAddress: document.getElementById('recipientAddress').value,
                origin: document.getElementById('origin').value,
                originCity: document.getElementById('originCity').value,
                destination: document.getElementById('destination').value,
                destinationCity: document.getElementById('destinationCity').value,
                weight: Number(document.getElementById('weight').value),
                dimensions: document.getElementById('dimensions').value,
                estimatedDeliveryDate: document.getElementById('estimatedDeliveryDate').value,
                serviceType: document.getElementById('serviceType').value
            };

            try {
                await dataService.createShipment(data);
                toast.success('Expédition créée');
                e.target.reset();
                createModal.style.display = 'none';
                this.loadShipments(this.currentQuery, this.currentPage);
            } catch (err) {
                toast.error(err.message || 'Erreur création');
            }
        });

        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchValue = e.target.value.trim();
                this.currentQuery = searchValue ? `search=${encodeURIComponent(searchValue)}` : '';
                this.currentPage = 1;
                this.loadShipments(this.currentQuery, this.currentPage);
            }
        });

        // Pagination Events
        document.getElementById('prev-page').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadShipments(this.currentQuery, this.currentPage);
            }
        });

        document.getElementById('next-page').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadShipments(this.currentQuery, this.currentPage);
            }
        });

        // Modal Logic
        const modal = document.getElementById('status-modal');
        const showModal = (id) => {
            document.getElementById('status-shipment-id').value = id;
            modal.style.display = 'flex';
        };
        const hideModal = () => modal.style.display = 'none';

        modal.querySelector('.modal-close').addEventListener('click', hideModal);

        document.getElementById('status-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('status-shipment-id').value;
            const status = document.getElementById('new-status').value;
            const location = document.getElementById('current-location').value;

            try {
                await dataService.updateShipment(id, { status, currentLocation: location });
                toast.success('Statut mis à jour');
                hideModal();
                this.loadShipments(this.currentQuery, this.currentPage);
            } catch (err) {
                toast.error('Erreur mise à jour');
            }
        });

        // Event delegation for both table and card views
        document.addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            if (btn.classList.contains('delete-btn')) {
                const id = btn.dataset.id;
                if (confirm('Supprimer ?')) {
                    try {
                        await dataService.deleteShipment(id);
                        toast.success('Supprimé');
                        this.loadShipments(this.currentQuery, this.currentPage);
                    } catch (err) { toast.error('Erreur supression'); }
                }
            } else if (btn.classList.contains('copy-btn')) {
                const txt = btn.dataset.text;
                navigator.clipboard.writeText(txt);
                toast.show('Copié !');
            } else if (btn.classList.contains('edit-status-btn')) {
                const id = btn.dataset.id;
                document.getElementById('status-shipment-id').value = id;
                document.getElementById('status-modal').style.display = 'flex';
            } else if (btn.classList.contains('view-btn')) {
                const id = btn.dataset.id;
                try {
                    const shipment = await dataService.getShipment(id);
                    this.showDetails(JSON.parse(JSON.stringify(shipment.data || shipment)));
                } catch (err) {
                    console.error(err);
                    toast.error('Erreur chargement détails');
                }
            }
        });
    }

    async loadShipments(query = '', page = 1) {
        try {
            const res = await dataService.getShipments(query, page, this.itemsPerPage);
            const { data: list, total, page: currentPage, limit } = res;

            this.totalPages = Math.ceil(total / this.itemsPerPage);
            this.currentPage = currentPage;

            const startIndex = (currentPage - 1) * this.itemsPerPage + 1;
            const endIndex = Math.min(currentPage * this.itemsPerPage, total);

            this.renderShipmentsList(list, null); // Pass null since we handle both containers internally

            // Update pagination info
            document.getElementById('pagination-start').textContent = startIndex;
            document.getElementById('pagination-end').textContent = endIndex;
            document.getElementById('pagination-total').textContent = total;
            document.getElementById('current-page').textContent = currentPage;

            // Update pagination buttons
            document.getElementById('prev-page').disabled = currentPage <= 1;
            document.getElementById('next-page').disabled = currentPage >= this.totalPages;
        } catch (err) {
            console.error(err);
        }
    }

    renderShipmentsList(list, tbody) {
        // Check screen size to determine which view to render
        const isMobile = window.innerWidth <= 768;
        const tableContainer = document.getElementById('shipments-table-body');
        const cardContainer = document.getElementById('shipments-cards');

        if (isMobile) {
            // Render as cards for mobile
            if (list.length === 0) {
                cardContainer.innerHTML = '<div class="table-empty-state">Aucune expédition</div>';
            } else {
                cardContainer.innerHTML = list.map(item => `
                    <div class="shipment-card">
                        <div class="shipment-card-header">
                            <h3 class="shipment-card-title">
                                <span class="shipment-tracking">${item.trackingNumber}</span>
                                <span class="shipment-status"><span class="badge badge-info">${item.status}</span></span>
                            </h3>
                        </div>
                        <div class="shipment-card-body">
                            <div class="shipment-details">
                                <div class="detail-row">
                                    <span class="detail-label">Destinataire:</span>
                                    <span class="detail-value">${item.recipientName || item.receiverName}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Date:</span>
                                    <span class="detail-value">${formatters.date(item.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="shipment-card-footer">
                            <div class="detail-actions">
                                <button class="btn-icon view-btn" data-id="${item.id}" title="Voir détails"><i class="fa-solid fa-eye"></i></button>
                                <button class="btn-icon edit-status-btn" data-id="${item.id}" title="Changer statut"><i class="fa-solid fa-rotate"></i></button>
                                <button class="btn-icon copy-btn" data-text="${item.trackingNumber}"><i class="fa-regular fa-copy"></i></button>
                                ${!state.isSecretary ? `<button class="btn-icon delete-btn" data-id="${item.id}" style="color:var(--danger)" title="Supprimer"><i class="fa-solid fa-trash"></i></button>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            // Render as table for desktop
            if (list.length === 0) {
                tableContainer.innerHTML = '<tr><td colspan="5" style="text-align:center">Aucune expédition</td></tr>';
            } else {
                tableContainer.innerHTML = list.map(item => `
                    <tr>
                        <td data-label="Suivi" style="font-weight:600; font-family:monospace;">${item.trackingNumber}</td>
                        <td data-label="Destinataire">${item.recipientName || item.receiverName}</td>
                        <td data-label="Date">${formatters.date(item.createdAt)}</td>
                        <td data-label="Statut"><span class="badge badge-info">${item.status}</span></td>
                        <td data-label="Actions">
                            <button class="btn-icon view-btn" data-id="${item.id}" title="Voir détails"><i class="fa-solid fa-eye"></i></button>
                            <button class="btn-icon edit-status-btn" data-id="${item.id}" title="Changer statut"><i class="fa-solid fa-rotate"></i></button>
                            <button class="btn-icon copy-btn" data-text="${item.trackingNumber}"><i class="fa-regular fa-copy"></i></button>
                            ${!state.isSecretary ? `<button class="btn-icon delete-btn" data-id="${item.id}" style="color:var(--danger)" title="Supprimer"><i class="fa-solid fa-trash"></i></button>` : ''}
                        </td>
                    </tr>
                `).join('');
            }
        }
    }

    setupDetailsModal() {
        if (document.getElementById('details-modal')) return; // Avoid duplicates

        const modalHtml = `
            <div id="details-modal" class="modal-overlay hidden" style="display:none;">
                <div class="modal-container glass-panel" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>Détails Expédition</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div id="details-content" class="grid grid-2" style="padding: 1rem 0;">
                        <!-- Content populated by JS -->
                    </div>
                    <div id="assignment-section" style="border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 1rem;">
                        <!-- Assignment UI populated by JS -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('details-modal');
        const hideModal = () => modal.style.display = 'none';
        modal.querySelector('.modal-close').addEventListener('click', hideModal);
    }

    showDetails(shipment) {
        const modal = document.getElementById('details-modal');
        const content = document.getElementById('details-content');
        content.innerHTML = `
            <div class="col-span-2 border-b pb-4 mb-4">
                <h2 class="text-primary m-0 font-mono">${shipment.trackingNumber}</h2>
                <span class="badge badge-info">${shipment.status}</span>
            </div>

            <div>
                <h4 style="color:var(--text-light)">Expéditeur</h4>
                <p><strong>${shipment.senderName}</strong></p>
                <p>${shipment.senderAddress || '-'}</p>
                <p>${shipment.senderPhone || '-'}</p>
            </div>

            <div>
                <h4 style="color:var(--text-light)">Destinataire</h4>
                <p><strong>${shipment.receiverName || shipment.recipientName}</strong></p>
                <p>${shipment.receiverAddress || shipment.recipientAddress || '-'}</p>
                <p>${shipment.receiverPhone || '-'}</p>
            </div>

            <div style="grid-column: span 1 / -1; margin-top:1rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:1rem;">
                <h4 style="color:var(--text-light)">Info Colis</h4>
                <div class="grid grid-3">
                    <div><small>Poids</small><br><strong>${shipment.weight} kg</strong></div>
                    <div><small>Dimensions</small><br><strong>${shipment.dimensions || '-'}</strong></div>
                    <div><small>Colis</small><br><strong>${shipment.numberOfPackages || 1}</strong></div>
                    <div><small>Départ</small><br><strong>${shipment.originCity || '-'} (${shipment.origin})</strong></div>
                    <div><small>Arrivée</small><br><strong>${shipment.destinationCity || shipment.receiverCity || '-'} (${shipment.destination})</strong></div>
                    <div><small>Type</small><br><strong>${shipment.serviceType || 'Standard'}</strong></div>
                </div>
            </div>
            
            <div style="grid-column: span 1 / -1; margin-top:1rem;">
                ${shipment.estimatedDeliveryDate ? `<br><small style="color:var(--text-light)">Livraison estimée: ${formatters.date(shipment.estimatedDeliveryDate)}</small>` : ''}
            </div>
        `;

        // Assignment Section
        const assignSection = document.getElementById('assignment-section');
        if (state.isAdmin || state.isSecretary) {
            assignSection.style.display = 'block';
            this.renderAssignmentUI(shipment, assignSection);
        } else {
            assignSection.style.display = 'none';
        }

        modal.style.display = 'flex';
    }

    async renderAssignmentUI(shipment, container) {
        container.innerHTML = `
            <h4 style="margin-bottom:0.5rem; color:var(--text-light)">Assigner à un Agent pour Livraison</h4>
            <div style="display:flex; gap:0.5rem; flex-direction:column;">
                <select id="assign-agent-select" class="w-full input">
                    <option value="">Sélectionner un agent...</option>
                </select>
                <button id="assign-agent-btn" class="btn btn-primary w-full" data-id="${shipment.id}">Assigner</button>
            </div>
        `;

        try {
            const res = await dataService.getUsers();
            const users = res.data || res;
            const agents = users.filter(u => u.role === 'AGENT');
            const select = document.getElementById('assign-agent-select');

            agents.forEach(agent => {
                const opt = document.createElement('option');
                opt.value = agent.id;
                opt.textContent = `${agent.name} (${agent.phone || 'Pas de tel'})`;
                if (shipment.agentId === agent.id) opt.selected = true;
                select.appendChild(opt);
            });

            document.getElementById('assign-agent-btn').addEventListener('click', async (e) => {
                const agentId = select.value;
                if (!agentId) return alert('Sélectionnez un agent');

                try {
                    e.target.disabled = true;
                    await dataService.assignAgent(shipment.id, agentId);
                    toast.success('Agent assigné avec succès');
                    this.loadShipments();
                } catch (err) {
                    toast.error('Erreur lors de l\'assignation');
                } finally {
                    e.target.disabled = false;
                }
            });
        } catch (e) {
            console.error('Error loading agents for assignment', e);
        }
    }
}
