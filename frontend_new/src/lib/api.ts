import axios from 'axios';

// Default to localhost for Dev, but allow ENV override
// In Vercel, this should be set to the Railway URL
let API_URL = process.env.NEXT_PUBLIC_API_URL;

// Dynamic configuration for local network testing (Mobile)
if (!API_URL) {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // If on Vercel or public domain, do NOT default to localhost/8000
        if (hostname.includes('vercel.app') || hostname.includes('railway.app')) {
            console.log("Using Fallback DEV URL");
            // Fallback to the known DEV backend URL if ENV is missing
            API_URL = "https://fireextinguisherdev-production-8683.up.railway.app";
            console.log("API URL set to:", API_URL);
        } else {
            // Local network testing (e.g., 192.168.x.x)
            API_URL = `http://${hostname}:8000`;
        }
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
