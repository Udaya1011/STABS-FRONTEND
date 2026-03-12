import axios from 'axios';

const setupAxios = () => {
    // Force absolute URL in production regardless of environment variable
    const isProd = import.meta.env.PROD || window.location.hostname.includes('onrender.com');
    const prodURL = 'https://rvscas-backend.onrender.com';
    
    axios.defaults.baseURL = import.meta.env.VITE_API_URL || (isProd ? prodURL : '');
    
    axios.defaults.timeout = 90000; // Increased to 90s for slow mobile networks and Render wake-up

    axios.interceptors.request.use(
        (config) => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
            // Add cache busting for mobile to prevent stale 'Network Error' responses
            if (config.method === 'get') {
                config.params = { ...config.params, _t: Date.now() };
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.message === 'Network Error') {
                console.error('Critical Network Error - Check Backend URL and CORS');
                // We're in a utility, so we use console.error, but the slices will catch this and toast it
            }
            return Promise.reject(error);
        }
    );
};

export default setupAxios;
