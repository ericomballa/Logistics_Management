import { BaseView } from './base.view.js';
import { authService } from '../services/auth.service.js';
import { toast } from '../utils/ui.js';

export class LoginView extends BaseView {
    async render() {
        this.root.innerHTML = `
            <div class="centered-layout">
                <div class="auth-card glass-panel">
                    <div style="text-align:center; margin-bottom:2rem;">
                        <i class="fa-solid fa-cube" style="font-size:3rem; color:var(--primary); margin-bottom:1rem;"></i>
                        <h2>Connexion</h2>
                        <p style="color:var(--text-muted)">Accédez à votre espace DLH</p>
                    </div>

                    <form id="login-form">
                        <div class="input-group form-group">
                            <i class="fa-regular fa-envelope"></i>
                            <input type="email" id="email" placeholder="Email" required>
                        </div>
                        <div class="input-group form-group">
                            <i class="fa-solid fa-lock"></i>
                            <input type="password" id="password" placeholder="Mot de passe" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-full">
                            Se connecter <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </form>

                    <div style="margin-top:1.5rem; text-align:center; font-size:0.9rem;">
                        <p>Pas encore de compte ? <a href="#register">Créer un compte</a></p>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await authService.login(email, password);
                toast.success('Connexion réussie');
                window.location.hash = '#dashboard';
            } catch (err) {
                toast.error(err.message || 'Échec de la connexion');
            }
        });
    }
}
