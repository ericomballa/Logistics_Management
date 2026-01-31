import { BaseView } from './base.view.js';
import { state } from '../state.js';
import { dataService } from '../services/data.service.js';

export class ProfileView extends BaseView {
    constructor(root) {
        super(root);
    }

    async render() {
        const user = state.get('user');
        if (!user) {
            window.location.hash = '#login';
            return;
        }

        const stats = await dataService.getUserStats(user.id || user.userId);

        const layout = this.renderLayout(`
            <div class="page-header">
                <div>
                    <h2><i class="fa-solid fa-user-gear"></i> Mon Profil</h2>
                    <p style="color:var(--text-muted)">Gérez vos informations personnelles et votre sécurité</p>
                </div>
            </div>

            <div class="profile-grid">
                <!-- Info Section -->
                <div class="glass-panel">
                    <h3 style="margin-bottom:1.5rem;"><i class="fa-solid fa-info-circle"></i> Informations Personnelles</h3>
                    
                    <form id="profile-form">
                        <div class="form-group">
                            <label>Nom Complet</label>
                            <input type="text" name="name" class="input" value="${user.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="email" class="input" value="${user.email}" disabled style="opacity:0.6; cursor:not-allowed;">
                            <small style="color:var(--text-muted)">L'email ne peut pas être modifié</small>
                        </div>
                        <div class="form-group">
                            <label>Téléphone</label>
                            <input type="text" name="phone" class="input" value="${user.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>Rôle</label>
                            <input type="text" class="input" value="${user.role}" disabled style="opacity:0.6;">
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-full" style="margin-top:1rem;">
                            Mettre à jour le profil
                        </button>
                    </form>
                </div>

                <!-- Password Section -->
                <div class="glass-panel">
                    <h3 style="margin-bottom:1.5rem;"><i class="fa-solid fa-shield-halved"></i> Sécurité</h3>
                    <p style="color:var(--text-muted); margin-bottom:1rem; font-size:0.9rem;">Changez votre mot de passe pour sécuriser votre compte.</p>
                    
                    <form id="password-form">
                        <div class="form-group">
                            <label>Nouveau mot de passe</label>
                            <input type="password" id="new-password" name="password" class="input" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label>Confirmer le mot de passe</label>
                            <input type="password" id="confirm-password" class="input" required minlength="6">
                        </div>
                        
                        <button type="submit" class="btn btn-secondary w-full" style="margin-top:1rem;">
                            Changer le mot de passe
                        </button>
                    </form>
                </div>
            </div>

            <!-- Stats section if applicable -->
            <div class="glass-panel" style="margin-top:2rem;">
                <h3 style="margin-bottom:1.5rem;"><i class="fa-solid fa-chart-simple"></i> Statistiques d'Activité</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:1.5rem; text-align:center;">
                    <div>
                        <div style="font-size:2rem; font-weight:800; color:var(--primary);">${stats.shipmentCount || 0}</div>
                        <div style="color:var(--text-muted); font-size:0.9rem;">Expéditions</div>
                    </div>
                </div>
            </div>
        `, 'profile');

        this.root.innerHTML = layout;
        this.bindLogout();
        this.bindProfileUpdate();
        this.bindPasswordUpdate();
    }

    bindProfileUpdate() {
        const form = document.getElementById('profile-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const user = state.get('user');

            try {
                const btn = form.querySelector('button');
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mise à jour...';

                await dataService.updateUser(user.id || user.userId, data);

                // Update local state
                state.set('user', { ...user, ...data });

                alert('Profil mis à jour avec succès !');
                this.render();
            } catch (err) {
                console.error(err);
                alert('Erreur lors de la mise à jour du profil');
            } finally {
                const btn = form.querySelector('button');
                btn.disabled = false;
                btn.innerHTML = 'Mettre à jour le profil';
            }
        });
    }

    bindPasswordUpdate() {
        const form = document.getElementById('password-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pass = document.getElementById('new-password').value;
            const confirm = document.getElementById('confirm-password').value;

            if (pass !== confirm) {
                alert('Les mots de passe ne correspondent pas');
                return;
            }

            const user = state.get('user');

            try {
                const btn = form.querySelector('button');
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Changement...';

                await dataService.updateUser(user.id || user.userId, { password: pass });

                alert('Mot de passe changé avec succès !');
                form.reset();
            } catch (err) {
                console.error(err);
                alert('Erreur lors du changement de mot de passe');
            } finally {
                const btn = form.querySelector('button');
                btn.disabled = false;
                btn.innerHTML = 'Changer le mot de passe';
            }
        });
    }
}
