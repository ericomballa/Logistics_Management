import { api } from './api.js';
import { auditService } from './audit.service.js';

export const dataService = {
  // Shipments
  async getShipmentStats() {
    return api.get('/shipments/stats');
  },
  async getShipments(query = '', page = 1, limit = 10) {
    const params = new URLSearchParams(query);
    params.append('page', page);
    params.append('limit', limit);
    return api.get(`/shipments?${params.toString()}`);
  },
  async getShipment(id) {
    return api.get(`/shipments/${id}`);
  },
  async createShipment(data) {
    const result = await api.post('/shipments', data);
    await auditService.logAction(
      'CREATE',
      'SHIPMENT',
      result.id,
      `Created shipment for ${data.recipientName || data.receiverName}`,
    );
    return result;
  },
  async updateShipment(id, data) {
    const result = await api.patch(`/shipments/${id}`, data);
    await auditService.logAction(
      'UPDATE',
      'SHIPMENT',
      id,
      `Updated shipment status to ${data.status || 'unknown'}`,
    );
    return result;
  },
  async deleteShipment(id) {
    await api.delete(`/shipments/${id}`);
    await auditService.logAction('DELETE', 'SHIPMENT', id, 'Deleted shipment');
    return { success: true };
  },
  async assignAgent(id, agentId) {
    const result = await api.post(`/shipments/${id}/assign`, { agentId });
    await auditService.logAction('UPDATE', 'SHIPMENT', id, `Assigned agent ${agentId}`);
    return result;
  },
  async trackShipment(trackingNumber) {
    return api.get(`/shipments/track/${trackingNumber}`);
  },
  async getShipmentTimeline(id) {
    return api.get(`/tracking/shipment/${id}`);
  },

  // Users
  async getUsers() {
    return api.get('/users');
  },
  async getClients() {
    return api.get('/users?role=CLIENT&isActive=true');
  },
  async createUser(data) {
    const result = await api.post('/users', data);
    await auditService.logAction(
      'CREATE',
      'USER',
      result.id,
      `Created user ${data.name} with role ${data.role}`,
    );
    return result;
  },
  async updateUser(id, data) {
    const result = await api.patch(`/users/${id}`, data);
    await auditService.logAction(
      'UPDATE',
      'USER',
      id,
      `Updated user ${data.name || id} role to ${data.role || 'unchanged'}`,
    );
    return result;
  },
  async toggleUserStatus(id, activate) {
    const result = await api.patch(`/users/${id}/${activate ? 'activate' : 'deactivate'}`);
    await auditService.logAction(
      'UPDATE',
      'USER',
      id,
      `Changed user status to ${activate ? 'active' : 'inactive'}`,
    );
    return result;
  },
  async getUserStats(id) {
    return api.get(`/users/${id}/stats`);
  },

  // Agencies (Admin)
  async getAgencies() {
    return api.get('/users/all/agencies');
  },
  async createAgency(data) {
    const result = await api.post('/users/agencies', data);
    await auditService.logAction('CREATE', 'AGENCY', result.id, `Created agency ${data.name}`);
    return result;
  },
  async updateAgency(id, data) {
    const result = await api.patch(`/users/agencies/${id}`, data);
    await auditService.logAction('UPDATE', 'AGENCY', id, `Updated agency ${data.name || id}`);
    return result;
  },
  async deleteAgency(id) {
    await api.delete(`/users/agencies/${id}`);
    await auditService.logAction('DELETE', 'AGENCY', id, 'Deleted agency');
    return { success: true };
  },

  // Warehouse (Admin)
  async getWarehouses() {
    return api.get('/warehouse');
  },
  async createWarehouse(data) {
    const result = await api.post('/warehouse', data);
    await auditService.logAction(
      'CREATE',
      'WAREHOUSE',
      result.id,
      `Created warehouse ${data.name}`,
    );
    return result;
  },
  async updateWarehouse(id, data) {
    const result = await api.patch(`/warehouse/${id}`, data);
    await auditService.logAction('UPDATE', 'WAREHOUSE', id, `Updated warehouse ${data.name || id}`);
    return result;
  },
  async deleteWarehouse(id) {
    await api.delete(`/warehouse/${id}`);
    await auditService.logAction('DELETE', 'WAREHOUSE', id, 'Deleted warehouse');
    return { success: true };
  },
  async getWarehouseInventory(id) {
    return api.get(`/warehouse/${id}/inventory`);
  },
  async addToInventory(data) {
    const result = await api.post('/warehouse/inventory', data);
    await auditService.logAction(
      'CREATE',
      'INVENTORY',
      result.id,
      `Added shipment ${data.shipmentId} to warehouse ${data.warehouseId}`,
    );
    return result;
  },
  async dispatchFromInventory(id) {
    const result = await api.patch(`/warehouse/inventory/${id}/dispatch`);
    await auditService.logAction('UPDATE', 'INVENTORY', id, 'Dispatched shipment from inventory');
    return result;
  },

  // Billing
  async getInvoiceStats() {
    return api.get('/billing/invoices/stats');
  },
  async getInvoices(query = '', page = 1, limit = 10) {
    const params = new URLSearchParams(query);
    params.append('page', page);
    params.append('limit', limit);
    return api.get(`/billing/invoices?${params.toString()}`);
  },
  async getInvoice(id) {
    return api.get(`/billing/invoices/${id}`);
  },
  async getInvoicePaymentSummary(id) {
    return api.get(`/billing/invoices/${id}/payment-summary`);
  },
  async createInvoice(data) {
    const result = await api.post('/billing/invoices', data);
    await auditService.logAction(
      'CREATE',
      'INVOICE',
      result.id,
      `Created invoice for shipment ${data.shipmentId}`,
    );
    return result;
  },
  async updateInvoice(id, data) {
    const result = await api.patch(`/billing/invoices/${id}`, data);
    await auditService.logAction(
      'UPDATE',
      'INVOICE',
      id,
      `Updated invoice status to ${data.status || 'unknown'}`,
    );
    return result;
  },
  // Tariff Management
  async getTariffs(query = '', page = 1, limit = 10) {
    const params = new URLSearchParams(query);
    params.append('page', page);
    params.append('limit', limit);
    return api.get(`/billing/tariffs?${params.toString()}`);
  },

  async getTariff(id) {
    return api.get(`/billing/tariffs/${id}`);
  },

  async createTariff(data) {
    // Remove null/empty values for optional fields to let DB defaults apply
    const cleanedData = { ...data };
    if (
      cleanedData.ratePerCbm === null ||
      cleanedData.ratePerCbm === undefined ||
      cleanedData.ratePerCbm === ''
    ) {
      delete cleanedData.ratePerCbm;
    }
    if (
      cleanedData.insuranceRate === null ||
      cleanedData.insuranceRate === undefined ||
      cleanedData.insuranceRate === ''
    ) {
      delete cleanedData.insuranceRate;
    }

    const result = await api.post('/billing/tariffs', cleanedData);
    await auditService.logAction(
      'CREATE',
      'TARIFF',
      result.id,
      `Created tariff from ${cleanedData.origin} to ${cleanedData.destination}`,
      localStorage.getItem('userId'),
    );
    return result;
  },

  async updateTariff(id, data) {
    // Remove null/empty values for optional fields to avoid overwriting with null
    const cleanedData = { ...data };
    if (
      cleanedData.ratePerCbm === null ||
      cleanedData.ratePerCbm === undefined ||
      cleanedData.ratePerCbm === ''
    ) {
      delete cleanedData.ratePerCbm;
    }
    if (
      cleanedData.insuranceRate === null ||
      cleanedData.insuranceRate === undefined ||
      cleanedData.insuranceRate === ''
    ) {
      delete cleanedData.insuranceRate;
    }

    const result = await api.patch(`/billing/tariffs/${id}`, cleanedData);
    await auditService.logAction(
      'UPDATE',
      'TARIFF',
      id,
      `Updated tariff from ${cleanedData.origin} to ${cleanedData.destination}`,
      localStorage.getItem('userId'),
    );
    return result;
  },

  async deleteTariff(id) {
    await api.delete(`/billing/tariffs/${id}`);
    await auditService.logAction(
      'DELETE',
      'TARIFF',
      id,
      'Deleted tariff',
      localStorage.getItem('userId'),
    );
    return { success: true };
  },

  // Record a payment for an invoice
  async recordPayment(paymentData) {
    const result = await api.post('/billing/payments', paymentData);
    await auditService.logAction(
      'CREATE',
      'PAYMENT',
      result.id,
      `Recorded payment of ${paymentData.amount} XAF for invoice ${paymentData.invoiceId}`,
      localStorage.getItem('userId'),
    );
    return result;
  },

  // Audit Trail
  async getAuditLogs(query = '', page = 1, limit = 20) {
    const params = new URLSearchParams(query);
    params.append('page', page);
    params.append('limit', limit);
    return api.get(`/audit?${params.toString()}`);
  },

  async getRecentAuditLogs(limit = 10) {
    return api.get(`/audit/recent?limit=${limit}`);
  },
};
