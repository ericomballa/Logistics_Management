import { router } from './router.js';
import { state } from './state.js';
import { api } from './services/api.js';

// Load User Profile on Init if token exists
async function init() {
  if (state.get('authToken')) {
    try {
      const user = await api.get('/auth/me');

      state.set('user', user);
    } catch (e) {
      // Token likely expired
      state.set('authToken', null);
    }
  }

  // Define Routes (Lazy Loading)
  router.add('login', () => import('./views/login.view.js').then((m) => m.LoginView));
  router.add('register', () => import('./views/register.view.js').then((m) => m.RegisterView));
  router.add('dashboard', () => import('./views/dashboard.view.js').then((m) => m.DashboardView));
  router.add('shipments', () => import('./views/shipments.view.js').then((m) => m.ShipmentsView));
  router.add('tracking', () => import('./views/tracking.view.js').then((m) => m.TrackingView));
  router.add('profile', () => import('./views/profile.view.js').then((m) => m.ProfileView));
  router.add(
    'users',
    () => import('./views/admin-users.view.js').then((m) => m.AdminUsersView),
    'ADMIN_OR_SECRETARY',
  );
  router.add(
    'clients',
    () => import('./views/clients.view.js').then((m) => m.ClientsView),
    'ADMIN_OR_SECRETARY',
  );
  router.add(
    'agencies',
    () => import('./views/admin-agencies.view.js').then((m) => m.AdminAgenciesView),
    'ADMIN_OR_SECRETARY',
  );
  router.add(
    'warehouses',
    () => import('./views/warehouse.view.js').then((m) => m.WarehouseView),
    'ADMIN_OR_SECRETARY',
  );
  router.add(
    'audit-trail',
    () => import('./views/audit-trail.view.js').then((m) => m.AuditTrailView),
    'ADMIN',
  );
  router.add(
    'billing',
    () => import('./views/billing.view.js').then((m) => m.BillingView),
    'ADMIN_OR_SECRETARY',
  );
  router.add(
    'reports',
    () => import('./views/reports.view.js').then((m) => m.ReportsView),
    'ADMIN_OR_SECRETARY',
  );

  // Public public tracking (landing)
  // router.add('home', ...);
}

init();
