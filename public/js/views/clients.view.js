import { BaseView } from './base.view.js';
import { dataService } from '../services/data.service.js';
import { toast, formatters } from '../utils/ui.js';

export class ClientsView extends BaseView {
    async render() {
        const layout = this.renderLayout(`
            <div class="page-header">
                <h2>Gestion des Clients</h2>
                <button class="btn btn-primary" id="btn-new-client"><i class="fa-solid fa-plus"></i> Nouveau Client</button>
            </div>

            <div class="glass-panel">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Téléphone</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="clients-table">
                            <tr><td colspan="5" style="text-align:center">Chargement...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Create Client Modal -->
            <div id="client-modal" class="modal-overlay hidden" style="display:none;">
                <div class="modal-container glass-panel">
                    <div class="modal-header">
                        <h3>Nouveau Client</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="client-form">
                        <div class="form-group">
                            <label>Nom complet</label>
                            <input type="text" id="clientName" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="clientEmail" required>
                        </div>
                        <div class="form-group">
                            <label>Téléphone</label>
                            <input type="text" id="clientPhone">
                        </div>
                        <!-- Default password for simplicity in this demo, or auto-generate -->
                        <div class="form-group">
                            <label>Mot de passe par défaut</label>
                            <input type="text" value="Client@123" readonly disabled style="opacity:0.7">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%">Créer</button>
                    </form>
                </div>
            </div>
        `, 'clients');

        this.root.innerHTML = layout;
        this.bindEvents();
        this.loadClients();
    }

    bindEvents() {
        const modal = document.getElementById('client-modal');
        const btnNew = document.getElementById('btn-new-client');
        const btnClose = modal.querySelector('.modal-close');

        if (btnNew) btnNew.addEventListener('click', () => modal.style.display = 'flex');
        if (btnClose) btnClose.addEventListener('click', () => modal.style.display = 'none');

        document.getElementById('client-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('clientName').value,
                email: document.getElementById('clientEmail').value,
                phone: document.getElementById('clientPhone').value,
                password: 'Client@123', // Hardcoded for demo/simplicity as requested
                role: 'CLIENT',
                isActive: true
            };

            try {
                await dataService.createUser(data);
                toast.success('Client créé');
                modal.style.display = 'none';
                e.target.reset();
                this.loadClients();
            } catch (err) {
                toast.error(err.message || 'Erreur création');
            }
        });

        // Setup delegation for actions (Edit/Delete/Toggle)
        // For brevity, skipping full edit/delete for now unless specifically requested details, focusing on "Add" and "List"
    }

    async loadClients() {
        try {
            const res = await dataService.getClients();
            const list = res.data || res;
            const tbody = document.getElementById('clients-table');

            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Aucun client trouvé</td></tr>';
                return;
            }

            tbody.innerHTML = list.map(c => `
                <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.email}</td>
                    <td>${c.phone || '-'}</td>
                    <td><span class="badge badge-${c.isActive ? 'success' : 'danger'}">${c.isActive ? 'Actif' : 'Inactif'}</span></td>
                    <td>
                        <button class="btn-icon" title="Voir détails"><i class="fa-solid fa-eye"></i></button>
                        <!-- Add edit/delete if needed -->
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            console.error(e);
            document.getElementById('clients-table').innerHTML = '<tr><td colspan="5" style="text-align:center; color:red">Erreur chargement</td></tr>';
        }
    }
}
