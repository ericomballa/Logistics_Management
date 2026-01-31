import { api } from './api.js';
import { state } from '../state.js';

export const authService = {
    async login(email, password) {
        const res = await api.post('/auth/login', { email, password });
        if (res.accessToken) {
            state.set('authToken', res.accessToken);
            // Fetch profile immediately
            const user = await api.get('/auth/me');
            state.set('user', user);
        }
        return res;
    },

    async register(name, email, password) {
        return await api.post('/auth/register', { name, email, password });
    },

    logout() {
        state.set('authToken', null);
        state.set('user', null);
        window.location.hash = '#login';
    }
};
