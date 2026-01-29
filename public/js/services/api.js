import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { toast } from '../utils/ui.js';

class ApiService {
    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = state.get('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const options = {
                method,
                headers
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const res = await fetch(CONFIG.API_BASE_URL + endpoint, options);
            const data = await res.json();

            if (!res.ok) {
                // Auto logout on 401
                if (res.status === 401) {
                    state.set('authToken', null);
                    state.set('user', null);
                    window.location.hash = '#login';
                }
                throw new Error(data.message || 'Erreur API inconnue');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    get(endpoint) { return this.request(endpoint, 'GET'); }
    post(endpoint, body) { return this.request(endpoint, 'POST', body); }
    patch(endpoint, body) { return this.request(endpoint, 'PATCH', body); }
    delete(endpoint) { return this.request(endpoint, 'DELETE'); }
}

export const api = new ApiService();
