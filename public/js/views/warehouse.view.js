import { BaseView } from './base.view.js';
import { dataService } from '../services/data.service.js';
import { toast } from '../utils/ui.js';

export class WarehouseView extends BaseView {
  async render() {
    const layout = this.renderLayout(
      `
             <div class="page-header">
                <div>
                    <h2>Gestion des Entrepôts</h2>
                    <p style="color:var(--text-muted)">Gérez vos hubs logistiques et inventaires</p>
                </div>
                <button class="btn btn-primary" id="add-warehouse-btn"><i class="fa-solid fa-plus"></i> Ajouter</button>
            </div>
            
             <div class="glass-panel">
                <div class="table-responsive">
                    <table class="table table-as-card">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Nom</th>
                                <th>Pays</th>
                                <th>Ville</th>
                                <th>Capacité</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="warehouses-table-body">
                            <tr><td colspan="6" style="text-align:center">Chargement...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

             <!-- Modal Create/Edit -->
            <div id="warehouse-modal" class="modal-overlay hidden" style="display:none;">
                <div class="modal-container glass-panel">
                    <div class="modal-header">
                        <h3 id="modal-title">Ajouter Entrepôt</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="warehouse-form">
                        <input type="hidden" id="warehouse-id">
                        <div class="form-group">
                            <label>Nom de l'entrepôt</label>
                            <input type="text" id="name" placeholder="ex: Hub France Central" required>
                        </div>
                        <div class="form-group">
                            <label>Code Unique</label>
                            <input type="text" id="code" placeholder="ex: FR-PAR-01" required>
                        </div>
                        <div class="grid grid-2">
                            <div>
                                <label>Pays</label>
                                <input type="text" id="country" placeholder="Pays" required>
                            </div>
                            <div>
                                <label>Ville</label>
                                <input type="text" id="city" placeholder="Ville" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Adresse Complète</label>
                            <input type="text" id="address" placeholder="Adresse" required>
                        </div>
                        <div class="grid grid-2">
                            <div>
                                <label>Téléphone</label>
                                <input type="text" id="phone" placeholder="Téléphone">
                            </div>
                            <div>
                                <label>Capacité (m³)</label>
                                <input type="number" id="capacity" placeholder="1000">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary w-full" style="margin-top:1rem;">Sauvegarder</button>
                    </form>
                </div>
            </div>

            <!-- Inventory Modal -->
            <div id="inventory-modal" class="modal-overlay hidden" style="display:none;">
                <div class="modal-container glass-panel" style="max-width:800px;">
                    <div class="modal-header">
                        <h3 id="inventory-modal-title">Inventaire</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    
                    <div class="grid grid-2 mb-4 pb-4 border-b">
                        <div>
                            <h4 class="mb-4">Ajouter un colis</h4>
                            <form id="add-inventory-form" class="grid">
                                <div class="form-group">
                                    <input type="text" id="inv-shipment-id" placeholder="ID de l'expédition (UUID)" required>
                                </div>
                                <div class="form-group">
                                    <input type="text" id="inv-location" placeholder="Zone/Rayon (ex: A-12)" required>
                                </div>
                                <button type="submit" class="btn btn-primary btn-sm">Ajouter</button>
                            </form>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:8px;">
                            <h5>Actions groupées</h5>
                            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">Scanner les codes QR pour une gestion plus rapide.</p>
                            <button class="btn btn-sm btn-outline" disabled><i class="fa-solid fa-qrcode"></i> Scanner QR</button>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="table table-as-card">
                            <thead>
                                <tr>
                                    <th>Expédition</th>
                                    <th>Emplacement</th>
                                    <th>Reçu le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="inventory-list"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `,
      'warehouses',
    );

    this.root.innerHTML = layout;
    this.bindLogout();
    this.bindEvents();
    this.loadWarehouses();
  }

  bindEvents() {
    const modal = document.getElementById('warehouse-modal');
    const showModal = (title, data = null) => {
      modal.style.display = 'flex';
      document.getElementById('modal-title').textContent = title;
      document.getElementById('warehouse-id').value = data ? data.id : '';
      document.getElementById('name').value = data ? data.name : '';
      document.getElementById('code').value = data ? data.code : '';
      document.getElementById('country').value = data ? data.country : '';
      document.getElementById('city').value = data ? data.city : '';
      document.getElementById('address').value = data ? data.address : '';
      document.getElementById('phone').value = data ? data.phone || '' : '';
      document.getElementById('capacity').value = data ? data.capacity || '' : '';
    };
    const hideModal = () => (modal.style.display = 'none');

    document
      .getElementById('add-warehouse-btn')
      .addEventListener('click', () => showModal('Ajouter Entrepôt'));
    modal.querySelector('.modal-close').addEventListener('click', hideModal);

    document.getElementById('warehouse-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('warehouse-id').value;
      const data = {
        name: document.getElementById('name').value,
        code: document.getElementById('code').value,
        country: document.getElementById('country').value,
        city: document.getElementById('city').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value,
        capacity: Number(document.getElementById('capacity').value) || undefined,
      };

      try {
        if (id) await dataService.updateWarehouse(id, data);
        else await dataService.createWarehouse(data);
        toast.success('Entrepôt enregistré');
        hideModal();
        this.loadWarehouses();
      } catch (err) {
        toast.error(err.message);
      }
    });

    document.getElementById('warehouses-table-body').addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = btn.dataset.id;

      if (btn.classList.contains('edit-btn')) {
        const data = JSON.parse(btn.dataset.json);
        showModal('Modifier Entrepôt', data);
      } else if (btn.classList.contains('delete-btn')) {
        if (confirm('Supprimer cet entrepôt ?')) {
          try {
            await dataService.deleteWarehouse(id);
            toast.success('Supprimé');
            this.loadWarehouses();
          } catch (err) {
            toast.error('Erreur suppression');
          }
        }
      } else if (btn.classList.contains('inventory-btn')) {
        this.showInventory(id, btn.dataset.name);
      }
    });

    const invModal = document.getElementById('inventory-modal');
    invModal
      .querySelector('.modal-close')
      .addEventListener('click', () => (invModal.style.display = 'none'));

    document.getElementById('add-inventory-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const warehouseId = invModal.dataset.warehouseId;
      const shipmentId = document.getElementById('inv-shipment-id').value;
      const location = document.getElementById('inv-location').value;

      try {
        await dataService.addToInventory({ warehouseId, shipmentId, location });
        toast.success("Ajouté à l'inventaire");
        e.target.reset();
        this.showInventory(
          warehouseId,
          document.getElementById('inventory-modal-title').textContent.split(': ')[1],
        );
      } catch (err) {
        toast.error(err.message);
      }
    });

    document.getElementById('inventory-list').addEventListener('click', async (e) => {
      const btn = e.target.closest('.dispatch-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      const warehouseId = invModal.dataset.warehouseId;

      if (confirm("Décharger ce colis de l'entrepôt ?")) {
        try {
          await dataService.dispatchFromInventory(id);
          toast.success('Colis déchargé');
          this.showInventory(
            warehouseId,
            document.getElementById('inventory-modal-title').textContent.split(': ')[1],
          );
        } catch (err) {
          toast.error('Erreur lors du déchargement');
        }
      }
    });
  }

  async loadWarehouses() {
    try {
      const warehouses = await dataService.getWarehouses();
      const tbody = document.getElementById('warehouses-table-body');

      if (warehouses.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="6" style="text-align:center">Aucun entrepôt configuré</td></tr>';
        return;
      }

      tbody.innerHTML = warehouses
        .map(
          (w) => `
                <tr>
                    <td data-label="Code"><span class="badge badge-info">${w.code}</span></td>
                    <td data-label="Nom"><strong>${w.name}</strong></td>
                    <td data-label="Pays">${w.country}</td>
                    <td data-label="Ville">${w.city}</td>
                    <td data-label="Capacité">${w.capacity || '-'} m³</td>
                    <td data-label="Actions">
                        <button class="btn-icon inventory-btn" data-id="${w.id}" data-name="${w.name}" title="Inventaire"><i class="fa-solid fa-boxes-stacked"></i></button>
                        <button class="btn-icon edit-btn" data-id="${w.id}" data-json='${JSON.stringify(w).replace(/'/g, '&apos;')}' title="Modifier"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon delete-btn" data-id="${w.id}" style="color:var(--danger)" title="Supprimer"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `,
        )
        .join('');
    } catch (err) {
      console.error(err);
      document.getElementById('warehouses-table-body').innerHTML =
        '<tr><td colspan="6" style="text-align:center; color:var(--danger)">Erreur de chargement</td></tr>';
    }
  }

  async showInventory(id, name) {
    const modal = document.getElementById('inventory-modal');
    const list = document.getElementById('inventory-list');
    const title = document.getElementById('inventory-modal-title');

    title.textContent = `Inventaire: ${name}`;
    modal.dataset.warehouseId = id;
    modal.style.display = 'flex';
    list.innerHTML = '<tr><td colspan="4" style="text-align:center">Chargement...</td></tr>';

    try {
      const inventory = await dataService.getWarehouseInventory(id);
      if (!inventory || inventory.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center">Entrepôt vide</td></tr>';
        return;
      }

      list.innerHTML = inventory
        .map(
          (item) => `
                <tr>
                    <td data-label="Expédition" class="font-mono">${item.shipment?.trackingNumber || item.shipmentId.substring(0, 8)}</td>
                    <td data-label="Emplacement"><span class="badge badge-info">${item.location}</span></td>
                    <td data-label="Reçu le">${new Date(item.receivedAt).toLocaleDateString()}</td>
                    <td data-label="Actions">
                        <button class="btn btn-sm btn-outline-danger dispatch-btn" data-id="${item.id}">Décharger</button>
                    </td>
                </tr>
            `,
        )
        .join('');
    } catch (err) {
      list.innerHTML =
        '<tr><td colspan="4" style="text-align:center; color:var(--danger)">Erreur</td></tr>';
    }
  }
}
