import axios from 'axios';

const setupAxios = () => {
    const isProd = import.meta.env.PROD;
    axios.defaults.baseURL = import.meta.env.VITE_API_URL || 
                             (isProd ? 'https://rvscas-backend.onrender.com' : '');
    
    axios.defaults.timeout = 30000; // 30 seconds timeout for Render cold starts
    
    axios.interceptors.request.use(
        (config) => {
            console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
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

    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            console.error('[API Error Detail]:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                config: error.config?.url
            });
            return Promise.reject(error);
        }
    );
};

export default setupAxios;
