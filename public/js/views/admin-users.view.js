import { BaseView } from './base.view.js';
import { dataService } from '../services/data.service.js';
import { toast } from '../utils/ui.js';

export class AdminUsersView extends BaseView {
  async render() {
    console.log(this.state);

    const layout = this.renderLayout(
      `
            <div class="page-header">
                <h2>Gestion des Utilisateurs</h2>
                <button class="btn btn-primary btn-sm" id="add-user-btn"><i class="fa-solid fa-plus"></i> Ajouter</button>
            </div>

            <div class="glass-panel">
                <div class="table-responsive">
                    <table class="table table-as-card">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body">
                            <tr><td colspan="5" class="table-empty-state">Chargement...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal -->
            <div id="user-modal" class="modal-overlay hidden" style="display:none;">
                <div class="modal-container glass-panel">
                    <div class="modal-header">
                        <h3 id="modal-title">Ajouter Utilisateur</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="user-form">
                        <input type="hidden" id="user-id">
                        <div class="form-group"><input type="text" id="name" placeholder="Nom complet" required></div>
                        <div class="form-group"><input type="email" id="email" placeholder="Email" required></div>
                        <div class="form-group"><input type="password" id="password" placeholder="Mot de passe"> <small style="color:var(--text-muted)">Laisser vide si inchangé</small></div>
                        <div class="form-group">
                            <select id="role" required>
                                <option value="CLIENT">Client</option>
                                <option value="AGENT">Agent</option>
                                ${
                                  this.state &&
                                  (this.state.isAdmin ||
                                    this.state.get('user')?.role === 'ADMIN' ||
                                    this.state.get('user')?.role === 'SUPER_ADMIN')
                                    ? `
                                <option value="SECRETARY">Secrétaire</option>
                                <option value="ADMIN">Admin</option>
                                <option value="SUPER_ADMIN">Super Admin</option>
                                `
                                    : ''
                                }
                            </select>
                        </div>
                        <div class="form-group">
                            <select id="agencyId">
                                <option value="">Aucune Agence</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary w-full">Sauvegarder</button>
                    </form>
                </div>
            </div>
        `,
      'users',
    );

    this.root.innerHTML = layout;
    this.bindLogout();
    this.bindEvents();
    this.loadUsers();
    this.loadAgencies();
  }

  bindEvents() {
    const modal = document.getElementById('user-modal');
    const showModal = (title, data = null) => {
      modal.style.display = 'flex';
      document.getElementById('modal-title').textContent = title;
      document.getElementById('user-id').value = data ? data.id : '';
      document.getElementById('name').value = data ? data.name : '';
      document.getElementById('email').value = data ? data.email : '';
      document.getElementById('role').value = data ? data.role : 'CLIENT';
      document.getElementById('agencyId').value = data ? data.agencyId || '' : '';
      document.getElementById('password').value = '';
      document.getElementById('password').required = !data;
    };
    const hideModal = () => (modal.style.display = 'none');

    document
      .getElementById('add-user-btn')
      .addEventListener('click', () => showModal('Ajouter Utilisateur'));
    modal.querySelector('.modal-close').addEventListener('click', hideModal);

    document.getElementById('user-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check if user is secretary and trying to create admin/secretary
      const currentUser = this.state?.get('user') || { role: null };
      const selectedRole = document.getElementById('role').value;

      if (
        currentUser.role === 'SECRETARY' &&
        ['ADMIN', 'SECRETARY', 'SUPER_ADMIN'].includes(selectedRole)
      ) {
        toast.error(
          'Accès refusé. Les secrétaires ne peuvent pas créer des utilisateurs avec ces rôles.',
        );
        return;
      }

      const id = document.getElementById('user-id').value;
      const data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        role: document.getElementById('role').value,
        agencyId: document.getElementById('agencyId').value || null,
      };
      const pass = document.getElementById('password').value;
      if (pass) data.password = pass;

      try {
        if (id) await dataService.updateUser(id, data);
        else await dataService.createUser(data);
        toast.success('Pérsuasion réussie');
        hideModal();
        this.loadUsers();
      } catch (err) {
        toast.error(err.message);
      }
    });

    document.getElementById('users-table-body').addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.dataset.id;
      if (btn.classList.contains('edit-btn')) {
        const row = btn.closest('tr');
        const data = {
          id,
          name: row.children[0].textContent,
          email: row.children[1].textContent,
          role: row.children[2].textContent,
          agencyId: btn.dataset.agency,
        };
        showModal('Modifier Utilisateur', data);
      } else if (btn.classList.contains('toggle-btn')) {
        const isActive = btn.dataset.active === 'true';
        try {
          await dataService.toggleUserStatus(id, !isActive);
          this.loadUsers();
        } catch (err) {
          toast.error('Erreur');
        }
      }
    });
  }

  async loadUsers() {
    try {
      const users = await dataService.getUsers();
      const tbody = document.getElementById('users-table-body');
      tbody.innerHTML = users
        .map(
          (user) => `
                <tr>
                    <td data-label="Nom">${user.name || '-'}</td>
                    <td data-label="Email">${user.email}</td>
                    <td data-label="Rôle">${user.role}</td>
                    <td data-label="Statut">
                        <span class="badge ${user.isActive ? 'badge-success' : 'badge-danger'}">
                            ${user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                    </td>
                    <td data-label="Actions">
                        <button class="btn-icon edit-btn" data-id="${user.id}" data-agency="${user.agencyId || ''}"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon toggle-btn" data-id="${user.id}" data-active="${user.isActive}">
                            <i class="fa-solid ${user.isActive ? 'fa-ban' : 'fa-check'}"></i>
                        </button>
                    </td>
                </tr>
            `,
        )
        .join('');
    } catch (err) {
      console.error(err);
    }
  }

  async loadAgencies() {
    const agencies = await dataService.getAgencies();
    const select = document.getElementById('agencyId');
    agencies.forEach((ag) => {
      select.innerHTML += `<option value="${ag.id}">${ag.name}</option>`;
    });
  }
}
