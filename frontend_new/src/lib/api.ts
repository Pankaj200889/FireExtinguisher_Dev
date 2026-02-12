import axios from 'axios';

// Default to localhost for Dev, but allow ENV override
let API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            API_URL = 'http://localhost:8000';
        } else if (hostname.startsWith('192.168.')) {
            API_URL = `http://${hostname}:8000`; // Local network testing
        } else {
            // Production: Use the primary API domain
            API_URL = "https://api.siddhiss.com";
        }
    } else {
        // Server-side fallback (Production)
        API_URL = "https://api.siddhiss.com";
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
