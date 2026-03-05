import axios from 'axios';

const setupAxios = () => {
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
