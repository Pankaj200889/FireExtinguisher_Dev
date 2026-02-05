import axios from 'axios';

// Default to localhost for Dev, but allow ENV override
// In Vercel, this should be set to the Railway URL
let API_URL = process.env.NEXT_PUBLIC_API_URL;

// Dynamic configuration for local network testing (Mobile)
if (!API_URL) {
    if (typeof window !== 'undefined') {
        // If running in browser, use the current hostname (e.g., 192.168.1.x)
        API_URL = `http://${window.location.hostname}:8000`;
    } else {
        // Server-side fallback
        API_URL = 'http://localhost:8000';
    }
}

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        // Safe check for browser environment
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
