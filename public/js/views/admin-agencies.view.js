import { BaseView } from './base.view.js';
import { dataService } from '../services/data.service.js';
import { toast } from '../utils/ui.js';

export class AdminAgenciesView extends BaseView {
    async render() {
        const layout = this.renderLayout(`
             <div class="page-header">
                <h2>Gestion des Agences</h2>
                <button class="btn btn-primary btn-sm" id="add-agency-btn"><i class="fa-solid fa-plus"></i> Ajouter</button>
            </div>
            
             <div class="glass-panel">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Pays</th>
                                <th>Ville</th>
                                <th>Adresse</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="agencies-table-body"></tbody>
                    </table>
                </div>
            </div>

             <!-- Modal -->
            <div id="agency-modal" class="modal-overlay hidden" style="display:none;">
                <div class="modal-container glass-panel">
                    <div class="modal-header">
                        <h3 id="modal-title">Ajouter Agence</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="agency-form">
                        <input type="hidden" id="agency-id">
                        <div class="form-group"><input type="text" id="name" placeholder="Nom de l'agence" required></div>
                        <div class="form-group"><input type="text" id="code" placeholder="Code (ex: CM-DLA)" required></div>
                        <div class="grid grid-2">
                            <div class="form-group"><input type="text" id="country" placeholder="Pays" required></div>
                            <div class="form-group"><input type="text" id="city" placeholder="Ville" required></div>
                        </div>
                        <div class="form-group"><input type="text" id="address" placeholder="Adresse" required></div>
                        <div class="grid grid-2">
                            <div class="form-group"><input type="text" id="phone" placeholder="Téléphone"></div>
                            <div class="form-group"><input type="email" id="email" placeholder="Email"></div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%">Sauvegarder</button>
                    </form>
                </div>
            </div>
        `, 'agencies');

        this.root.innerHTML = layout;
        this.bindLogout();
        this.bindEvents();
        this.loadAgencies();
    }

    bindEvents() {
        const modal = document.getElementById('agency-modal');
        const showModal = (title, data = null) => {
            modal.style.display = 'flex';
            document.getElementById('modal-title').textContent = title;
            document.getElementById('agency-id').value = data ? data.id : '';
            document.getElementById('name').value = data ? data.name : '';
            document.getElementById('code').value = data ? data.code : '';
            document.getElementById('country').value = data ? data.country : '';
            document.getElementById('city').value = data ? data.city : '';
            document.getElementById('address').value = data ? data.address : '';
            document.getElementById('phone').value = data ? (data.phone || '') : '';
            document.getElementById('email').value = data ? (data.email || '') : '';
        };
        const hideModal = () => modal.style.display = 'none';

        document.getElementById('add-agency-btn').addEventListener('click', () => showModal('Ajouter Agence'));
        modal.querySelector('.modal-close').addEventListener('click', hideModal);

        document.getElementById('agency-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('agency-id').value;
            const data = {
                name: document.getElementById('name').value,
                code: document.getElementById('code').value,
                country: document.getElementById('country').value,
                city: document.getElementById('city').value,
                address: document.getElementById('address').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value
            };

            try {
                if (id) await dataService.updateAgency(id, data);
                else await dataService.createAgency(data);
                toast.success('Agence enregistrée');
                hideModal();
                this.loadAgencies();
            } catch (err) { toast.error(err.message); }
        });

        document.getElementById('agencies-table-body').addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.dataset.id;

            if (btn.classList.contains('edit-btn')) {
                const data = JSON.parse(btn.dataset.json);
                showModal('Modifier Agence', data);
            } else if (btn.classList.contains('delete-btn')) {
                if (confirm('Supprimer cette agence ?')) {
                    try {
                        await dataService.deleteAgency(id);
                        this.loadAgencies();
                    } catch (err) { toast.error('Erreur suppression'); }
                }
            }
        });
    }

    async loadAgencies() {
        try {
            const agencies = await dataService.getAgencies();
            const tbody = document.getElementById('agencies-table-body');
            tbody.innerHTML = agencies.map(ag => `
                <tr>
                    <td>${ag.name}</td>
                    <td>${ag.country}</td>
                    <td>${ag.city}</td>
                    <td>${ag.address}</td>
                    <td>
                        <button class="btn-icon edit-btn" data-id="${ag.id}" data-json='${JSON.stringify(ag).replace(/'/g, "&apos;")}'><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon delete-btn" data-id="${ag.id}" style="color:var(--danger)"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (err) { console.error(err); }
    }
}
