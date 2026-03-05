import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token and tenant subdomain to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }

    // Extract subdomain and attach to request for tenant-aware public operations
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 2 || (parts.length >= 2 && !hostname.includes('localhost'))) {
        let subdomain = parts[0];
        if (subdomain === 'www') subdomain = parts[1];
        if (subdomain && subdomain !== 'localhost') {
            config.headers['x-tenant-subdomain'] = subdomain;
        }
    }

    return config;
});

export default api;
