import { api } from './api.js';

class ReportsService {
    /**
     * Get dashboard statistics
     * @returns {Promise<Object>} Dashboard stats with shipments and revenue data
     */
    async getDashboardStats() {
        return await api.get('/reports/dashboard');
    }

    /**
     * Get shipments grouped by status
     * @returns {Promise<Array>} Array of {status, count}
     */
    async getShipmentsByStatus() {
        return await api.get('/reports/shipments/by-status');
    }

    /**
     * Get shipments grouped by origin
     * @returns {Promise<Array>} Array of {origin, count}
     */
    async getShipmentsByOrigin() {
        return await api.get('/reports/shipments/by-origin');
    }

    /**
     * Get revenue report for a specific period
     * @param {string} startDate - Start date in ISO format
     * @param {string} endDate - End date in ISO format
     * @returns {Promise<Object>} Revenue data for the period
     */
    async getRevenue(startDate, endDate) {
        return await api.get(`/reports/revenue?startDate=${startDate}&endDate=${endDate}`);
    }

    /**
     * Get average delivery time
     * @returns {Promise<Object>} Average delivery time data
     */
    async getAverageDeliveryTime() {
        return await api.get('/reports/delivery-time');
    }
}

export const reportsService = new ReportsService();
