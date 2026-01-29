import { api } from './api.js';

export const dataService = {
    // Shipments
    async getShipmentStats() { return api.get('/shipments/stats'); },
    async getShipments(query = '') { return api.get(`/shipments?${query}`); },
    async getShipment(id) { return api.get(`/shipments/${id}`); },
    async createShipment(data) { return api.post('/shipments', data); },
    async updateShipment(id, data) { return api.patch(`/shipments/${id}`, data); },
    async deleteShipment(id) { return api.delete(`/shipments/${id}`); },
    async assignAgent(id, agentId) { return api.post(`/shipments/${id}/assign`, { agentId }); },
    async trackShipment(trackingNumber) { return api.get(`/shipments/track/${trackingNumber}`); },
    async getShipmentTimeline(id) { return api.get(`/tracking/shipment/${id}`); },

    // Users
    async getUsers() { return api.get('/users'); },
    async getClients() { return api.get('/users?role=CLIENT&isActive=true'); },
    async createUser(data) { return api.post('/users', data); },
    async updateUser(id, data) { return api.patch(`/users/${id}`, data); },
    async toggleUserStatus(id, activate) { return api.patch(`/users/${id}/${activate ? 'activate' : 'deactivate'}`); },
    async getUserStats(id) { return api.get(`/users/${id}/stats`); },

    // Agencies (Admin)
    async getAgencies() { return api.get('/users/all/agencies'); },
    async createAgency(data) { return api.post('/users/agencies', data); },
    async updateAgency(id, data) { return api.patch(`/users/agencies/${id}`, data); },
    async deleteAgency(id) { return api.delete(`/users/agencies/${id}`); },

    // Warehouse (Admin)
    async getWarehouses() { return api.get('/warehouse'); },
    async createWarehouse(data) { return api.post('/warehouse', data); },
    async updateWarehouse(id, data) { return api.patch(`/warehouse/${id}`, data); },
    async deleteWarehouse(id) { return api.delete(`/warehouse/${id}`); },
    async getWarehouseInventory(id) { return api.get(`/warehouse/${id}/inventory`); },
    async addToInventory(data) { return api.post('/warehouse/inventory', data); },
    async dispatchFromInventory(id) { return api.patch(`/warehouse/inventory/${id}/dispatch`); },

    // Billing
    async getInvoiceStats() { return api.get('/billing/invoices/stats'); },
    async getInvoices(query = '') { return api.get(`/billing/invoices?${query}`); },
    async getInvoice(id) { return api.get(`/billing/invoices/${id}`); },
    async createInvoice(data) { return api.post('/billing/invoices', data); },
    async updateInvoice(id, data) { return api.patch(`/billing/invoices/${id}`, data); },
    async getTariffs() { return api.get('/billing/tariffs'); }
};
