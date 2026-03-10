import axios from 'axios';

const setupAxios = () => {
    // If we have an explicit VITE_API_URL from .env, use it.
    // Otherwise, if we're in development, use empty string to leverage the Vite proxy.
    // If we're in production, use the Render backend URL.
    const isProd = import.meta.env.PROD;
    axios.defaults.baseURL = import.meta.env.VITE_API_URL || 
                             (isProd ? 'https://rvscas-backend.onrender.com' : '');
    
    axios.interceptors.request.use(
        (config) => {
            // Check localStorage inside the interceptor for the latest data
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
};

export default setupAxios;
