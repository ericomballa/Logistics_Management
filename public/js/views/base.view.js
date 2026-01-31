import { state } from '../state.js';
import { authService } from '../services/auth.service.js';

export class BaseView {
    constructor(root) {
        this.root = root;
    }

    renderLayout(contentHTML, activeNav = '') {
        // If not logged in, just return content (e.g. login page)
        if (!state.isAuthenticated) return contentHTML;

        const user = state.get('user') || { name: 'User' };

        return `
            <div class="layout-grid">
                <aside class="sidebar">
                    <div class="logo-area" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div style="display:flex; align-items:center; gap:0.8rem;">
                            <i class="fa-solid fa-cube logo-icon"></i>
                            <h1>DLH<span style="color:var(--primary)">.logistics</span></h1>
                        </div>
                        <button id="mobile-menu-close" class="btn-icon mobile-only" style="color:white; font-size:1.5rem; background:none; border:none;">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <nav class="nav-links">
                        <a href="#dashboard" class="nav-item ${activeNav === 'dashboard' ? 'active' : ''}">
                            <i class="fa-solid fa-chart-pie"></i> <span>Tableau de bord</span>
                        </a>
                        <a href="#shipments" class="nav-item ${activeNav === 'shipments' ? 'active' : ''}">
                            <i class="fa-solid fa-box-open"></i> <span>Expéditions</span>
                        </a>
                        <a href="#tracking" class="nav-item ${activeNav === 'tracking' ? 'active' : ''}">
                            <i class="fa-solid fa-map-location-dot"></i> <span>Suivi</span>
                        </a>
                        <a href="#profile" class="nav-item ${activeNav === 'profile' ? 'active' : ''}">
                            <i class="fa-solid fa-user-gear"></i> <span>Profil</span>
                        </a>
                        
                        ${state.isAdmin || state.isSecretary ? `
                        <div style="margin-top:1rem; padding-left:1rem; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:bold;">Admin</div>
                        <a href="#users" class="nav-item ${activeNav === 'users' ? 'active' : ''}">
                            <i class="fa-solid fa-users"></i> <span>Utilisateurs</span>
                        </a>
                        <a href="#clients" class="nav-item ${activeNav === 'clients' ? 'active' : ''}">
                            <i class="fa-solid fa-user-tie"></i> <span>Clients</span>
                        </a>
                        <a href="#agencies" class="nav-item ${activeNav === 'agencies' ? 'active' : ''}">
                            <i class="fa-solid fa-building"></i> <span>Agences</span>
                        </a>
                        <a href="#warehouses" class="nav-item ${activeNav === 'warehouses' ? 'active' : ''}">
                            <i class="fa-solid fa-warehouse"></i> <span>Entrepôts</span>
                        </a>
                        ${state.isAdmin ? `
                        <a href="#audit-trail" class="nav-item ${activeNav === 'audit-trail' ? 'active' : ''}">
                            <i class="fa-solid fa-clipboard-list"></i> <span>Journal d'Audit</span>
                        </a>
                        ` : ''}
                        <a href="#billing" class="nav-item ${activeNav === 'billing' ? 'active' : ''}">
                            <i class="fa-solid fa-file-invoice-dollar"></i> <span>Facturation</span>
                        </a>
                        <a href="#reports" class="nav-item ${activeNav === 'reports' ? 'active' : ''}">
                            <i class="fa-solid fa-chart-line"></i> <span>Rapports</span>
                        </a>
                        ` : ''}
                    </nav>

                    <div class="user-footer">
                        <div class="avatar"><i class="fa-solid fa-user"></i></div>
                        <div style="flex:1; overflow:hidden;">
                            <div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${user.name}</div>
                            <div style="font-size:0.8rem; color:var(--text-muted); cursor:pointer;" id="logout-btn">Se déconnecter</div>
                        </div>
                    </div>
                </aside>

                <main class="main-content">
                    <header class="mobile-header mobile-only" style="padding: 1rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); margin-bottom: 1rem;">
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                             <i class="fa-solid fa-cube logo-icon" style="color:var(--primary)"></i>
                             <h2 style="font-size:1.2rem; font-weight:800;">DLH</h2>
                        </div>
                        <button id="mobile-menu-toggle" class="btn-icon" style="color:white; font-size:1.2rem; background:none; border:none;">
                            <i class="fa-solid fa-bars"></i>
                        </button>
                    </header>
                    ${contentHTML}
                </main>
            </div>
        `;
    }

    bindLogout() {
        // Mobile menu toggle
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const closeBtn = document.getElementById('mobile-menu-close');
        const sidebar = document.querySelector('.sidebar');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.add('mobile-open');
            });
        }

        if (closeBtn && sidebar) {
            closeBtn.addEventListener('click', () => {
                sidebar.classList.remove('mobile-open');
            });
        }

        const btn = document.getElementById('logout-btn');
        if (btn) {
            btn.addEventListener('click', () => authService.logout());
        }
    }
}
