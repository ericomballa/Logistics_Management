import { BaseView } from './base.view.js';
import { dataService } from '../services/data.service.js';
import { toast } from '../utils/ui.js';

export class TariffManagementView extends BaseView {
  constructor(root) {
    super(root);
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.totalPages = 1;
  }

  async render() {
    const layout = this.renderLayout(`
      <div class="page-header">
        <div>
          <h2>Gestion des Tarifs</h2>
          <p style="color:var(--text-muted)">Configurer les prix de transport par destination</p>
        </div>
        <button id="add-tariff-btn" class="btn btn-primary">
          <i class="fa-solid fa-plus"></i> Nouveau Tarif
        </button>
      </div>

      <div class="glass-panel">
        <div class="table-responsive">
          <table class="table desktop-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Origine</th>
                <th>Destination</th>
                <th>Prix de Base (XAF)</th>
                <th>Prix/Kg Supplémentaire (XAF)</th>
                <th>Prix/m³ (XAF)</th>
                <th>Taux Assurance (%)</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tariff-table-body">
              <tr>
                <td colspan="8" style="text-align:center; padding:2rem;">
                  <div class="loading-container">
                    <div class="spinner"></div>
                    <span>Chargement des tarifs...</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-controls responsive-pagination">
          <div id="tariff-pagination-info" class="pagination-info">
            Affichage de <span id="tariff-pagination-start">0</span> à <span id="tariff-pagination-end">0</span> sur <span id="tariff-pagination-total">0</span> tarifs
          </div>
          <div class="pagination-buttons">
            <button id="prev-tariff-page" class="btn btn-outline" disabled>
              <i class="fa-solid fa-chevron-left"></i> Précédent
            </button>
            <span id="current-tariff-page" class="pagination-current">1</span>
            <button id="next-tariff-page" class="btn btn-outline" disabled>
              Suivant <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Add/Edit Tariff Modal -->
      <div id="tariff-modal" class="modal-overlay hidden" style="display:none;">
        <div class="modal-container glass-panel">
          <div class="modal-header">
            <h3 id="tariff-modal-title">Ajouter un Tarif</h3>
            <button class="modal-close">&times;</button>
          </div>
          <form id="tariff-form">
            <input type="hidden" id="tariff-id">
            <div class="form-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
              <div class="form-group">
                <label>Origine</label>
                <input type="text" id="tariff-origin" placeholder="Pays/Ville d'origine" required>
              </div>
              <div class="form-group">
                <label>Destination</label>
                <input type="text" id="tariff-destination" placeholder="Pays/Ville de destination" required>
              </div>
            </div>
            <div class="form-group">
              <label>Nom du Tarif</label>
              <input type="text" id="tariff-name" placeholder="Nom du tarif (ex: Chine vers Cameroun)" required>
            </div>
            <div class="form-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
              <div class="form-group">
                <label>Prix de Base (XAF)</label>
                <input type="number" id="tariff-base-price" placeholder="Prix pour le premier kg" required>
              </div>
              <div class="form-group">
                <label>Prix/Kg Supplémentaire (XAF)</label>
                <input type="number" id="tariff-price-per-kg" placeholder="Prix par kg supplémentaire" required>
              </div>
            </div>
            <div class="form-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
              <div class="form-group">
                <label>Prix par m³ (XAF) (facultatif)</label>
                <input type="number" step="0.1" id="tariff-rate-per-cbm" placeholder="Prix par mètre cube">
              </div>
              <div class="form-group">
                <label>Taux d'Assurance (%) (facultatif)</label>
                <input type="number" step="0.1" id="tariff-insurance-rate" placeholder="Taux d'assurance">
              </div>
            </div>
            <div class="form-group">
              <label>Statut</label>
              <select id="tariff-is-active" required>
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary w-full">Sauvegarder</button>
          </form>
        </div>
      </div>
    `, 'tariff-management');

    this.root.innerHTML = layout;
    this.bindLogout();
    this.bindEvents();
    this.loadTariffs('', 1);
  }

  bindEvents() {
    // Add tariff button
    document.getElementById('add-tariff-btn').addEventListener('click', () => {
      document.getElementById('tariff-modal-title').textContent = 'Ajouter un Tarif';
      document.getElementById('tariff-form').reset();
      document.getElementById('tariff-id').value = '';
      document.getElementById('tariff-is-active').value = 'true';
      document.getElementById('tariff-modal').style.display = 'flex';
    });

    // Close modal buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('tariff-modal').style.display = 'none';
      });
    });

    // Close modal when clicking outside
    document.getElementById('tariff-modal').addEventListener('click', (e) => {
      if (e.target.id === 'tariff-modal') {
        document.getElementById('tariff-modal').style.display = 'none';
      }
    });

    // Tariff form submission
    document.getElementById('tariff-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        name: `${document.getElementById('tariff-origin').value} to ${document.getElementById('tariff-destination').value}`, // Generate name from origin and destination
        origin: document.getElementById('tariff-origin').value,
        destination: document.getElementById('tariff-destination').value,
        baseRate: Number(document.getElementById('tariff-base-price').value),
        ratePerKg: Number(document.getElementById('tariff-price-per-kg').value),
        ...(document.getElementById('tariff-rate-per-cbm').value && { ratePerCbm: Number(document.getElementById('tariff-rate-per-cbm').value) }),
        ...(document.getElementById('tariff-insurance-rate').value && { insuranceRate: Number(document.getElementById('tariff-insurance-rate').value) }),
        isActive: document.getElementById('tariff-is-active').value === 'true'
      };

      const tariffId = document.getElementById('tariff-id').value;

      try {
        if (tariffId) {
          await dataService.updateTariff(tariffId, formData);
          toast.success('Tarif mis à jour');
        } else {
          await dataService.createTariff(formData);
          toast.success('Tarif créé');
        }

        document.getElementById('tariff-modal').style.display = 'none';
        this.loadTariffs(this.currentQuery, this.currentPage);
      } catch (err) {
        toast.error(err.message || 'Erreur lors de l\'opération');
      }
    });

    // Pagination events
    document.getElementById('prev-tariff-page').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadTariffs(this.currentQuery, this.currentPage);
      }
    });

    document.getElementById('next-tariff-page').addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadTariffs(this.currentQuery, this.currentPage);
      }
    });
  }

  async loadTariffs(query = '', page = 1) {
    try {
      const res = await dataService.getTariffs(query, page, this.itemsPerPage);
      // Handle different response structures
      let list, total, currentPage;

      if (res && typeof res === 'object') {
        // If response has data property (paginated response)
        if (res.data) {
          list = res.data;
          total = res.total || res.data.length;
          currentPage = res.page || page;
        } else {
          // If response is directly the array
          list = res;
          total = res.length || 0;
          currentPage = page;
        }
      } else {
        // Fallback to empty array
        list = [];
        total = 0;
        currentPage = page;
      }

      this.totalPages = Math.ceil(total / this.itemsPerPage);
      this.currentPage = currentPage;

      const tbody = document.getElementById('tariff-table-body');
      const startIndex = (currentPage - 1) * this.itemsPerPage + 1;
      const endIndex = Math.min(currentPage * this.itemsPerPage, total);

      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center">Aucun tarif configuré</td></tr>';
      } else {
        tbody.innerHTML = list.map(tariff => `
          <tr>
            <td data-label="Nom">${tariff.name}</td>
            <td data-label="Origine">${tariff.origin}</td>
            <td data-label="Destination">${tariff.destination}</td>
            <td data-label="Prix de Base">${tariff.baseRate ? tariff.baseRate.toLocaleString() : '0'} XAF</td>
            <td data-label="Prix/Kg">${tariff.ratePerKg ? tariff.ratePerKg.toLocaleString() : '0'} XAF</td>
            <td data-label="Prix/m³">${tariff.ratePerCbm ? tariff.ratePerCbm.toLocaleString() : 'N/A'} XAF</td>
            <td data-label="Taux Assurance">${tariff.insuranceRate ? tariff.insuranceRate + '%' : 'N/A'}</td>
            <td data-label="Statut">
              <span class="badge ${tariff.isActive ? 'badge-success' : 'badge-danger'}">
                ${tariff.isActive ? 'Actif' : 'Inactif'}
              </span>
            </td>
            <td data-label="Actions">
              <button class="btn-icon edit-tariff-btn" data-id="${tariff.id}" title="Modifier">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn-icon delete-tariff-btn" data-id="${tariff.id}" style="color:var(--danger)" title="Supprimer">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join('');
      }

      // Update pagination info
      document.getElementById('tariff-pagination-start').textContent = startIndex;
      document.getElementById('tariff-pagination-end').textContent = endIndex;
      document.getElementById('tariff-pagination-total').textContent = total;
      document.getElementById('current-tariff-page').textContent = currentPage;

      // Update pagination buttons
      document.getElementById('prev-tariff-page').disabled = currentPage <= 1;
      document.getElementById('next-tariff-page').disabled = currentPage >= this.totalPages;

      // Bind edit and delete events
      document.querySelectorAll('.edit-tariff-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            const tariff = await dataService.getTariff(id);
            document.getElementById('tariff-modal-title').textContent = 'Modifier le Tarif';
            document.getElementById('tariff-id').value = tariff.id;
            document.getElementById('tariff-name').value = tariff.name;
            document.getElementById('tariff-origin').value = tariff.origin;
            document.getElementById('tariff-destination').value = tariff.destination;
            document.getElementById('tariff-base-price').value = tariff.baseRate;
            document.getElementById('tariff-price-per-kg').value = tariff.ratePerKg;
            document.getElementById('tariff-rate-per-cbm').value = tariff.ratePerCbm || '';
            document.getElementById('tariff-insurance-rate').value = tariff.insuranceRate || '';
            document.getElementById('tariff-is-active').value = tariff.isActive.toString();
            document.getElementById('tariff-modal').style.display = 'flex';
          } catch (err) {
            toast.error('Erreur chargement tarif');
          }
        });
      });

      document.querySelectorAll('.delete-tariff-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          if (confirm('Supprimer ce tarif ?')) {
            try {
              await dataService.deleteTariff(id);
              toast.success('Tarif supprimé');
              this.loadTariffs(this.currentQuery, this.currentPage);
            } catch (err) {
              toast.error(err.message || 'Erreur suppression');
            }
          }
        });
      });

    } catch (err) {
      console.error(err);
      const tbody = document.getElementById('tariff-table-body');
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--danger)">Erreur de chargement</td></tr>';
    }
  }
}