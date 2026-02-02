import { state } from './state.js';

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  add(path, viewModule, role = null) {
    this.routes[path] = { module: viewModule, role };
  }

  async handleRoute() {
    const hash = window.location.hash.slice(1) || 'login';
    const route = this.routes[hash];

    const appDiv = document.getElementById('app');

    if (!route) {
      window.location.hash = '#login';
      return;
    }

    // Auth Check
    if (
      hash !== 'login' &&
      hash !== 'register' &&
      hash !== 'tracking-public' &&
      !state.isAuthenticated
    ) {
      window.location.hash = '#login';
      return;
    }

    // Role Check
    if (route.role === 'ADMIN' && !state.isAdmin) {
      alert('Accès non autorisé');
      window.location.hash = '#dashboard';
      return;
    }

    if (route.role === 'ADMIN_OR_SECRETARY' && !state.isAdmin && !state.isSecretary) {
      alert('Accès non autorisé');
      window.location.hash = '#dashboard';
      return;
    }

    // Load View
    appDiv.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';
    try {
      const ViewClass = await route.module();
      this.currentView = new ViewClass(appDiv);
      await this.currentView.render();
    } catch (err) {
      console.error('Route Error:', err);
      appDiv.innerHTML = '<p class="text-center">Erreur de chargement de la vue</p>';
    }
  }
}

export const router = new Router();
