import { BaseView } from './base.view.js';
import { authService } from '../services/auth.service.js';
import { toast } from '../utils/ui.js';

export class RegisterView extends BaseView {
    async render() {
        this.root.innerHTML = `
            <div class="centered-layout">
                <div class="auth-card glass-panel">
                    <div style="text-align:center; margin-bottom:2rem;">
                         <i class="fa-solid fa-cube" style="font-size:3rem; color:var(--primary); margin-bottom:1rem;"></i>
                        <h2>Inscription</h2>
                        <p style="color:var(--text-muted)">Rejoignez DLH Logistics</p>
                    </div>

                    <form id="register-form">
                        <div class="input-group form-group">
                            <i class="fa-regular fa-user"></i>
                            <input type="text" id="name" placeholder="Nom complet" required>
                        </div>
                        <div class="input-group form-group">
                            <i class="fa-regular fa-envelope"></i>
                            <input type="email" id="email" placeholder="Email" required>
                        </div>
                        <div class="input-group form-group">
                            <i class="fa-solid fa-lock"></i>
                            <input type="password" id="password" placeholder="Mot de passe" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%">
                            S'inscrire
                        </button>
                    </form>

                    <div style="margin-top:1.5rem; text-align:center; font-size:0.9rem;">
                        <p>Déjà membre ? <a href="#login">Se connecter</a></p>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await authService.register(name, email, password);
                toast.success('Inscription réussie ! Veuillez vous connecter.');
                window.location.hash = '#login';
            } catch (err) {
                toast.error(err.message || 'Échec de l\'inscription');
            }
        });
    }
}
