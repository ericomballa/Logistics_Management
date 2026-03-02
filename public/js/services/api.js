import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { toast } from '../utils/ui.js';

class ApiService {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    // Generate cache key for GET requests
    getCacheKey(endpoint, method) {
        if (method === 'GET') {
            return `${method}:${endpoint}`;
        }
        return null;
    }

    // Clear cache for specific endpoint or all
    clearCache(endpoint = null) {
        if (endpoint) {
            // Clear specific endpoint
            for (let key of this.cache.keys()) {
                if (key.includes(endpoint)) {
                    this.cache.delete(key);
                }
            }
        } else {
            // Clear all cache
            this.cache.clear();
        }
    }

    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = state.get('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Use cache for GET requests
        if (method === 'GET') {
            const cacheKey = this.getCacheKey(endpoint, method);

            // Return cached response if available
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Check if request is already pending to avoid duplicate requests
            if (this.pendingRequests.has(cacheKey)) {
                return this.pendingRequests.get(cacheKey);
            }
        }

        try {
            const options = {
                method,
                headers
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            // Store the promise to avoid duplicate requests
            const requestPromise = fetch(CONFIG.API_BASE_URL + endpoint, options)
                .then(async res => {
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

                    // Cache GET responses for 5 minutes (300,000 ms)
                    if (method === 'GET') {
                        const cacheKey = this.getCacheKey(endpoint, method);
                        this.cache.set(cacheKey, data);

                        // Set timeout to clear cache after 5 minutes
                        setTimeout(() => {
                            this.cache.delete(cacheKey);
                        }, 300000); // 5 minutes

                        // Remove from pending requests
                        this.pendingRequests.delete(cacheKey);
                    }

                    return data;
                })
                .catch(error => {
                    // Remove from pending requests on error
                    const cacheKey = this.getCacheKey(endpoint, method);
                    this.pendingRequests.delete(cacheKey);
                    throw error;
                });

            // Store pending request
            if (method === 'GET') {
                this.pendingRequests.set(this.getCacheKey(endpoint, method), requestPromise);
            }

            return await requestPromise;
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
